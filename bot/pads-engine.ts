/**
 * The Sealed Tomb ($TOMB) engine · Robinhood Chain (4663) · Pons Family v2
 *
 * 1. Indexer: follows every $PADS Transfer, keeps balances and first-buy time, and marks a
 *    wallet "hopped off" forever once it sends $PADS to the curve / a DEX contract.
 * 2. The cycle. Each time the Pons fee escrow reaches the step's size, the engine claims it
 *    (a tongue snap) and spends all of it on that step, then moves to the next:
 *      feeding  (0.01 ETH) → ETH straight to the 10 biggest sitters, split by balance
 *      keeper   (0.02 ETH) → the treasury
 *      sink     (0.01 ETH) → buys $PADS (curve, or Uniswap v4 after graduation) and burns what it bought
 *    then back to feeding.
 * Every transaction hash is saved before it is awaited, so a restart checks the chain and
 * resumes the round instead of sending twice.
 */
import http from "http";
import { ethers } from "ethers";
import { config, saveConfig, state, saveStateNow, saveStateSoon, resetStateForToken, logs, log, CYCLE, type Holder, type Payout, type Round, type RoundKind } from "./store";
import { buildUniswapV4Buy, UNISWAP_V4_UNIVERSAL_ROUTER } from "./uniswap-v4";
import { bylineOf, bylineMessage, claimByline, clearX, issueNonce, mugshotOf, rateLimited, removeByline, setX, spendNonce, xMessage, xOf } from "./byline";
import { backTo, finishLink, parkDemoResult, startLink, takeDemoResult, xDemoEnabled, xEnabled } from "./xlink";

const PONS_FEE_ESCROW = "0xd3AFEB2a57f70eF218Aa82451c51B2fb0416Ac9e";
const DEAD = "0x000000000000000000000000000000000000dEaD".toLowerCase();
const ZERO = ethers.ZeroAddress.toLowerCase();
const TRANSFER_TOPIC = ethers.id("Transfer(address,address,uint256)");
const GAS_BUFFER = ethers.parseEther("0.0008");

const ESCROW_ABI = ["function balanceOf(address) view returns (uint256)", "function claim()"];
const CURVE_ABI = [
  "function buy(uint256 quoteIn, uint256 minTokensOut, address recipient) payable returns (uint256)",
  "function graduated() view returns (bool)",
];
const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
  "function curve() view returns (address)",
];

let provider: ethers.JsonRpcProvider | null = null;
let wallet: ethers.Wallet | null = null;
let status: "standby" | "indexing" | "claiming" | "feeding" | "keeper" | "sinking" | "idle" | "error" = "standby";
let escrowWei = 0n;
let decimals = 18;

const lc = (a: string) => a.toLowerCase();
const isAddr = (a?: string) => !!a && ethers.isAddress(a.trim());
const big = (s: string) => BigInt(s || "0");
const add = (a: string, b: bigint) => (big(a) + b).toString();

function initWallet() {
  provider = new ethers.JsonRpcProvider(config.rpcUrl, 4663, { staticNetwork: true });
  wallet = null;
  if (!config.privateKey) {
    log("warn", "STANDBY: no operator key yet. Set it in /memex.");
    return;
  }
  try {
    wallet = new ethers.Wallet(config.privateKey, provider);
    log("info", `Operator wallet: ${wallet.address}`);
  } catch (e: any) {
    log("error", `Operator key rejected: ${e.message}`);
  }
}
initWallet();

/* ───────────────────────── eligibility ───────────────────────── */

function excluded(): Set<string> {
  const s = new Set<string>([ZERO, DEAD, lc(PONS_FEE_ESCROW), lc(UNISWAP_V4_UNIVERSAL_ROUTER)]);
  if (isAddr(config.curveAddress)) s.add(lc(config.curveAddress));
  if (isAddr(config.treasuryAddress)) s.add(lc(config.treasuryAddress));
  if (isAddr(config.tokenAddress)) s.add(lc(config.tokenAddress));
  if (wallet) s.add(lc(wallet.address));
  for (const a of config.sellSinks) s.add(lc(a));
  return s;
}

function minBalanceRaw() {
  return ethers.parseUnits(config.minBalance || "0", decimals);
}

type Standing = "sitting" | "waiting" | "too-small" | "hopped" | "excluded" | "not-holding";

function standing(addr: string, h: Holder | undefined, now: number, ex = excluded()): Standing {
  if (ex.has(addr) || h?.relay) return "excluded";
  if (!h || big(h.balance) === 0n) return h?.hopped ? "hopped" : "not-holding";
  if (h.hopped) return "hopped";
  if (big(h.balance) < minBalanceRaw()) return "too-small";
  if (now - h.firstIn < config.minHoldHours * 3600) return "waiting";
  return "sitting";
}

function padDays(h: Holder, now: number) {
  return h.firstIn ? Math.floor((now - h.firstIn) / 86400) : 0;
}

/** Every sitter, biggest balance first. The first `feedingTopN` eat at the next feeding. */
function sittersByBalance(now: number) {
  const ex = excluded();
  return Object.entries(state.holders)
    .filter(([a, h]) => standing(a, h, now, ex) === "sitting")
    .map(([addr, h]) => ({ addr, h }))
    .sort((a, b) => (big(b.h.balance) > big(a.h.balance) ? 1 : big(b.h.balance) < big(a.h.balance) ? -1 : a.h.firstIn - b.h.firstIn));
}

const stepETH = (k: RoundKind) => (k === "feeding" ? config.feedingETH : k === "keeper" ? config.keeperETH : config.sinkETH);
const currentKind = () => CYCLE[state.cycle % CYCLE.length];

/* ───────────────────────── indexer ───────────────────────── */

const blockTime = new Map<number, number>();
async function timeOf(n: number) {
  if (!blockTime.has(n)) {
    const b = await provider!.getBlock(n);
    blockTime.set(n, b ? b.timestamp : Math.floor(Date.now() / 1000));
    if (blockTime.size > 5000) blockTime.delete(blockTime.keys().next().value!);
  }
  return blockTime.get(n)!;
}

async function contractAt(addr: string) {
  if (state.isContract[addr] === undefined) {
    const code = await provider!.getCode(addr);
    state.isContract[addr] = code !== "0x";
  }
  return state.isContract[addr];
}

/** The block of the token's mint (Transfer from 0x0). Pons mints the whole supply once, at launch.
 *  Public RPCs here keep no historic state, so this reads logs instead of probing contract code. */
async function findDeployBlock(token: string) {
  const latest = await provider!.getBlockNumber();
  const WINDOW = 9_000_000;
  const mintTopic = ethers.zeroPadValue(ethers.ZeroAddress, 32);
  for (let to = latest; to >= 0; to -= WINDOW) {
    const from = Math.max(0, to - WINDOW + 1);
    const found = await provider!.getLogs({ address: token, topics: [TRANSFER_TOPIC, mintTopic], fromBlock: from, toBlock: to });
    if (found.length) return found[0].blockNumber;
  }
  return latest;
}

const errText = (e: any) => [e?.shortMessage || e?.message || String(e), e?.info?.error?.message, e?.error?.message].filter(Boolean).join(" | ");

let span = 200_000;
async function indexTransfers() {
  if (!provider || !isAddr(config.tokenAddress)) return;
  const token = config.tokenAddress;
  if (!state.lastIndexedBlock) {
    if (!config.startBlock) {
      config.startBlock = await findDeployBlock(token);
      saveConfig();
      log("info", `Token deploy block detected: ${config.startBlock}`);
    }
    state.lastIndexedBlock = config.startBlock - 1;
  }
  const latest = await provider.getBlockNumber();
  const ex = excluded();
  const sinks = new Set(config.sellSinks.map(lc));
  if (isAddr(config.curveAddress)) sinks.add(lc(config.curveAddress));

  while (state.lastIndexedBlock < latest) {
    const from = state.lastIndexedBlock + 1;
    const to = Math.min(latest, from + span - 1);
    let found: ethers.Log[];
    try {
      found = await provider.getLogs({ address: token, topics: [TRANSFER_TOPIC], fromBlock: from, toBlock: to });
      if (span < 2_000_000) span = Math.min(2_000_000, span * 2);
    } catch (e: any) {
      span = Math.max(1_000, Math.floor(span / 4));
      log("warn", `getLogs ${from}-${to} failed (${errText(e)}); shrinking range to ${span}`);
      return;
    }
    for (const l of found) {
      const src = lc(ethers.getAddress("0x" + l.topics[1].slice(26)));
      const dst = lc(ethers.getAddress("0x" + l.topics[2].slice(26)));
      const value = BigInt(l.data);
      const t = await timeOf(l.blockNumber);

      if (src !== ZERO) {
        const h = (state.holders[src] ||= { balance: "0", firstIn: 0, hopped: false, hoppedAt: 0, hoppedTx: "", received: "0" });
        h.balance = (big(h.balance) - value).toString();
        // A contract forwarding what it received in this same tx is a router, not a holder.
        if (!h.relay && h.lastInTx === l.transactionHash && (await contractAt(src))) h.relay = true;
        const isSell = !ex.has(src) && (sinks.has(dst) || (config.contractsAreSells && !ex.has(dst) && dst !== DEAD && (await contractAt(dst))));
        // Sending to the curve itself is always a sell, even though the curve is "excluded" from rewards.
        if (!h.hopped && !h.relay && !ex.has(src) && (isSell || sinks.has(dst))) {
          h.hopped = true;
          h.hoppedAt = t;
          h.hoppedTx = l.transactionHash;
          log("info", `hopped off: ${src.slice(0, 8)}… (tx ${l.transactionHash.slice(0, 10)}…)`);
        }
      }
      if (dst !== ZERO) {
        const h = (state.holders[dst] ||= { balance: "0", firstIn: 0, hopped: false, hoppedAt: 0, hoppedTx: "", received: "0" });
        if (big(h.balance) === 0n && !h.firstIn) h.firstIn = t;
        h.balance = (big(h.balance) + value).toString();
        h.lastInTx = l.transactionHash;
      }
    }
    state.lastIndexedBlock = to;
    saveStateSoon();
  }
}

/* ───────────────────────── sending, once ───────────────────────── */

async function txState(hash: string): Promise<"ok" | "reverted" | "lost"> {
  const r = await provider!.getTransactionReceipt(hash).catch(() => null);
  if (r) return r.status === 1 ? "ok" : "reverted";
  const t = await provider!.getTransaction(hash).catch(() => null);
  if (!t) return "lost";
  const w = await t.wait().catch(() => null);
  return w && w.status === 1 ? "ok" : "reverted";
}

/**
 * Sends a transaction for one slot of a round. The hash is saved before waiting, so after a
 * restart an existing hash is checked on-chain and only re-sent if it reverted or never landed.
 */
async function once(get: () => string, set: (h: string) => void, send: () => Promise<ethers.TransactionResponse>) {
  const prev = get();
  if (prev) {
    if ((await txState(prev)) === "ok") return true;
    set("");
    saveStateNow();
  }
  const tx = await send();
  set(tx.hash);
  saveStateNow();
  const r = await tx.wait();
  return r?.status === 1;
}

/* ───────────────────────── the cycle ───────────────────────── */

let lastWaitNote = "";
function note(msg: string) {
  if (msg !== lastWaitNote) log("info", msg);
  lastWaitNote = msg;
}

/** Tongue snap: claim the escrow for the current step once it is big enough. */
async function startRound() {
  const kind = currentKind();
  const escrow = new ethers.Contract(PONS_FEE_ESCROW, ESCROW_ABI, wallet!);
  if (escrowWei === 0n || escrowWei < ethers.parseEther(stepETH(kind))) return;
  if (kind === "feeding" && sittersByBalance(Math.floor(Date.now() / 1000)).length === 0) {
    note("Feeding is due but no wallet is seated yet. The flies wait in the escrow.");
    return;
  }
  if (kind === "keeper" && !isAddr(config.treasuryAddress)) {
    note("Keeper's turn but no treasury is set. Set it in /memex.");
    return;
  }
  const r: Round = {
    n: (state.rounds[0]?.n || 0) + 1,
    kind,
    at: Math.floor(Date.now() / 1000),
    stage: "claiming",
    claimTx: "",
    claimedWei: escrowWei.toString(),
    payWei: "0",
    snapshotBlock: 0,
    payouts: [],
    treasuryTx: "",
    buyTx: "",
    tokensBought: "0",
    burnTx: "",
    tokensBurned: "0",
    doneAt: 0,
  };
  state.rounds.unshift(r);
  if (state.rounds.length > 500) state.rounds.length = 500;
  status = "claiming";
  log("info", `Round #${r.n} (${kind}): escrow hit ${ethers.formatEther(escrowWei)} ETH. Tongue snap.`);
  await claimRound(r);
}

/** Adds a confirmed step to the totals exactly once. */
function count(r: Round, key: keyof NonNullable<Round["counted"]>, apply: () => void) {
  r.counted ||= {};
  if (r.counted[key]) return;
  apply();
  r.counted[key] = true;
}

function countPayout(p: Payout) {
  if (p.counted) return;
  const h = state.holders[p.addr];
  if (h) h.received = add(h.received, big(p.amount));
  state.totals.fedWei = add(state.totals.fedWei, big(p.amount));
  p.counted = true;
}

async function claimRound(r: Round) {
  const escrow = new ethers.Contract(PONS_FEE_ESCROW, ESCROW_ABI, wallet!);
  const ok = await once(() => r.claimTx, (h) => (r.claimTx = h), () => escrow.claim());
  if (!ok) {
    r.stage = "failed";
    saveStateNow();
    log("error", `Round #${r.n}: claim reverted. Will try again.`);
    return;
  }
  escrowWei = 0n;
  r.stage = "claimed";
  count(r, "claim", () => (state.totals.feesClaimedWei = add(state.totals.feesClaimedWei, big(r.claimedWei))));
  // Spend what was claimed, never the gas buffer the engine needs to keep working.
  const bal = await provider!.getBalance(wallet!.address);
  const spendable = bal > GAS_BUFFER ? bal - GAS_BUFFER : 0n;
  const claimed = big(r.claimedWei);
  r.payWei = (claimed < spendable ? claimed : spendable).toString();
  saveStateNow();
}

async function feed(r: Round) {
  status = "feeding";
  if (!r.payouts.length) {
    const top = sittersByBalance(Math.floor(Date.now() / 1000)).slice(0, config.feedingTopN);
    if (!top.length) return note(`Round #${r.n}: nobody seated right now. Holding the ETH until someone is.`);
    const pay = big(r.payWei);
    const sum = top.reduce((t, s) => t + big(s.h.balance), 0n);
    r.snapshotBlock = state.lastIndexedBlock;
    r.payouts = top.map((s) => ({ addr: s.addr, balance: s.h.balance, amount: ((pay * big(s.h.balance)) / sum).toString(), tx: "" })).filter((p) => big(p.amount) > 0n);
    saveStateNow();
    log("info", `Feeding #${r.n}: ${ethers.formatEther(pay)} ETH to the top ${r.payouts.length} sitters.`);
  }
  for (const p of r.payouts) {
    if (p.skipped || p.counted) continue;
    let sent = false;
    try {
      sent = await once(() => p.tx, (h) => (p.tx = h), () => wallet!.sendTransaction({ to: p.addr, value: big(p.amount) }));
    } catch (e: any) {
      // Only a recipient that refuses ETH (a contract) is skipped; RPC trouble is retried next tick.
      if (e?.code !== "CALL_EXCEPTION") throw e;
    }
    if (sent) countPayout(p);
    else {
      p.skipped = true;
      p.tx = "";
      log("warn", `Feeding #${r.n}: ${p.addr.slice(0, 8)}… refused the ETH. Skipped; its share stays with the engine.`);
    }
    saveStateNow();
  }
  return true;
}

async function keep(r: Round) {
  status = "keeper";
  const pay = big(r.payWei);
  const ok = await once(() => r.treasuryTx, (h) => (r.treasuryTx = h), () => wallet!.sendTransaction({ to: config.treasuryAddress, value: pay }));
  if (!ok) throw new Error(`Round #${r.n}: treasury transfer reverted`);
  count(r, "keeper", () => (state.totals.keeperWei = add(state.totals.keeperWei, pay)));
  log("success", `Keeper #${r.n}: ${ethers.formatEther(pay)} ETH → treasury (${r.treasuryTx})`);
  return true;
}

async function sink(r: Round) {
  status = "sinking";
  if (!isAddr(config.curveAddress)) return note(`Round #${r.n}: waiting for the curve address before buying.`);
  const token = new ethers.Contract(config.tokenAddress, ERC20_ABI, wallet!);
  const pay = big(r.payWei);
  if (!r.buyTx || (await txState(r.buyTx)) !== "ok") {
    // Remember what the wallet already held (e.g. the creator's own bag) so it is never burned.
    if (!r.buyTx) {
      r.heldBefore = ((await token.balanceOf(wallet!.address)) as bigint).toString();
      saveStateNow();
    }
    const curve = new ethers.Contract(config.curveAddress, CURVE_ABI, wallet!);
    const graduated: boolean = await curve.graduated().catch(() => false);
    const ok = await once(
      () => r.buyTx,
      (h) => (r.buyTx = h),
      () =>
        graduated
          ? wallet!.sendTransaction({ to: UNISWAP_V4_UNIVERSAL_ROUTER, value: pay, data: buildUniswapV4Buy(config.tokenAddress, pay), gasLimit: 400000n })
          : curve.buy(pay, 0n, wallet!.address, { value: pay }),
    );
    if (!ok) throw new Error(`Round #${r.n}: buyback reverted`);
    log("info", `Sink #${r.n}: buyback landed (${graduated ? "Uniswap v4" : "curve"}, ${r.buyTx}).`);
  }
  // Also covers a restart between the buy landing and its amount being saved.
  if (big(r.tokensBought) === 0n && r.heldBefore !== undefined && !r.burnTx) {
    const after: bigint = await token.balanceOf(wallet!.address);
    const before = big(r.heldBefore);
    r.tokensBought = (after > before ? after - before : 0n).toString();
    saveStateNow();
    log("info", `Sink #${r.n}: bought ${ethers.formatUnits(big(r.tokensBought), decimals)} $PADS.`);
  }
  count(r, "buy", () => (state.totals.sinkWei = add(state.totals.sinkWei, pay)));
  // Burn exactly what this round bought, never the rest of the wallet.
  const burn = big(r.tokensBought);
  if (burn > 0n) {
    r.tokensBurned = burn.toString();
    const ok = await once(() => r.burnTx, (h) => (r.burnTx = h), () => token.transfer(DEAD, burn));
    if (!ok) throw new Error(`Round #${r.n}: burn reverted`);
    count(r, "burn", () => (state.totals.tokensBurned = add(state.totals.tokensBurned, burn)));
    log("success", `Sink #${r.n}: burned ${ethers.formatUnits(burn, decimals)} $PADS (${r.burnTx})`);
  } else log("warn", `Sink #${r.n}: the buy added no $PADS, nothing to burn.`);
  return true;
}

async function runCycle() {
  if (!wallet || !provider || !isAddr(config.tokenAddress)) return;
  const escrow = new ethers.Contract(PONS_FEE_ESCROW, ESCROW_ABI, wallet);
  escrowWei = await escrow.balanceOf(wallet.address);

  let r = state.rounds[0];
  if (r?.stage === "claiming") await claimRound(r);
  if (!r || r.stage === "done" || r.stage === "failed") {
    await startRound();
    r = state.rounds[0];
  }
  if (!r || r.stage !== "claimed") return;

  // Feedings use a fresh balance book.
  if (r.kind === "feeding" && state.lastIndexedBlock < (await provider.getBlockNumber()) - 5) return;
  const finished = r.kind === "feeding" ? await feed(r) : r.kind === "keeper" ? await keep(r) : await sink(r);
  if (!finished) return;
  r.stage = "done";
  r.doneAt = Math.floor(Date.now() / 1000);
  state.cycle = (CYCLE.indexOf(r.kind) + 1) % CYCLE.length;
  saveStateNow();
  if (r.kind === "feeding") log("success", `Feeding #${r.n} done: ${r.payouts.filter((p) => !p.skipped).length} sitters fed.`);
}

/* ───────────────────────── main loop ───────────────────────── */

let busy = false;
async function tick() {
  if (busy) return;
  busy = true;
  try {
    if (!isAddr(config.tokenAddress)) {
      status = "standby";
      return;
    }
    if (!provider) initWallet();
    const token = new ethers.Contract(config.tokenAddress, ERC20_ABI, provider!);
    if (!isAddr(config.curveAddress)) {
      const c: string = await token.curve().catch(() => "");
      if (isAddr(c) && c !== ethers.ZeroAddress) {
        config.curveAddress = c;
        saveConfig();
        log("info", `Pons curve detected: ${c}`);
      }
    }
    decimals = Number(await token.decimals().catch(() => 18));
    status = "indexing";
    await indexTransfers();
    await runCycle();
    status = "idle";
  } catch (e: any) {
    status = "error";
    log("error", errText(e));
  } finally {
    busy = false;
  }
}

setInterval(tick, config.pollIntervalSeconds * 1000);
tick();

/* ───────────────────────── API ───────────────────────── */

function send(res: http.ServerResponse, code: number, data: unknown) {
  res.writeHead(code, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-admin-secret",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(data));
}

const fmt = (raw: string | bigint) => ethers.formatUnits(typeof raw === "bigint" ? raw : big(raw), decimals);
const ethOf = (raw: string | bigint) => ethers.formatEther(typeof raw === "bigint" ? raw : big(raw));

function counts(now: number) {
  const ex = excluded();
  let sitters = 0;
  let waiting = 0;
  let hopped = 0;
  let holders = 0;
  for (const [a, h] of Object.entries(state.holders)) {
    if (ex.has(a) || h.relay) continue;
    const s = standing(a, h, now, ex);
    if (s === "sitting") sitters++;
    if (s === "waiting" || s === "too-small") waiting++;
    if (h.hopped) hopped++;
    if (big(h.balance) > 0n) holders++;
  }
  return { sitters, waiting, hopped, holders };
}

/** A sitter's share of the next feeding, if it is in the top N right now. */
function estimateNext(addr: string, now: number) {
  const top = sittersByBalance(now).slice(0, config.feedingTopN);
  const me = top.find((s) => s.addr === addr);
  if (!me) return 0n;
  const sum = top.reduce((t, s) => t + big(s.h.balance), 0n);
  return (ethers.parseEther(config.feedingETH) * big(me.h.balance)) / sum;
}

function roundRow(r: Round) {
  const paid = r.payouts.filter((p) => !p.skipped && p.tx).reduce((t, p) => t + big(p.amount), 0n);
  return {
    n: r.n,
    kind: r.kind,
    at: r.at,
    stage: r.stage,
    claimTx: r.claimTx,
    claimedETH: ethOf(r.claimedWei),
    spentETH: ethOf(r.payWei),
    recipients: r.payouts.filter((p) => !p.skipped).length,
    fedETH: ethOf(paid),
    treasuryTx: r.treasuryTx,
    buyTx: r.buyTx,
    burnTx: r.burnTx,
    tokensBurned: fmt(r.tokensBurned),
    tx: r.kind === "feeding" ? r.payouts.find((p) => p.tx)?.tx || "" : r.kind === "keeper" ? r.treasuryTx : r.burnTx || r.buyTx,
    doneAt: r.doneAt,
  };
}

/** nginx forwards the visitor's address in X-Real-IP; direct hits fall back to the socket. */
function clientIp(req: http.IncomingMessage) {
  const fwd = req.headers["x-real-ip"];
  return String((Array.isArray(fwd) ? fwd[0] : fwd) || req.socket.remoteAddress || "");
}

/** Reads a small JSON body (bylines are tiny; anything over 4 KB is refused). */
function readJson(req: http.IncomingMessage, res: http.ServerResponse, done: (d: any) => void) {
  let body = "";
  req.on("data", (c) => {
    body += c;
    if (body.length > 4096) req.destroy();
  });
  req.on("end", () => {
    try {
      done(JSON.parse(body || "{}"));
    } catch {
      send(res, 400, { success: false, error: "Bad request." });
    }
  });
}

/** Set-once fields: once a token/key/treasury is saved, changing it needs ADMIN_SECRET. */
function canChange(current: string, req: http.IncomingMessage) {
  if (!current) return true;
  const secret = process.env.ADMIN_SECRET;
  return !!secret && req.headers["x-admin-secret"] === secret;
}

const server = http.createServer((req, res) => {
  if (req.method === "OPTIONS") return send(res, 204, {});
  const url = new URL(req.url || "/", "http://x");
  const p = url.pathname.replace(/\/$/, "");
  const now = Math.floor(Date.now() / 1000);

  if (req.method === "GET" && p === "/api/status") {
    const kind = currentKind();
    return send(res, 200, {
      success: true,
      data: {
        online: true,
        status,
        walletAddress: wallet?.address || "",
        tokenAddress: config.tokenAddress,
        curveAddress: config.curveAddress,
        treasuryAddress: config.treasuryAddress,
        escrowETH: ethers.formatEther(escrowWei),
        cycle: { index: state.cycle % CYCLE.length, kind, thresholdETH: stepETH(kind), steps: CYCLE.map((k) => ({ kind: k, thresholdETH: stepETH(k) })) },
        rules: { minBalance: config.minBalance, minHoldHours: config.minHoldHours, topN: config.feedingTopN },
        counts: counts(now),
        totals: {
          feesClaimedETH: ethOf(state.totals.feesClaimedWei),
          fedETH: ethOf(state.totals.fedWei),
          keeperETH: ethOf(state.totals.keeperWei),
          sinkETH: ethOf(state.totals.sinkWei),
          tokensBurned: fmt(state.totals.tokensBurned),
        },
        rounds: state.rounds.filter((r) => r.stage === "done").length,
        lastIndexedBlock: state.lastIndexedBlock,
        logs: logs.slice(0, 40),
      },
    });
  }

  if (req.method === "GET" && p === "/api/pond") {
    const limit = Math.min(200, parseInt(url.searchParams.get("limit") || "50", 10) || 50);
    const rows = sittersByBalance(now);
    return send(res, 200, {
      success: true,
      data: {
        total: rows.length,
        topN: config.feedingTopN,
        rows: rows.slice(0, limit).map((r, i) => ({
          rank: i + 1,
          addr: r.addr,
          inTop: i < config.feedingTopN,
          balance: fmt(r.h.balance),
          firstIn: r.h.firstIn,
          padDays: padDays(r.h, now),
          received: ethOf(r.h.received),
          nickname: bylineOf(r.addr),
          pp: mugshotOf(r.addr),
          x: xOf(r.addr),
        })),
      },
    });
  }

  const w = p.match(/^\/api\/wallet\/(0x[0-9a-fA-F]{40})$/);
  if (req.method === "GET" && w) {
    const addr = lc(w[1]);
    const h = state.holders[addr];
    const s = standing(addr, h, now);
    const rank = sittersByBalance(now).findIndex((r) => r.addr === addr);
    return send(res, 200, {
      success: true,
      data: {
        addr,
        status: s,
        balance: h ? fmt(h.balance) : "0",
        firstIn: h?.firstIn || 0,
        padDays: h ? padDays(h, now) : 0,
        received: h ? ethOf(h.received) : "0",
        hoppedAt: h?.hoppedAt || 0,
        hoppedTx: h?.hoppedTx || "",
        eligibleAt: h && h.firstIn ? h.firstIn + config.minHoldHours * 3600 : 0,
        rank: rank === -1 ? null : rank + 1,
        inTop: rank !== -1 && rank < config.feedingTopN,
        topN: config.feedingTopN,
        estNext: ethOf(estimateNext(addr, now)),
        nickname: bylineOf(addr),
        pp: mugshotOf(addr),
        x: xOf(addr),
        xLogin: xEnabled(),
        lastIndexedBlock: state.lastIndexedBlock,
      },
    });
  }

  if (req.method === "GET" && p === "/api/rounds") {
    return send(res, 200, { success: true, data: state.rounds.slice(0, 60).map(roundRow) });
  }

  const rd = p.match(/^\/api\/rounds\/(\d+)$/);
  if (req.method === "GET" && rd) {
    const r = state.rounds.find((x) => x.n === Number(rd[1]));
    if (!r) return send(res, 404, { success: false, error: "No such round" });
    return send(res, 200, { success: true, data: { ...roundRow(r), payouts: r.payouts.map((x) => ({ ...x, balance: fmt(x.balance), amount: ethOf(x.amount) })) } });
  }

  if (req.method === "POST" && (p === "/api/admin/save" || p === "/api/config")) {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      try {
        const d = JSON.parse(body || "{}");
        const refused: string[] = [];
        if (typeof d.tokenAddress === "string" && d.tokenAddress.trim() && lc(d.tokenAddress.trim()) !== lc(config.tokenAddress)) {
          if (!isAddr(d.tokenAddress)) throw new Error("Token address is not a valid address");
          if (!canChange(config.tokenAddress, req)) refused.push("tokenAddress");
          else {
            config.tokenAddress = ethers.getAddress(d.tokenAddress.trim());
            config.curveAddress = "";
            config.startBlock = 0;
            resetStateForToken();
            log("info", `[CONFIG] Token set: ${config.tokenAddress}`);
          }
        }
        if (typeof d.treasuryAddress === "string" && d.treasuryAddress.trim() && lc(d.treasuryAddress.trim()) !== lc(config.treasuryAddress)) {
          if (!isAddr(d.treasuryAddress)) throw new Error("Treasury address is not a valid address");
          if (!canChange(config.treasuryAddress, req)) refused.push("treasuryAddress");
          else {
            config.treasuryAddress = ethers.getAddress(d.treasuryAddress.trim());
            log("info", `[CONFIG] Treasury set: ${config.treasuryAddress}`);
          }
        }
        if (typeof d.privateKey === "string" && d.privateKey.trim()) {
          if (!canChange(config.privateKey, req)) refused.push("privateKey");
          else {
            config.privateKey = d.privateKey.trim();
            initWallet();
            log("info", `[CONFIG] Operator key set. Wallet: ${wallet?.address || "invalid"}`);
          }
        }
        saveConfig();
        return send(res, refused.length ? 403 : 200, {
          success: refused.length === 0,
          refused,
          error: refused.length ? `Already set and locked: ${refused.join(", ")}. Changing them needs the admin secret.` : undefined,
          tokenAddress: config.tokenAddress,
          treasuryAddress: config.treasuryAddress,
          walletAddress: wallet?.address || "",
        });
      } catch (e: any) {
        return send(res, 400, { success: false, error: e.message });
      }
    });
    return;
  }

  /* ───────── bylines: a holder signs a message to set their nickname ───────── */

  if (req.method === "GET" && p === "/api/byline/nonce") {
    const addr = url.searchParams.get("addr") || "";
    if (!isAddr(addr)) return send(res, 400, { success: false, error: "That isn't a wallet address." });
    if (rateLimited(clientIp(req))) return send(res, 429, { success: false, error: "Too many tries. Wait a minute." });
    const { nonce, expiresAt } = issueNonce(addr);
    return send(res, 200, { success: true, data: { nonce, expiresAt, template: bylineMessage(addr, "{nickname}", "{mugshot}", nonce), linkX: xMessage(addr, "link", nonce), unlinkX: xMessage(addr, "unlink", nonce) } });
  }

  /* ───────── X: a signed wallet links its X account; the paper then shows that account ───────── */

  if (req.method === "POST" && p === "/api/x/start") {
    if (!xEnabled()) return send(res, 503, { success: false, error: "X sign-in isn't switched on yet." });
    if (rateLimited(clientIp(req))) return send(res, 429, { success: false, error: "Too many tries. Wait a minute." });
    readJson(req, res, (d) => {
      if (typeof d.addr !== "string" || !isAddr(d.addr)) return send(res, 400, { success: false, error: "That isn't a wallet address." });
      const addr = lc(d.addr);
      const bad = spendNonce(addr, d.nonce, d.signature, (n) => xMessage(addr, "link", n));
      if (bad) return send(res, 400, { success: false, error: bad });
      if (!(big(state.holders[addr]?.balance || "0") > 0n)) return send(res, 400, { success: false, error: "Only wallets holding $TOMB can link X." });
      try {
        return send(res, 200, { success: true, data: { url: startLink(addr) } });
      } catch (e: any) {
        return send(res, 503, { success: false, error: e.message });
      }
    });
    return;
  }

  if (req.method === "GET" && p === "/api/x/callback") {
    const go = (to: string) => {
      res.writeHead(302, { Location: to, "Cache-Control": "no-store" });
      res.end();
    };
    const st = url.searchParams.get("state") || "";
    const code = url.searchParams.get("code") || "";
    if (!xEnabled() || !st || !code) {
      return go(backTo("", url.searchParams.get("error") === "access_denied" ? "cancelled" : "failed"));
    }
    finishLink(st, code)
      .then(({ addr, x, demo }) => {
        // A demo sign-in is shown on the page once and never saved to the bylines.
        if (demo) return go(backTo(addr, "demo", { xdemo: parkDemoResult(x) }));
        setX(addr, x);
        log("info", `[X] ${addr.slice(0, 8)}… linked @${x.username}${x.verified ? ` (${x.verified})` : ""}`);
        go(backTo(addr, "linked"));
      })
      .catch((e: any) => {
        log("warn", `[X] link failed: ${e?.message || e}`);
        go(backTo(e?.addr || "", e?.message === "expired" ? "expired" : "failed"));
      });
    return;
  }

  /* Illustration edition: a real X sign-in to try the link, with nothing saved. Off unless X_DEMO=1. */
  if (req.method === "POST" && p === "/api/x/demo/start") {
    if (!xDemoEnabled()) return send(res, 503, { success: false, error: "Real X sign-in isn't switched on for the demo." });
    if (rateLimited(clientIp(req))) return send(res, 429, { success: false, error: "Too many tries. Wait a minute." });
    readJson(req, res, (d) => {
      const addr = typeof d.addr === "string" && isAddr(d.addr) ? lc(d.addr) : "";
      try {
        return send(res, 200, { success: true, data: { url: startLink(addr, true) } });
      } catch (e: any) {
        return send(res, 503, { success: false, error: e.message });
      }
    });
    return;
  }

  if (req.method === "GET" && p === "/api/x/demo/result") {
    const x = takeDemoResult(url.searchParams.get("code") || "");
    if (!x) return send(res, 404, { success: false, error: "That X sign-in expired. Try again." });
    return send(res, 200, { success: true, data: x });
  }

  if (req.method === "POST" && p === "/api/x/unlink") {
    if (rateLimited(clientIp(req))) return send(res, 429, { success: false, error: "Too many tries. Wait a minute." });
    readJson(req, res, (d) => {
      if (typeof d.addr !== "string" || !isAddr(d.addr)) return send(res, 400, { success: false, error: "That isn't a wallet address." });
      const addr = lc(d.addr);
      const bad = spendNonce(addr, d.nonce, d.signature, (n) => xMessage(addr, "unlink", n));
      if (bad) return send(res, 400, { success: false, error: bad });
      clearX(addr);
      log("info", `[X] ${addr.slice(0, 8)}… unlinked X`);
      return send(res, 200, { success: true, data: { unlinked: true } });
    });
    return;
  }

  if (req.method === "POST" && p === "/api/byline") {
    if (rateLimited(clientIp(req))) return send(res, 429, { success: false, error: "Too many tries. Wait a minute." });
    readJson(req, res, (d) => {
      const out = claimByline(d, (addr) => big(state.holders[addr]?.balance || "0") > 0n);
      if (out.error) return send(res, 400, { success: false, error: out.error });
      log("info", `[BYLINE] ${String(d.addr).slice(0, 8)}… is now "${out.name}"`);
      return send(res, 200, { success: true, data: { nickname: out.name, pp: out.pp } });
    });
    return;
  }

  if (req.method === "POST" && p === "/api/admin/byline/remove") {
    const secret = process.env.ADMIN_SECRET;
    if (!secret || req.headers["x-admin-secret"] !== secret) return send(res, 403, { success: false, error: "Admin secret required." });
    readJson(req, res, (d) => {
      if (typeof d.addr !== "string" || !isAddr(d.addr)) return send(res, 400, { success: false, error: "That isn't a wallet address." });
      const had = removeByline(d.addr);
      log("info", `[BYLINE] removed for ${d.addr.slice(0, 8)}…`);
      return send(res, 200, { success: true, data: { removed: had } });
    });
    return;
  }

  return send(res, 404, { success: false, error: "Not Found" });
});

server.listen(config.port, "127.0.0.1", () => {
  log("info", `$PADS engine API on 127.0.0.1:${config.port} · ${isAddr(config.tokenAddress) ? `token ${config.tokenAddress}` : "STANDBY (set the token in /memex)"}`);
});

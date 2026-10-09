import { useEffect, useState } from "react";

export type RoundKind = "feeding" | "keeper" | "sink";

export interface Status {
  online: boolean;
  status: string;
  walletAddress: string;
  tokenAddress: string;
  curveAddress: string;
  treasuryAddress: string;
  escrowETH: string;
  cycle: { index: number; kind: RoundKind; thresholdETH: string; steps: { kind: RoundKind; thresholdETH: string }[] };
  rules: { minBalance: string; minHoldHours: number; topN: number };
  counts: { sitters: number; waiting: number; hopped: number; holders: number };
  totals: { feesClaimedETH: string; fedETH: string; keeperETH: string; sinkETH: string; tokensBurned: string };
  rounds: number;
  lastIndexedBlock: number;
  logs?: { t: number; type: string; msg: string }[];
}

/** A wallet's linked X account. Copied from X, so the holder can't edit it. */
export interface XProfile {
  username: string;
  name: string;
  avatar: string;
  /** X's badge: "blue", "business", "government", or "" for none. */
  verified: string;
}

export interface PondRow {
  rank: number;
  addr: string;
  inTop: boolean;
  balance: string;
  firstIn: number;
  padDays: number;
  /** ETH received from feedings. */
  received: string;
  /** The holder's carved throne name, empty when unclaimed (the site then shows a royal alias). */
  nickname?: string;
  /** Chosen mask parts [material, crown, regalia, backdrop]; null means the generated one. */
  pp?: number[] | null;
  /** Linked X account; when set it replaces the throne name and mask. */
  x?: XProfile | null;
}

export interface WalletInfo {
  addr: string;
  status: "sitting" | "waiting" | "too-small" | "hopped" | "excluded" | "not-holding";
  balance: string;
  firstIn: number;
  padDays: number;
  received: string;
  hoppedAt: number;
  hoppedTx: string;
  eligibleAt: number;
  rank: number | null;
  inTop: boolean;
  topN: number;
  /** ETH this wallet would get from the next feeding at today's balances. */
  estNext: string;
  nickname?: string;
  pp?: number[] | null;
  x?: XProfile | null;
  /** Whether the engine has X sign-in switched on. */
  xLogin?: boolean;
  lastIndexedBlock: number;
}

export interface RoundRow {
  n: number;
  kind: RoundKind;
  at: number;
  stage: "claiming" | "claimed" | "done" | "failed";
  claimTx: string;
  claimedETH: string;
  spentETH: string;
  recipients: number;
  fedETH: string;
  treasuryTx: string;
  buyTx: string;
  burnTx: string;
  tokensBurned: string;
  tx: string;
  doneAt: number;
}

/** The cycle, in plain names. */
export const STEP: Record<RoundKind, { name: string; does: string }> = {
  feeding: { name: "The tribute", does: "ETH to the 10 biggest blocks" },
  keeper: { name: "Builders' share", does: "to the builders' treasury" },
  sink: { name: "Into the afterlife", does: "buy $TOMB and burn it" },
};

export const DEFAULT_STEPS: Status["cycle"]["steps"] = [
  { kind: "feeding", thresholdETH: "0.01" },
  { kind: "keeper", thresholdETH: "0.02" },
  { kind: "sink", thresholdETH: "0.01" },
];

/** Share of all fees each step gets over one full cycle, in whole percent. */
export function stepShare(steps: Status["cycle"]["steps"], kind: RoundKind) {
  const total = steps.reduce((t, s) => t + parseFloat(s.thresholdETH), 0);
  const mine = steps.filter((s) => s.kind === kind).reduce((t, s) => t + parseFloat(s.thresholdETH), 0);
  return total > 0 ? Math.round((mine / total) * 100) : 0;
}

export const EXPLORER = "https://explorer.mainnet.chain.robinhood.com";
export const ponsUrl = (ca: string) => `https://ponsfamily.com/launchpad/${ca}`;
export const dexUrl = (ca: string) => `https://dexscreener.com/robinhood/${ca}`;
export const X_URL = "https://x.com/pepadsrh";
export const txUrl = (tx: string) => `${EXPLORER}/tx/${tx}`;
export const addrUrl = (a: string) => `${EXPLORER}/address/${a}`;

/** ?demo=1 renders labelled illustration data so the page can be judged before launch. */
/**
 * Illustration edition. On with ?demo, or for everyone when index.html carries
 * <meta name="rh-mode" content="demo"> (flip that one line on the server; no rebuild).
 * ?live always shows the real paper.
 */
export const DEMO = (() => {
  if (typeof window === "undefined") return false;
  const q = new URLSearchParams(window.location.search);
  if (q.has("live")) return false;
  return q.has("demo") || document.querySelector('meta[name="rh-mode"]')?.getAttribute("content") === "demo";
})();

/** What a visitor sets in the illustration edition: kept on this page only, never sent anywhere. */
const demoBylines: Record<string, { nickname?: string; pp?: number[] | null; x?: XProfile | null }> = {};
export function demoSaveByline(addr: string, patch: { nickname?: string; pp?: number[] | null; x?: XProfile | null }) {
  const a = addr.toLowerCase();
  demoBylines[a] = { ...demoBylines[a], ...patch };
  window.dispatchEvent(new Event("rbank:refresh"));
}

async function get<T>(path: string): Promise<T> {
  const r = await fetch(path, { cache: "no-store" });
  const j = await r.json();
  if (!j.success) throw new Error(j.error || "Request failed");
  return j.data as T;
}

export function usePoll<T>(path: string | null, every = 15000, demo?: () => T) {
  const [data, setData] = useState<T | null>(DEMO && demo ? demo() : null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    // The illustration edition reprints from its own data when a visitor saves a byline.
    if (DEMO && demo) {
      const again = () => setData(demo());
      window.addEventListener("rbank:refresh", again);
      return () => window.removeEventListener("rbank:refresh", again);
    }
    if (DEMO || !path) return;
    let alive = true;
    const run = () =>
      get<T>(path)
        .then((d) => alive && (setData(d), setError(null)))
        .catch((e) => alive && setError(e.message));
    run();
    const id = setInterval(run, every);
    // A claimed byline asks every board to reprint right away.
    window.addEventListener("rbank:refresh", run);
    return () => {
      alive = false;
      clearInterval(id);
      window.removeEventListener("rbank:refresh", run);
    };
  }, [path, every]);
  return { data, error, loading: !data && !error };
}

/** Step 1 of a byline claim: the server issues a one-time nonce and the exact text to sign. */
export const bylineNonce = (addr: string) => get<{ nonce: string; expiresAt: number; template: string; linkX: string; unlinkX: string }>(`/api/byline/nonce?addr=${addr}`);

async function post<T>(path: string, body: unknown, fallback: string): Promise<T> {
  const r = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({ success: false, error: "The engine didn't answer." }));
  if (!j.success) throw new Error(j.error || fallback);
  return j.data as T;
}

/** Link X: the wallet's signature buys an X sign-in URL; X sends the browser back to the card. */
export const startXLink = (addr: string, nonce: string, signature: string) => post<{ url: string }>("/api/x/start", { addr, nonce, signature }, "Couldn't start X sign-in.");
export const unlinkX = (addr: string, nonce: string, signature: string) => post<{ unlinked: boolean }>("/api/x/unlink", { addr, nonce, signature }, "Couldn't unlink X.");

export const xUrl = (username: string) => `https://x.com/${username}`;

/** Illustration edition: a real X sign-in whose profile is shown once and never saved. */
export const startXDemo = (addr: string) => post<{ url: string }>("/api/x/demo/start", { addr }, "Couldn't start X sign-in.");
export const takeXDemo = (code: string) => get<XProfile>(`/api/x/demo/result?code=${encodeURIComponent(code)}`);

/** Step 2: send the signature; the server rebuilds the text, checks the signer and the rules. */
export async function claimByline(addr: string, nickname: string, pp: number[], nonce: string, signature: string) {
  const r = await fetch("/api/byline", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ addr, name: nickname, pp, nonce, signature }),
  });
  const j = await r.json().catch(() => ({ success: false, error: "The engine didn't answer." }));
  if (!j.success) throw new Error(j.error || "Couldn't carve the throne name.");
  return j.data as { nickname: string; pp: number[] };
}

export const fetchWallet = (addr: string) => (DEMO ? Promise.resolve(demoWallet(addr)) : get<WalletInfo>(`/api/wallet/${addr}`));

/* ───────── formatting ───────── */

export function short(addr: string) {
  return addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "";
}

export function amount(v: string | number, digits = 0) {
  const n = typeof v === "string" ? parseFloat(v) : v;
  if (!isFinite(n)) return "0";
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  return n.toLocaleString("en-US", { maximumFractionDigits: digits });
}

/** Fits a 5-tile flap: 1.9M, 630K, 940. */
export function compact(v: string | number) {
  const n = typeof v === "string" ? parseFloat(v) : v;
  if (!isFinite(n) || n <= 0) return "0";
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1)}M`;
  if (n >= 1e3) return `${Math.round(n / 1e3)}K`;
  return String(Math.round(n));
}

export function eth(v: string, digits = 4) {
  const n = parseFloat(v || "0");
  return `${n.toFixed(n > 0 && n < 0.0001 ? 6 : digits)} ETH`;
}

export function dateWib(sec: number) {
  return new Date(sec * 1000).toLocaleString("en-GB", { timeZone: "Asia/Jakarta", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

/* ───────── illustration data (only with ?demo=1, always labelled on the page) ───────── */

const now = () => Math.floor(Date.now() / 1000);

export const demoStatus = (): Status => ({
  online: true,
  status: "idle",
  walletAddress: "0x5175D9e2b0A4c8E6f1d3B7a9C2e4F6081a3c5E7b",
  tokenAddress: "0x9d2f4c81b7e3a6150c8f2e4d6b9a1c3e5f7d0a2b",
  curveAddress: "0x3c8e1f5a7b9d2c4e6f8a0b1c3d5e7f9a2b4c6d8e",
  treasuryAddress: "0x7a1c3e5f9b2d4f6a8c0e2b4d6f8a1c3e5b7d9f0a",
  escrowETH: "0.0063",
  cycle: { index: 0, kind: "feeding", thresholdETH: "0.01", steps: DEFAULT_STEPS },
  rules: { minBalance: "100000", minHoldHours: 1, topN: 10 },
  counts: { sitters: 87, waiting: 23, hopped: 41, holders: 151 },
  totals: { feesClaimedETH: "0.4817", fedETH: "0.1204", keeperETH: "0.2409", sinkETH: "0.1204", tokensBurned: "6912204.8" },
  rounds: 36,
  lastIndexedBlock: 82931447,
});

const seedAddrs = [
  "0x4be1a07c93d2e5f8a1b6c0d9e3f7a2b5c8d1e4f6",
  "0xa3f90c27b84d1e6f5a9c2b0d7e3f1a8c4b6d9e2f",
  "0x1d77e4b0c9a2f5e8d3b6a1c0f9e7d2b4a6c8e1f3",
  "0xc0ffe8a1d4b7e2f9c6a3d0b5e8f1a4c7d2b9e6f3",
  "0x76b2d9e4f1a8c3b6d0e5f2a9c7b4d1e8f6a3c0b5",
  "0xe9a41c7d2f5b8e0a3c6d9f2b5e8a1d4c7f0b3e6a",
  "0x2f8c5a1e7d4b0f3a6c9e2d5b8f1a4e7c0d3b6a9f",
  "0xb6e3f0a7d4c1b8e5f2a9d6c3b0e7f4a1d8c5b2e9",
  "0x58d1a4e7b0c3f6a9d2e5b8c1f4a7d0e3b6c9f2a5",
  "0xd2c9f6a3e0b7d4a1c8f5e2b9d6a3c0f7e4b1d8a5",
  "0x93a6d0e3b7f1c4a8e2d5b9f3c6a0e4d7b1f5c8a2",
  "0x0e7b4d1a8f5c2e9b6d3a0f7c4e1b8d5a2f9c6e3b",
];

export const demoPond = (): { total: number; topN: number; rows: PondRow[] } => {
  const base = seedPond();
  const rows = base.rows.map((row) => ({ ...row, ...demoBylines[row.addr.toLowerCase()] }));
  // A visitor who tries the booth with their own wallet joins the pyramid, inside the capstone.
  for (const [addr, b] of Object.entries(demoBylines)) {
    if (rows.some((row) => row.addr.toLowerCase() === addr)) continue;
    rows.push({ rank: 0, addr, inTop: true, balance: String(3.5e6), firstIn: now() - 5 * 86400, padDays: 5, received: "0.0123", nickname: "", pp: null, x: null, ...b });
  }
  rows.sort((a, b) => parseFloat(b.balance) - parseFloat(a.balance));
  rows.forEach((row, i) => ((row.rank = i + 1), (row.inTop = i < 10)));
  return { ...base, rows };
};

const seedPond = (): { total: number; topN: number; rows: PondRow[] } => {
  const days = [26, 25, 23, 26, 21, 19, 17, 14, 12, 9, 6, 3];
  const bal = [9.4e6, 6.6e6, 4.8e6, 3.1e6, 2.4e6, 1.7e6, 1.2e6, 0.82e6, 0.56e6, 0.4e6, 0.31e6, 0.24e6];
  const rec = [0.0391, 0.0262, 0.0207, 0.0141, 0.0098, 0.0071, 0.0049, 0.0031, 0.0022, 0.0014, 0.0006, 0];
  return {
    total: 87,
    topN: 10,
    rows: seedAddrs.map((addr, i) => ({
      rank: i + 1,
      addr,
      inTop: i < 10,
      balance: String(bal[i]),
      firstIn: now() - days[i] * 86400 - 3600 * i,
      padDays: days[i],
      received: String(rec[i]),
      nickname: ["Stone-Hand Seti", "", "sandpaws", "", "", "Meryt Never-Sold", "", "", "", "", "", ""][i] || "",
      pp: [[1, 4, 3, 3], null, [2, 0, 2, 4], null, null, [4, 2, 4, 5], null, null, null, null, null, null][i],
      x: [null, { username: "capstonewhale", name: "Capstone Whale", avatar: "/favicon-192.png", verified: "blue" }, null, null, { username: "kohl_eyed", name: "Kohl Eyed", avatar: "", verified: "" }, null, null, null, null, null, null, null][i],
    })),
  };
};

const demoHash = (k: number) => `0x${(k * 104729 + 17).toString(16).padStart(8, "0")}c3e5a7b9d1f2a4c6e8b0d2f4a6c8e1b3d5f7a9c2e4b6d8f0a1c3e5b7d9f2a4c6`.slice(0, 66);

export const demoRounds = (): RoundRow[] =>
  Array.from({ length: 12 }, (_, k) => {
    const n = 36 - k;
    const kind = (["sink", "keeper", "feeding"] as const)[k % 3];
    const claimed = kind === "keeper" ? 0.0207 : 0.0104 + (k % 4) * 0.0003;
    return {
      n,
      kind,
      at: now() - k * 5400 - 900,
      stage: "done" as const,
      claimTx: demoHash(k),
      claimedETH: claimed.toFixed(4),
      spentETH: claimed.toFixed(4),
      recipients: kind === "feeding" ? 10 : 0,
      fedETH: kind === "feeding" ? claimed.toFixed(4) : "0",
      treasuryTx: kind === "keeper" ? demoHash(k + 50) : "",
      buyTx: kind === "sink" ? demoHash(k + 90) : "",
      burnTx: kind === "sink" ? demoHash(k + 130) : "",
      tokensBurned: kind === "sink" ? String(520000 + k * 13100) : "0",
      tx: demoHash(k + 200),
      doneAt: now() - k * 5400 - 840,
    };
  });

export function demoWallet(addr: string): WalletInfo {
  const pond = demoPond();
  const row = pond.rows.find((r) => r.addr.toLowerCase() === addr.toLowerCase());
  const hopped = addr.toLowerCase().endsWith("dead");
  const base = { addr, hoppedAt: 0, hoppedTx: "", eligibleAt: 0, topN: 10, lastIndexedBlock: 82931447 };
  if (hopped)
    return { ...base, status: "hopped", balance: "0", firstIn: now() - 12 * 86400, padDays: 12, received: "0.0042", hoppedAt: now() - 2 * 86400, hoppedTx: demoHash(3), rank: null, inTop: false, estNext: "0" };
  const top = pond.rows.filter((r) => r.inTop).reduce((t, r) => t + parseFloat(r.balance), 0);
  const bal = row ? parseFloat(row.balance) : 410000;
  const rank = row?.rank ?? 34;
  const inTop = rank <= 10;
  return {
    ...base,
    status: "sitting",
    balance: String(bal),
    firstIn: row?.firstIn ?? now() - 8 * 86400,
    padDays: row?.padDays ?? 8,
    received: row?.received ?? "0",
    rank,
    inTop,
    nickname: row?.nickname ?? "",
    pp: row?.pp ?? null,
    x: row?.x ?? null,
    xLogin: true,
    estNext: inTop ? String((0.01 * bal) / top) : "0",
  };
}

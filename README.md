# The Sealed Tomb · $TOMB

Memecoin site + engine for **$TOMB · The Sealed Tomb** (Robinhood Chain 4663, launched on Pons; rebranded from Robin Heist/$RBANK before its launch on 9 Oct 2026, and from Pepads/$PADS before that, see `CONCEPT.md`). Design system: `DESIGN.md`. Creator fees run a three-step loop: ETH straight to the **10 biggest wallets that never sold**, the keeper's cut to the treasury, then a buyback burn. Concept: `CONCEPT.md`. Product truth: `PRODUCT.md`.

## Run locally

```bash
npm install
npm run bot          # engine + API on 127.0.0.1:5023 (standby until /memex is filled)
npm run dev          # site on http://localhost:5183 (proxies /api to 5023)
```

- `http://localhost:5183/?demo=1` shows labelled illustration data (amber strip at the top). Never share demo screenshots as real numbers.
- `http://localhost:5183/memex` is the engine room.

## Engine (`bot/pads-engine.ts`)

| Step | What happens |
|---|---|
| Indexer | Follows every `$PADS` Transfer from the mint block. Tracks balance, first-buy time, hopped-off flag. Contracts that relay tokens within one tx (routers) are recognised and never counted as holders. |
| Hopped off | A wallet that sends `$PADS` to the Pons curve, a DEX, or any other contract is marked hopped off forever. Wallet-to-wallet is fine. |
| The cycle | Each time the Pons fee escrow reaches the current step's size, the engine claims it (tongue snap) and spends all of it on that step, then moves on: **feeding** `FEEDING_ETH` (0.01) → ETH to the top `FEEDING_TOP_N` (10) sitters by balance, split by balance · **keeper** `KEEPER_ETH` (0.02) → treasury · **sink** `SINK_ETH` (0.01) → buy $PADS (curve, or Uniswap v4 after graduation) and send exactly what was bought to 0x…dEaD (the operator wallet's own bag is never touched) · back to feeding. |
| Sitters | Never hopped off, balance ≥ `MIN_BALANCE`, first $PADS at least `MIN_HOLD_HOURS` old (live engine: 0, set 8 Oct 2026 so a full escrow pays out at once). |
| Restarts | Every tx hash is saved before it is awaited; a restart checks the chain and resumes the round, so nothing is sent or counted twice. A recipient that refuses ETH is skipped and its share stays with the engine. |

Settings come from env or `bot-config.json` (see `.env.example`). Token, operator key and treasury are **set once** in `/memex`; changing them later needs `ADMIN_SECRET` in the header.

API: `GET /api/status`, `/api/pond?limit=` (sitters by balance), `/api/wallet/:addr`, `/api/rounds`, `/api/rounds/:n`; `POST /api/admin/save`.

Tested read-only on 8 Oct 2026 against live Pons tokens (no key, no transactions): indexing, mint-block detection, router and sell detection, and the top-10 ranking matched the chain. Claiming and sending are not yet exercised on mainnet: watch the first full cycle.

## Deploy (same VPS pattern as the other sites)

Port **5023** is free (5015–5022 are taken). Domain: **pepads.fun**.

```bash
# site
npm run build
rsync -az --delete -e "ssh -o BatchMode=yes" dist/ root@72.61.210.75:/var/www/pepads.fun/dist/

# engine
rsync -az -e "ssh -o BatchMode=yes" bot package.json package-lock.json root@72.61.210.75:/var/www/pads-engine/
ssh root@72.61.210.75 "cd /var/www/pads-engine && npm ci --omit=dev && PORT=5023 pm2 start node_modules/.bin/tsx --name pads-engine -- bot/pads-engine.ts && pm2 save"
```

nginx: new `/etc/nginx/sites-available/pepads.fun` serving `dist/` with `try_files $uri /index.html;` and `location /api/ { proxy_pass http://127.0.0.1:5023; }`, then Certbot. Don't touch other sites' configs.

## Launch checklist

1. Launch $PADS on Pons **from the wallet whose key goes into the engine** (creator fees only reach the launching wallet).
2. Put ~0.002 ETH gas in it.
3. `/memex` → CA, key, treasury → Save. Check `/api/status` shows the token and an indexed block.
4. The first feeding snaps once the escrow reaches 0.01 ETH and at least one wallet has held for an hour.

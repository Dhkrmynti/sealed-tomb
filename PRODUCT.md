# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Delegated (chosen to match the owner's other token sites so the VPS deploy flow stays identical): Vite + React + TypeScript static site, GSAP + ScrollTrigger for scroll motion, served by nginx from `/var/www/pepads.fun/dist`. Bot: Node + `tsx` + ethers v6 under pm2, HTTP API on its own port, proxied at `/api/`.

## Users

- **Primary:** memecoin traders on Robinhood Chain arriving from X/Telegram, mostly on phones. Their job: understand in seconds what holding $TOMB does for them, copy the CA, buy on Pons.
- **Secondary:** holders ("sitters") checking their own wallet: still sitting or hopped off, pad days, how many $PADS they've received, what tonight's feeding might bring.
- **Operator:** the creator, using the hidden `/memex` route to configure the engine.

## Product Purpose

$TOMB is a memecoin on Robinhood Chain (chain ID 4663, launched on Pons Family v2) whose creator fees run a loop. A 24/7 bot claims the creator fees (ETH) from the Pons fee escrow whenever it reaches the next step's size and spends it on that step: a **feeding** (ETH straight to the 10 biggest wallets that have **never sold**), the **keeper's cut** (treasury), then the **sink** (buy $TOMB back and burn it). Selling (sending $TOMB to the Pons curve or the DEX pool) permanently disqualifies a wallet. The website is a read-only tracker and wallet checker plus landing page. Success: a visitor understands "hold big and never sell → the capstone gets the tribute in ETH", finds their block, and buys.

Full concept: `CONCEPT.md`.

## Positioning

Every other fee-engine token on the owner's VPS burns. $PADS rewards patience directly and visibly: the leaderboard, the per-wallet checker and the daily feeding log (with tx hashes) prove it, on-chain, every day.

## Operating Context

- Traders compare tokens on Pons launchpad and DexScreener; they live on X.
- Ritual: every feeding → X post with the ETH sent and the tx.
- Infra: shared VPS `72.61.210.75` (nginx + Certbot + pm2) hosting ~15 other token sites; never touch their configs or processes.

## Capabilities and Constraints

- Engine pieces reused from the existing burn bots: escrow polling/claim, curve buy (pre-graduation) and Uniswap v4 buy (post-graduation), `/api/status`, `/memex` config.
- New pieces: Transfer-log indexer, sell detection, fee split, daily snapshot + pro-rata distribution (idempotent, resumable), `/api/pond`, `/api/wallet/:addr`, `/api/feedings`.
- Eligibility (proposed defaults, owner may change): balance ≥ 100,000 $PADS; never sent $PADS to curve/pool; first buy ≥ 24 h before snapshot. Excluded: curve, pool, bot wallet, 0x…dEaD, creator, treasury.
- Fee cycle (owner decision, 8 Oct 2026): feeding 0.01 ETH → ETH to the 10 biggest sitters by balance, split by balance; keeper 0.02 ETH → treasury; sink 0.01 ETH → buyback and burn; repeat. Over a full cycle that is 25% / 50% / 25%, shown openly.
- Sitters: never sold, ≥ 100,000 $PADS, first $PADS ≥ 1 hour old. Wallet-to-wallet transfers are not sells; the receiving wallet starts at 0 pad days.
- The token must be launched from the same wallet whose private key goes into the bot.
- X: **@pepadsrh** (x.com/pepadsrh).
- Open decisions: minimum balance, hold time.

## Brand Commitments

- Name **The Sealed Tomb**, ticker **$TOMB** (rebrand from Robin Heist/$RBANK before its launch, 9 Oct 2026; earlier Pepads/$PADS). Domain and X handle not chosen yet. Mascot **the Pharaoh**: original; every holder wears a royal mask (material, crown, regalia, backdrop). Tagline **"what goes in the tomb stays in the tomb."**, sub-line "never sell."
- **Parody, not finance.** Never call the tribute a dividend, holders shareholders, or $TOMB an investment. Keep "memecoin, no promise of value" and "not a security, not a dividend" visible. The pyramid must never read as recruitment: say plainly that nobody earns anything for bringing anyone in.
- **No borrowed IP.** No Tutankhamun mask replica, no film or game pharaohs, no other project's art. Historical Egyptian regalia (nemes, crowns, ankh, uraeus) are fine.
- Lore terms: fees → **offerings**; claim → **the rite**; step 1 (ETH to top 10) → **the tribute**; step 2 (treasury) → **builders' share** (always shown openly); step 3 (buyback + burn) → **into the afterlife**; eligible holders → **sealed** blocks; still under hold time → **curing**; under minimum → **loose stone**; sold → **cursed**; excluded contracts → **overseers**; top 10 → **the capstone**; leaderboard → **the pyramid**; wallet check → **your block**; nickname → **throne name**; mugshot booth → **mask workshop**; generated name → **royal alias**; history → **the inscriptions**.
- Voice: degen CT, calm, a little grand ("the rite ran. the capstone got paid.").

## Evidence on Hand

- None yet: no token, CA, holders, feedings, domain, or X account. Pre-launch the site must show empty/standby states honestly; any demo numbers must be labelled as illustration.
- Do not invent holders, testimonials, partners, yields, APY, or price claims. Never use the words yield, APY, passive income, dividend.

## Product Principles

1. Prove, don't promise: every number on the site comes from the bot API / chain, with tx links.
2. Patience is the hero: the design rewards and celebrates holding, never trading.
3. Honest about the keeper's cut and about empty days.
4. Lore makes the mechanism instantly legible, never obscures it.

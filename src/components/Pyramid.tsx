import { useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { SealCheck } from "@phosphor-icons/react";
import { amount, compact, demoPond, short, usePoll, type PondRow, type Status } from "../lib/api";
import { prefersReducedMotion } from "../lib/motion";
import { carveHead } from "../lib/carve";
import { nameFor } from "../lib/alias";
import { openCard } from "./CrewCard";
import { CrewFace, XCheck, XLink } from "./Face";
import { useMedia } from "./Bits";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/** Splits the top N into pyramid courses of 1, 2, 3, 4… from the apex down. */
function courses<T>(items: (T | null)[]) {
  const rows: (T | null)[][] = [];
  let i = 0;
  for (let n = 1; i < items.length; n++) {
    rows.push(items.slice(i, i + n));
    i += n;
  }
  return rows;
}

function Stone({ r, narrow }: { r: PondRow; narrow: boolean }) {
  const who = nameFor(r.addr, r.nickname, r.x);
  return (
    <div className="stone">
      <button type="button" className="stone__btn" onClick={() => openCard(r.addr)} aria-label={`Rank ${r.rank}: ${who.name}, ${amount(r.balance)} $TOMB. Open this block.`}>
        <span className="stone__rank tabular">{r.rank}</span>
        <CrewFace addr={r.addr} pp={r.pp} x={r.x} size={narrow ? 34 : 84} className="stone__face" />
        <span className="stone__name">
          {who.name}
          {r.x ? <XCheck x={r.x} /> : who.claimed ? <SealCheck className="stone__seal" weight="fill" aria-hidden="true" /> : null}
        </span>
        <span className="stone__bag tabular">{compact(r.balance)}</span>
      </button>
      {r.x && !narrow ? <XLink x={r.x} className="stone__x" /> : null}
    </div>
  );
}

export function Pyramid({ status }: { status: Status | null }) {
  const root = useRef<HTMLElement>(null);
  const live = !!status?.tokenAddress;
  const { data } = usePoll<{ total: number; topN: number; rows: PondRow[] }>(live ? "/api/pond?limit=20" : null, 30000, demoPond);
  const narrow = useMedia("(max-width: 760px)");
  const [more, setMore] = useState(false);
  const all = data?.rows ?? [];
  const sealed = status?.counts.sitters ?? 0;
  const top = status?.rules.topN ?? data?.topN ?? 10;
  const capstone = Array.from({ length: top }, (_, i) => all[i] ?? null);
  const below = all.slice(top);
  const shownBelow = more ? below : below.slice(0, narrow ? 4 : 6);
  const paid = (v: string) => (parseFloat(v) > 0 ? parseFloat(v).toFixed(narrow ? 3 : 4) : "-");

  useGSAP(
    () => {
      carveHead(root.current!);
      if (prefersReducedMotion()) return;
      // The capstone is built the way pyramids are: the widest course first, the apex last,
      // each stone lowered into its place and landing with its full weight.
      const rows = gsap.utils.toArray<HTMLElement>(".capstone__row").reverse();
      const tl = gsap.timeline({ scrollTrigger: { trigger: ".capstone", start: "top 78%" } });
      rows.forEach((row) => tl.from(row.children, { y: -150, opacity: 0, duration: 0.42, ease: "power4.in", stagger: 0.06 }, ">-0.12"));
      gsap.from(".below tbody tr", {
        opacity: 0,
        x: -20,
        duration: 0.5,
        ease: "power3.out",
        stagger: 0.05,
        scrollTrigger: { trigger: ".below", start: "top 85%" },
      });
    },
    { scope: root, dependencies: [all.length > 0] },
  );

  return (
    <section className="sect vault" id="vault" ref={root} aria-labelledby="vault-head">
      <div className="wrap">
        <span className="sect__line" aria-hidden="true" />
        <h2 className="sect__head" id="vault-head">
          The pyramid
        </h2>
        <p className="sect__deck">
          {live ? `${sealed.toLocaleString("en-US")} sealed blocks.` : "Every holder is a block."} The {top} biggest sit in the capstone and share every tribute.
        </p>

        <div className="capstone" aria-label={`The capstone: the ${top} biggest blocks`}>
          {courses(capstone).map((row, i) => (
            <div className="capstone__row" key={i}>
              {row.map((r, j) =>
                r ? (
                  <Stone key={r.addr} r={r} narrow={narrow} />
                ) : (
                  <div className="stone is-open" key={`open-${i}-${j}`} aria-label="Open place in the capstone">
                    <span className="stone__open">open</span>
                  </div>
                ),
              )}
            </div>
          ))}
        </div>
        {!all.length ? (
          <p className="vault__empty">
            {live ? "No sealed blocks yet. The capstone fills as soon as wallets hold the minimum." : "Trading opens at launch. The first blocks are set in the capstone the moment the tomb opens."}
          </p>
        ) : null}

        {below.length ? (
          <table className="below">
            <caption>Below the capstone</caption>
            <thead>
              <tr>
                <th scope="col" className="num">
                  Rank
                </th>
                <th scope="col">Block</th>
                <th scope="col" className="num">
                  Bag
                </th>
                {narrow ? null : (
                  <th scope="col" className="num">
                    Days
                  </th>
                )}
                <th scope="col" className="num">
                  Tribute ETH
                </th>
              </tr>
            </thead>
            <tbody>
              {shownBelow.map((r) => {
                const who = nameFor(r.addr, r.nickname, r.x);
                return (
                  <tr key={r.addr}>
                    <td className="num tabular">{r.rank}</td>
                    <td>
                      <div className="below__cell">
                        <button type="button" className={`below__who ${who.claimed ? "is-claimed" : ""}`} onClick={() => openCard(r.addr)} aria-label={`Open block for ${who.name}, ${r.addr}`}>
                          <CrewFace addr={r.addr} pp={r.pp} x={r.x} size={30} className="below__face" />
                          <span className="below__id">
                            <span className="below__name">
                              {who.name}
                              {r.x ? <XCheck x={r.x} /> : null}
                            </span>
                            <span className="below__addr tabular">{short(r.addr)}</span>
                          </span>
                        </button>
                        {r.x ? <XLink x={r.x} /> : null}
                      </div>
                    </td>
                    <td className="num tabular">{narrow ? compact(r.balance) : amount(r.balance)}</td>
                    {narrow ? null : <td className="num tabular">{r.padDays}</td>}
                    <td className="num tabular">{paid(r.received)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : null}
        {below.length > shownBelow.length ? (
          <button type="button" className="more" onClick={() => setMore(true)}>
            Show the next {below.length - shownBelow.length} blocks
          </button>
        ) : null}
        <p className="vault__foot">Gold blocks share the next tribute. Unclaimed wallets carry a royal alias. Carve a throne name or connect X on your block.</p>
      </div>
    </section>
  );
}

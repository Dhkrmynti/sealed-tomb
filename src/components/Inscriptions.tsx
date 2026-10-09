import { useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ArrowUpRight } from "@phosphor-icons/react";
import { DEFAULT_STEPS, STEP, amount, dateWib, demoRounds, eth, stepShare, txUrl, usePoll, type RoundRow, type Status } from "../lib/api";
import { prefersReducedMotion } from "../lib/motion";
import { carveHead } from "../lib/carve";
import { useMedia } from "./Bits";

gsap.registerPlugin(ScrollTrigger, useGSAP);

function Tx({ hash }: { hash: string }) {
  if (!hash) return null;
  return (
    <a className="cut__tx tabular" href={txUrl(hash)} target="_blank" rel="noreferrer">
      tx {hash.slice(0, 8)}… <ArrowUpRight weight="bold" aria-hidden="true" />
    </a>
  );
}

/** One rite, cut into the wall along its own full-width course. */
function Cut({ r }: { r: RoundRow }) {
  const done = r.stage === "done";
  const what =
    r.kind === "feeding"
      ? `${parseFloat(done ? r.fedETH : r.spentETH).toFixed(4)} ETH to ${r.recipients || "the"} blocks`
      : r.kind === "keeper"
        ? `${parseFloat(r.spentETH).toFixed(4)} ETH to the builders`
        : done
          ? `${amount(r.tokensBurned)} $TOMB burned`
          : "buying back";
  return (
    <li className={`cut is-${r.kind} ${done ? "" : "is-open"}`}>
      <span className="cut__n tabular">{r.n}</span>
      <span className="cut__kind">{STEP[r.kind].name}</span>
      <span className="cut__what tabular">{what}</span>
      <span className="cut__when tabular">{dateWib(r.at)} WIB</span>
      {done ? <Tx hash={r.tx} /> : <span className="cut__open">sending</span>}
    </li>
  );
}

export function Inscriptions({ status }: { status: Status | null }) {
  const root = useRef<HTMLElement>(null);
  const live = !!status?.tokenAddress;
  const { data: rounds } = usePoll<RoundRow[]>(live ? "/api/rounds" : null, 30000, demoRounds);
  const t = status?.totals;
  const keep = stepShare(status?.cycle.steps ?? DEFAULT_STEPS, "keeper");
  // A failed claim is retried as a new round, so it never shows here.
  const narrow = useMedia("(max-width: 760px)");
  const [more, setMore] = useState(false);
  const all = (rounds ?? []).filter((r) => r.stage !== "failed").slice(0, 12);
  // The wall opens on the latest few; the rest are one press away.
  const shown = more ? all : all.slice(0, narrow ? 4 : 6);

  useGSAP(
    () => {
      carveHead(root.current!);
      if (prefersReducedMotion() || !shown.length) return;
      // Each rite is chiselled into the wall, left to right, as the torch reaches it.
      ScrollTrigger.batch(".cut", {
        start: "top 90%",
        once: true,
        onEnter: (els) => gsap.from(els, { clipPath: "inset(0 100% 0 0)", duration: 0.7, ease: "power3.inOut", stagger: 0.09 }),
      });
    },
    { scope: root, dependencies: [shown.length > 0] },
  );

  return (
    <section className="sect wall is-inside" id="blotter" ref={root} aria-labelledby="wall-head">
      <div className="wrap">
        <span className="sect__line" aria-hidden="true" />
        <h2 className="sect__head" id="wall-head">
          The inscriptions
        </h2>
        <p className="sect__deck">Every rite, cut into the wall with its tx. No tx, it didn&rsquo;t happen.</p>

        <dl className="tally">
          <div>
            <dt>Tribute paid</dt>
            <dd className="tabular">{eth(t?.fedETH ?? "0")}</dd>
          </div>
          <div>
            <dt>Builders&rsquo; share ({keep}%)</dt>
            <dd className="tabular">{eth(t?.keeperETH ?? "0")}</dd>
          </div>
          <div>
            <dt>Into the afterlife</dt>
            <dd className="tabular">{amount(t?.tokensBurned ?? "0")} $TOMB</dd>
          </div>
        </dl>

        {shown.length ? (
          <ol className="cuts" reversed>
            {shown.map((r) => (
              <Cut key={r.n} r={r} />
            ))}
          </ol>
        ) : (
          <p className="wall__empty">Nothing carved yet. The first inscription is cut when the offering reaches {status?.cycle.steps[0].thresholdETH ?? "0.01"} ETH and the tribute runs.</p>
        )}
        {shown.length && all.length > shown.length ? (
          <button type="button" className="more" onClick={() => setMore(true)}>
            Show {all.length - shown.length} older inscriptions
          </button>
        ) : null}
      </div>
    </section>
  );
}

import { useRef, type CSSProperties } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ArrowsClockwise, Crown, Fire, Hammer } from "@phosphor-icons/react";
import { DEFAULT_STEPS, STEP, stepShare, type RoundKind, type Status } from "../lib/api";
import { prefersReducedMotion } from "../lib/motion";
import { carveHead } from "../lib/carve";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const ORDER: RoundKind[] = ["feeding", "keeper", "sink"];
const ICON = { feeding: Crown, keeper: Hammer, sink: Fire } as const;

/** The rite, laid as stone courses: one rite per full-width course, in the order they run. */
export function Rite({ status }: { status: Status | null }) {
  const root = useRef<HTMLElement>(null);
  const steps = status?.cycle.steps ?? DEFAULT_STEPS;
  const at = (k: RoundKind) => steps.find((s) => s.kind === k)?.thresholdETH ?? "0.01";
  const top = status?.rules.topN ?? 10;
  const next = status?.tokenAddress ? status.cycle.steps[status.cycle.index]?.kind : undefined;
  const what: Record<RoundKind, string> = {
    feeding: `to the ${top} biggest blocks, split by bag size`,
    keeper: "to the builders' treasury, shown in the open",
    sink: "buys $TOMB back and sends it to the dead address",
  };

  useGSAP(
    () => {
      carveHead(root.current!);
      if (prefersReducedMotion()) return;
      // Each course is dragged in on its sledge, from alternating sides, and set down.
      gsap.utils.toArray<HTMLElement>(".course").forEach((el, i) => {
        gsap.from(el, {
          xPercent: i % 2 ? 18 : -18,
          opacity: 0,
          duration: 1,
          ease: "expo.out",
          scrollTrigger: { trigger: el, start: "top 86%" },
        });
      });
      // The offering is shared out stone by stone along the levelling course.
      gsap.from(".share", { scaleY: 0, transformOrigin: "50% 100%", duration: 0.7, ease: "back.out(1.4)", stagger: 0.14, scrollTrigger: { trigger: ".shares", start: "top 85%" } });
    },
    { scope: root },
  );

  return (
    <section className="sect rite" id="heist" ref={root} aria-labelledby="rite-head">
      <div className="wrap">
        <span className="sect__line" aria-hidden="true" />
        <h2 className="sect__head" id="rite-head">
          The rite
        </h2>
        <p className="sect__deck">Every trade leaves an offering in the escrow. When the bowl holds enough, the next rite runs, always in this order.</p>

        <ol className="courses" aria-label="The rite, in order">
          {ORDER.map((k, i) => {
            const Icon = ICON[k];
            return (
              <li key={k} className={`course is-${k} ${next === k ? "is-next" : ""}`} style={{ "--step": i } as CSSProperties}>
                <Icon className="course__icon" weight="duotone" aria-hidden="true" />
                <span className="course__eth tabular">{at(k)} ETH</span>
                <span className="course__name">{STEP[k].name}</span>
                <span className="course__what">{what[k]}</span>
                {next === k ? <span className="course__mark">next</span> : null}
              </li>
            );
          })}
          <li className="course__again" aria-label="then it starts over">
            <ArrowsClockwise weight="bold" aria-hidden="true" /> then the tribute again
          </li>
        </ol>

        <div className="shares" role="img" aria-label={`Over one full cycle: ${ORDER.map((k) => `${STEP[k].name} ${stepShare(steps, k)} percent`).join(", ")}`}>
          {ORDER.map((k) => (
            <div key={k} className={`share is-${k}`} style={{ flex: `${stepShare(steps, k)} 1 0%` }}>
              <span className="share__pct tabular">{stepShare(steps, k)}%</span>
              <span className="share__name">{STEP[k].name}</span>
            </div>
          ))}
        </div>

        <p className="rite__curse">Sell once and you&rsquo;re cursed. No tribute, ever.</p>
      </div>
    </section>
  );
}

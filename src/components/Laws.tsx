import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Coins, Clock, Prohibit, ArrowsLeftRight, Ranking, Eye } from "@phosphor-icons/react";
import { amount, type Status } from "../lib/api";
import { prefersReducedMotion } from "../lib/motion";
import { carveHead } from "../lib/carve";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export function Laws({ status }: { status: Status | null }) {
  const root = useRef<HTMLElement>(null);
  const min = status?.rules.minBalance ?? "100000";
  const hold = status?.rules.minHoldHours ?? 1;
  const top = status?.rules.topN ?? 10;
  const cursed = status?.tokenAddress ? status.counts.hopped : 0;
  const holdText = hold === 1 ? "an hour" : `${hold} hours`;

  const laws = [
    { icon: Coins, title: `Hold ${amount(min)}+ $TOMB`, text: "Under that you're a loose stone, not part of the pyramid. It keeps dust wallets out of the tribute." },
    { icon: Ranking, title: `The ${top} biggest get the tribute`, text: `Each tribute goes to the ${top} biggest sealed blocks, in ETH, shared by bag size. Hold more, climb the pyramid.` },
    ...(hold > 0 ? [{ icon: Clock, title: `Let it cure ${holdText}`, text: `Your first $TOMB must be ${holdText} old when the rite runs. No buying in the second before the tribute.` }] : []),
    { icon: Prohibit, title: "Never sell", text: "Selling on the Pons curve, or sending $TOMB into a DEX or any other contract, curses the wallet. Out of the tomb for good." },
    { icon: ArrowsLeftRight, title: "Wallet to wallet is fine", text: "Moving $TOMB to your own other wallet is not a sell. The receiving wallet starts its sealed days from zero." },
    { icon: Eye, title: "Overseers get nothing", text: "The curve, the engine, the treasury and the dead address are left out of every tribute." },
  ];

  useGSAP(
    () => {
      carveHead(root.current!);
      if (prefersReducedMotion()) return;
      // The stela is raised out of the sand; each law is cut into it in turn.
      gsap.from(".stela", { y: 70, clipPath: "inset(0 0 100% 0)", duration: 1.1, ease: "expo.out", scrollTrigger: { trigger: ".stela", start: "top 85%" } });
      gsap.from(".law", { opacity: 0, y: 18, duration: 0.6, ease: "power3.out", stagger: 0.08, scrollTrigger: { trigger: ".stela", start: "top 70%" } });
      // The curse tally is counted out on the tablet.
      const n = root.current!.querySelector<HTMLElement>(".curse__n");
      if (n && cursed > 0) {
        const c = { v: 0 };
        gsap.to(c, { v: cursed, duration: 1.2, ease: "power2.out", snap: { v: 1 }, onUpdate: () => void (n.textContent = String(c.v)), scrollTrigger: { trigger: ".curse", start: "top 80%" } });
      }
    },
    { scope: root, dependencies: [cursed] },
  );

  return (
    <section className="sect laws" id="rules" ref={root} aria-labelledby="laws-head">
      <div className="wrap laws__grid">
        <div className="laws__main">
          <span className="sect__line" aria-hidden="true" />
          <h2 className="sect__head" id="laws-head">
            The laws of the tomb
          </h2>
          <p className="sect__deck">Set by the Pharaoh, enforced by code, checked on chain.</p>
          <ol className="stela">
            {laws.map(({ icon: Icon, title, text }) => (
              <li className="law" key={title}>
                <Icon className="law__icon" weight="duotone" aria-hidden="true" />
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ol>
        </div>

        <aside className="curse" aria-label={`Cursed: ${cursed} wallets`}>
          <p className="curse__word">Cursed</p>
          <p className="curse__n tabular">{cursed}</p>
          <p className="curse__what">{cursed === 1 ? "wallet sold" : "wallets sold"} $TOMB on the curve or a DEX.</p>
          <p className="curse__fate">Their block was pulled from the tomb. Tribute: nothing, ever.</p>
        </aside>
      </div>
    </section>
  );
}

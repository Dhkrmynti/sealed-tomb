import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ArrowUpRight, XLogo } from "@phosphor-icons/react";
import { DEFAULT_STEPS, DEMO, X_URL, dexUrl, stepShare, type Status } from "../lib/api";
import { prefersReducedMotion } from "../lib/motion";
import { BuyButton, CaCoupon, useMedia } from "./Bits";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/** The way out is the way in, closed: two stone doors slide shut over the last line. */
export function Seal({ status }: { status: Status | null }) {
  const root = useRef<HTMLElement>(null);
  const ca = DEMO ? "" : status?.tokenAddress;
  const narrow = useMedia("(max-width: 760px)");
  const keep = stepShare(status?.cycle.steps ?? DEFAULT_STEPS, "keeper");
  const min = Number(status?.rules.minBalance ?? "100000").toLocaleString("en-US");

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap
        .timeline({ scrollTrigger: { trigger: ".seal__doors", start: "top 85%", end: "bottom 75%", scrub: 0.6 }, defaults: { ease: "none" } })
        .fromTo(".seal__door.is-west", { xPercent: -100 }, { xPercent: 0 })
        .fromTo(".seal__door.is-east", { xPercent: 100 }, { xPercent: 0 }, 0)
        .from(".seal__close span", { opacity: 0, y: 24, stagger: 0.1 }, 0.35);
    },
    { scope: root },
  );

  return (
    <footer className="seal is-inside" ref={root} aria-label="The way out">
      <div className="seal__doors">
        <span className="seal__door is-west" aria-hidden="true" />
        <span className="seal__door is-east" aria-hidden="true" />
        <p className="seal__close">
          <span>What goes in the tomb</span> <span>stays in the tomb.</span>
        </p>
      </div>

      <div className="wrap seal__end">
        <div className="seal__deal">
          <p>Hold {min} $TOMB. Never sell. Paid in ETH, every tribute.</p>
          <div className="seal__acts">
            <BuyButton status={status} />
            <CaCoupon status={status} compact={narrow} />
          </div>
        </div>

        <nav className="seal__links" aria-label="Elsewhere">
          {ca ? (
            <a href={dexUrl(ca)} target="_blank" rel="noreferrer">
              Chart on DexScreener <ArrowUpRight weight="bold" aria-hidden="true" />
            </a>
          ) : null}
          <a href={X_URL} target="_blank" rel="noreferrer">
            <XLogo weight="bold" aria-hidden="true" /> The Sealed Tomb on X <ArrowUpRight weight="bold" aria-hidden="true" />
          </a>
          <a href="#rules">Read the laws again</a>
        </nav>

        <p className="seal__fine">
          $TOMB is a memecoin with no promise of value. It is not a security or an investment, and the tribute is not a dividend: it is trading fees, which can drop to nothing. Nobody earns anything for bringing anyone in. The builders&rsquo; share ({keep}% of all offerings) goes to the creator&rsquo;s treasury, and every transfer is cut into the inscriptions. The Pharaoh is an original character.
        </p>
      </div>
    </footer>
  );
}

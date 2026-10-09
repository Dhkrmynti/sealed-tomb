import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { prefersReducedMotion } from "../lib/motion";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * The walk inside. The pyramid's face holds still while the visitor walks up to the
 * entrance: the doorway grows until its dark fills the screen, the daylight drains away,
 * and the torchlit pages of the tomb begin.
 */
export function Entrance() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const mm = gsap.matchMedia();
      // Desktop pins the face and walks in; phones scrub the same walk without a pin,
      // because the address bar resizes the screen mid-pin.
      mm.add("(min-width: 761px)", () => {
        const tl = gsap.timeline({
          scrollTrigger: { trigger: root.current, start: "top top", end: "+=140%", pin: true, scrub: 0.6, anticipatePin: 1 },
          defaults: { ease: "none" },
        });
        tl.to(".entry__wall", { scale: 9, transformOrigin: "50% 72%", ease: "power2.in", duration: 1 })
          .to(".entry__sky", { opacity: 0, duration: 0.5 }, 0)
          .to(".entry__say", { opacity: 0, y: -40, duration: 0.25 }, 0)
          .fromTo(".entry__inside", { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0.7)
          .fromTo(".entry__torch", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.25 }, 0.75);
      });
      mm.add("(max-width: 760px)", () => {
        gsap
          .timeline({ scrollTrigger: { trigger: root.current, start: "top 60%", end: "bottom 40%", scrub: 0.5 }, defaults: { ease: "none" } })
          .to(".entry__wall", { scale: 3.2, transformOrigin: "50% 72%" })
          .fromTo(".entry__inside", { opacity: 0 }, { opacity: 1 }, 0.4);
      });
    },
    { scope: root },
  );

  return (
    <section className="entry" ref={root} aria-label="Into the tomb">
      <div className="entry__sky" aria-hidden="true" />
      <div className="entry__wall" aria-hidden="true">
        <span className="entry__door" />
      </div>
      <p className="entry__say">
        Walk in.
        <span>Your block is somewhere inside.</span>
      </p>
      <div className="entry__inside" aria-hidden="true">
        <p className="entry__torch">Inside the tomb</p>
      </div>
    </section>
  );
}

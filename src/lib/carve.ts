import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "./motion";

gsap.registerPlugin(ScrollTrigger);

/**
 * How every section head is cut into the stone: the levelling line is snapped across,
 * the heading is chiselled in from the left, then the deck settles under it.
 * Call inside useGSAP so the trigger is reverted with the component.
 */
export function carveHead(section: HTMLElement) {
  if (prefersReducedMotion()) return;
  const line = section.querySelector(".sect__line");
  const head = section.querySelector(".sect__head");
  const deck = section.querySelector(".sect__deck");
  const tl = gsap.timeline({ scrollTrigger: { trigger: section, start: "top 76%" }, defaults: { ease: "expo.out" } });
  if (line) tl.from(line, { scaleX: 0, transformOrigin: "0% 50%", duration: 0.8 });
  if (head) tl.from(head, { clipPath: "inset(0 100% 0 0)", x: -18, duration: 0.95 }, "-=0.55");
  if (deck) tl.from(deck, { opacity: 0, y: 14, duration: 0.7 }, "-=0.6");
  return tl;
}

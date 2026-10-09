import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DEMO, demoStatus, usePoll, type Status } from "./lib/api";
import { prefersReducedMotion } from "./lib/motion";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { Rite } from "./components/Rite";
import { Pyramid } from "./components/Pyramid";
import { Laws } from "./components/Laws";
import { Entrance } from "./components/Entrance";
import { CrewCard } from "./components/CrewCard";
import { Inscriptions } from "./components/Inscriptions";
import { Seal } from "./components/Seal";
import { restoreWallet } from "./lib/wallet";

gsap.registerPlugin(ScrollTrigger);

export function App() {
  const { data: status, error } = usePoll<Status>("/api/status", 12000, demoStatus);

  // A wallet that already trusts this site shows as connected without a popup.
  useEffect(restoreWallet, []);

  // Smooth scroll that ScrollTrigger reads from; off for reduced motion.
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const lenis = new Lenis({ lerp: 0.11, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    (window as unknown as { __lenis?: Lenis }).__lenis = lenis;
    const raf = (t: number) => lenis.raf(t * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    const anchors = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
      if (!a || a.getAttribute("href") === "#") return;
      const el = document.querySelector(a.getAttribute("href")!);
      if (!el) return;
      e.preventDefault();
      lenis.scrollTo(el as HTMLElement, { offset: -64 });
    };
    document.addEventListener("click", anchors);
    // Fonts change line lengths, so every trigger is measured again once they land.
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
    return () => {
      document.removeEventListener("click", anchors);
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, []);

  const live = !!status?.tokenAddress;

  return (
    <>
      {DEMO ? (
        <div className="demo-strip" role="note">
          <span className="demo-strip__long">
            Illustration edition: every number on this page is made up to preview the tomb. Try your block and the mask workshop; nothing you set is saved.
          </span>
          <span className="demo-strip__short">Preview: every number here is made up. Nothing you set is saved.</span>
        </div>
      ) : null}
      <Header status={status} />
      <main>
        <Hero status={status} offline={!!error && !status} />
        <Rite status={status} />
        <Pyramid status={status} />
        <Laws status={status} />
        <Entrance />
        <div className="inside">
          <CrewCard live={live} />
          <Inscriptions status={status} />
        </div>
      </main>
      <Seal status={status} />
    </>
  );
}

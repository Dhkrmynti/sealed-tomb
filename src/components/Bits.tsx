import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ArrowUpRight, Copy, Check } from "@phosphor-icons/react";
import { DEMO, ponsUrl, short, type Status } from "../lib/api";
import { prefersReducedMotion } from "../lib/motion";

gsap.registerPlugin(useGSAP);

export function useNow(everyMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), everyMs);
    return () => clearInterval(id);
  }, [everyMs]);
  return now;
}

export function useMedia(query: string) {
  const [match, setMatch] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const m = window.matchMedia(query);
    const on = () => setMatch(m.matches);
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, [query]);
  return match;
}

/** The one primary action on the page. Same label everywhere. */
export function BuyButton({ status, className = "" }: { status: Status | null; className?: string }) {
  // The illustration edition never prints a buy link or a contract address: a made-up CA is a trap.
  const ca = DEMO ? "" : status?.tokenAddress;
  if (!ca)
    return (
      <span className={`btn is-waiting ${className}`} aria-disabled="true">
        <span className="btn__long">Tomb opens soon</span>
        <span className="btn__short">Soon</span>
      </span>
    );
  return (
    <a className={`btn ${className}`} href={ponsUrl(ca)} target="_blank" rel="noreferrer">
      <span className="btn__long">Buy on Pons</span>
      <span className="btn__short">Buy</span> <ArrowUpRight weight="bold" aria-hidden="true" />
    </a>
  );
}

/** The contract address cut into a small tablet. Tap to copy. */
export function CaCoupon({ status, compact = false }: { status: Status | null; compact?: boolean }) {
  const ca = DEMO ? "" : status?.tokenAddress || "";
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    if (!ca) return;
    try {
      await navigator.clipboard.writeText(ca);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked: the address is still selectable */
    }
  };
  return (
    <button type="button" className={`ca ${compact ? "is-compact" : ""}`} onClick={copy} disabled={!ca} aria-label={ca ? `Copy contract address ${ca}` : "Contract address not live yet"}>
      <span className="ca__k">CA</span>
      <span className="ca__v tabular">{ca ? (compact ? short(ca) : ca) : "carved at launch"}</span>
      <span className="ca__a" aria-hidden="true">
        {copied ? <Check weight="bold" /> : <Copy weight="bold" />}
      </span>
      <span className="sr-only" aria-live="polite">
        {copied ? "Copied" : ""}
      </span>
    </button>
  );
}

/**
 * The offering on its way up: a block on a sledge hauled along the ramp. How far it has
 * climbed is the escrow toward the next rite's size. `--climb` runs 0 to 1.
 */
export function Ramp({ value, target, label, className = "" }: { value: number; target: number; label: string; className?: string }) {
  const root = useRef<HTMLDivElement>(null);
  const pct = target > 0 ? Math.max(0, Math.min(1, value / target)) : 0;
  useGSAP(
    () => {
      const to = { "--climb": pct } as gsap.TweenVars;
      if (prefersReducedMotion()) gsap.set(root.current, to);
      else gsap.to(root.current, { ...to, duration: 1.6, delay: 0.5, ease: "power2.inOut" });
    },
    { scope: root, dependencies: [pct] },
  );
  return (
    <div className={`ramp ${className}`} ref={root} role="meter" aria-valuemin={0} aria-valuemax={target} aria-valuenow={value} aria-label={label}>
      <span className="ramp__track" aria-hidden="true">
        <span className="ramp__done" />
        <span className="ramp__sledge">
          <span className="ramp__block" />
        </span>
      </span>
    </div>
  );
}

/**
 * How a block is shown: a linked X account shows its own picture, handle and
 * badge; everyone else gets their mask. The X picture falls back to the mask if
 * X ever stops serving it.
 */
import { useState } from "react";
import { SealCheck, XLogo } from "@phosphor-icons/react";
import { xUrl, type XProfile } from "../lib/api";
import { Mugshot, traitsFor, validTraits } from "./Mugshot";

export function CrewFace({ addr, pp, x, size, className = "" }: { addr: string; pp?: number[] | null; x?: XProfile | null; size: number; className?: string }) {
  const [broken, setBroken] = useState(false);
  if (x?.avatar && !broken)
    return <img className={`xface ${className}`} src={x.avatar} width={size} height={size} alt="" referrerPolicy="no-referrer" onError={() => setBroken(true)} />;
  return <Mugshot traits={validTraits(pp) ? pp : traitsFor(addr)} size={size} className={className} />;
}

const BADGE: Record<string, string> = { blue: "Verified on X", business: "Verified organization on X", government: "Government account on X" };

/** X's badge as X reports it: blue, gold for organizations, gray for government. */
export function XCheck({ x, className = "" }: { x: XProfile; className?: string }) {
  if (!BADGE[x.verified]) return null;
  return <SealCheck className={`xcheck is-${x.verified} ${className}`} weight="fill" aria-label={BADGE[x.verified]} role="img" />;
}

/** The X logo; pressing it opens the holder's X profile. */
export function XLink({ x, className = "" }: { x: XProfile; className?: string }) {
  return (
    <a className={`xlink ${className}`} href={xUrl(x.username)} target="_blank" rel="noreferrer noopener" aria-label={`@${x.username} on X`} title={`@${x.username} on X`}>
      <XLogo weight="bold" aria-hidden="true" />
    </a>
  );
}

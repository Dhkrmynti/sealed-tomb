/**
 * A royal mask: the face every block wears on the pyramid, assembled from four parts.
 * Every wallet gets one generated from its address; holders can pick their own parts in
 * the mask workshop. Part counts must match MUGSHOT_PARTS in bot/byline.ts ([5, 5, 6, 6]),
 * so the saved [material, crown, regalia, backdrop] arrays keep validating on the engine.
 */
import { useId, type CSSProperties } from "react";

export const PARTS = { fur: 5, hat: 5, acc: 6, bg: 6 } as const;
export type Traits = [material: number, crown: number, regalia: number, backdrop: number];

export const PART_NAMES = {
  fur: ["Gold", "Lapis", "Limestone", "Obsidian", "Bronze"],
  hat: ["Bare head", "Nemes", "Blue crown", "White crown", "Double crown"],
  acc: ["Nothing", "False beard", "Kohl", "Uraeus", "Ankh", "Broad collar"],
  bg: ["Limestone", "Sandstone", "Ochre", "Night", "Lapis", "Electrum"],
};

/** [face, shade, line] per material. */
const MATERIAL: [string, string, string][] = [
  ["#d6a72e", "#a47a14", "#3d2b06"],
  ["#3d5da8", "#27427f", "#0d1733"],
  ["#ddd3bf", "#b3a78f", "#3a342b"],
  ["#2e2c31", "#1b1a1d", "#c9c1b2"],
  ["#a7693a", "#78471f", "#2b1608"],
];
const BACKDROP = ["#cbc1ad", "#cf9a5c", "#a3311b", "#15120f", "#27427f", "#d4a62c"];
const GOLD = "#d4a62c";
const LAPIS = "#2c4a8f";
const RED = "#b23a22";
const LINEN = "#eee9dc";
const FRAME = "#1e1d1a";

function fnv(s: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** The mask a wallet gets until its owner picks one. */
export function traitsFor(addr: string): Traits {
  const h = fnv(addr.toLowerCase() + ":mugshot");
  return [h % PARTS.fur, Math.floor(h / 7) % PARTS.hat, Math.floor(h / 53) % PARTS.acc, Math.floor(h / 419) % PARTS.bg];
}

export function validTraits(t: unknown): t is Traits {
  const max = [PARTS.fur, PARTS.hat, PARTS.acc, PARTS.bg];
  return Array.isArray(t) && t.length === 4 && t.every((v, i) => Number.isInteger(v) && v >= 0 && v < max[i]);
}

export function Mugshot({ traits, size = 40, className = "", title, style }: { traits: Traits; size?: number; className?: string; title?: string; style?: CSSProperties }) {
  const [m, crown, reg, bg] = traits;
  const [face, shade, line] = MATERIAL[m] ?? MATERIAL[0];
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const dark = bg === 2 || bg === 3 || bg === 4;
  return (
    <svg className={`mask ${className}`} viewBox="0 0 100 100" width={size} height={size} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true} style={style}>
      <defs>
        <clipPath id={`nemes-${id}`}>
          <path d="M50 15 C35 15 27 25 27 40 L21 80 L36 85 L36 60 L64 60 L64 85 L79 80 L73 40 C73 25 65 15 50 15 Z" />
          <path d="M33 40 C33 27 41 21 50 21 C59 21 67 27 67 40 C61 36.4 39 36.4 33 40 Z" />
        </clipPath>
      </defs>
      <rect width="100" height="100" fill={BACKDROP[bg] ?? BACKDROP[0]} />
      {/* the sun disc behind every head, low and quiet */}
      <circle cx="50" cy="44" r="34" fill={dark ? "#ffffff" : FRAME} opacity="0.07" />

      {/* nemes headcloth falls behind the face and onto the shoulders */}
      {crown === 1 ? (
        <g clipPath={`url(#nemes-${id})`}>
          <rect x="0" y="0" width="100" height="100" fill={GOLD} />
          {Array.from({ length: 13 }, (_, i) => (
            <rect key={i} x="0" y={14 + i * 5.4} width="100" height="2.7" fill={LAPIS} />
          ))}
        </g>
      ) : null}

      {/* shoulders */}
      <path d="M12 100 C16 84 32 79 50 79 C68 79 84 84 88 100 Z" fill={shade} stroke={line} strokeWidth="1.6" />
      <path d="M43 70 L43 81 C46 83 54 83 57 81 L57 70 Z" fill={shade} />

      {/* broad collar of lapis, gold and carnelian beads */}
      {reg === 5 ? (
        <g fill="none" strokeLinecap="round">
          <path d="M25 93 Q50 70 75 93" stroke={GOLD} strokeWidth="4" />
          <path d="M22 99 Q50 74 78 99" stroke={LAPIS} strokeWidth="4" />
          <path d="M20 106 Q50 79 80 106" stroke={RED} strokeWidth="4" />
          <path d="M27.5 88 Q50 68.5 72.5 88" stroke={LAPIS} strokeWidth="1.6" strokeDasharray="1.6 1.4" />
        </g>
      ) : null}

      {/* ears show unless the nemes covers them */}
      {crown !== 1 ? (
        <g fill={face} stroke={line} strokeWidth="1.4">
          <path d="M33.5 46 C29 44 28 51 30 55 C31 57.5 33 58 34.5 57" />
          <path d="M66.5 46 C71 44 72 51 70 55 C69 57.5 67 58 65.5 57" />
        </g>
      ) : null}

      {/* the face */}
      <path d="M33 43 C33 29 40 23 50 23 C60 23 67 29 67 43 L67 51 C67 64 60 74 50 74 C40 74 33 64 33 51 Z" fill={face} stroke={line} strokeWidth="1.6" />
      <path d="M50 26 C46 30 45 36 46 41 L54 41 C55 36 54 30 50 26 Z" fill={shade} opacity="0.35" />
      <g fill="none" stroke={line} strokeLinecap="round">
        <path d="M37 42.5 Q42.5 38.8 48 41.6" strokeWidth="2" />
        <path d="M52 41.6 Q57.5 38.8 63 42.5" strokeWidth="2" />
      </g>
      <g fill={LINEN} stroke={line} strokeWidth="1.3" strokeLinejoin="round">
        <path d="M37 47 Q42.5 43.4 48 47 Q42.5 50.2 37 47 Z" />
        <path d="M52 47 Q57.5 43.4 63 47 Q57.5 50.2 52 47 Z" />
      </g>
      <g fill={line === "#c9c1b2" ? "#1b1a1d" : line}>
        <circle cx="42.5" cy="47" r="2" />
        <circle cx="57.5" cy="47" r="2" />
      </g>
      <g fill="none" stroke={line} strokeWidth="1.3" strokeLinecap="round">
        <path d="M37 47 L33.5 46" />
        <path d="M63 47 L66.5 46" />
        <path d="M50 49 L48.4 58.2 Q50 59.6 51.6 58.2" />
      </g>
      <path d="M44.5 64.2 Q50 61.6 55.5 64.2 Q50 67.4 44.5 64.2 Z" fill={shade} stroke={line} strokeWidth="1.2" strokeLinejoin="round" />

      {/* kohl: the long painted wing and the falcon mark under the eye */}
      {reg === 2 ? (
        <g fill="none" stroke={line === "#c9c1b2" ? "#0d0d0e" : "#141210"} strokeLinecap="round">
          <path d="M36.5 46.6 Q42.5 42.6 48.5 46.6 L32 44.6" strokeWidth="2" />
          <path d="M51.5 46.6 Q57.5 42.6 63.5 46.6 L68 44.6" strokeWidth="2" />
          <path d="M40 49.6 L38.6 55.4 Q37.4 57.6 35.4 56.4" strokeWidth="1.5" />
          <path d="M60 49.6 L61.4 55.4 Q62.6 57.6 64.6 56.4" strokeWidth="1.5" />
        </g>
      ) : null}

      {/* the false beard of a king */}
      {reg === 1 ? (
        <g>
          <path d="M46.6 72 L53.4 72 L52.8 88 Q50 90.5 47.2 88 Z" fill={LAPIS} stroke={line} strokeWidth="1.2" strokeLinejoin="round" />
          {[75.5, 79, 82.5, 86].map((y) => (
            <path key={y} d={`M47 ${y} H53`} stroke={GOLD} strokeWidth="1.2" />
          ))}
        </g>
      ) : null}

      {/* crowns, set over the brow */}
      {crown === 1 ? <path d="M33 40 C39 36.4 61 36.4 67 40" fill="none" stroke={line} strokeWidth="1.4" /> : null}
      {crown === 2 ? (
        <g>
          <path d="M30 42 C28 26 36 11.5 50 10 C64 11.5 72 26 70 42 C64 37.6 36 37.6 30 42 Z" fill={LAPIS} stroke={FRAME} strokeWidth="1.6" strokeLinejoin="round" />
          <g fill={GOLD}>
            {[[40, 20], [50, 17], [60, 20], [36, 29], [46, 26], [55, 26], [64, 29], [42, 34], [58, 34]].map(([x, y]) => (
              <circle key={`${x}-${y}`} cx={x} cy={y} r="1.3" />
            ))}
          </g>
          <path d="M31 40.5 C38 36.6 62 36.6 69 40.5" fill="none" stroke={GOLD} strokeWidth="2.4" />
        </g>
      ) : null}
      {crown === 3 ? (
        <g stroke={FRAME} strokeWidth="1.6" strokeLinejoin="round">
          <path d="M34.5 41 C33 31 38 23 42 15 C44 8 46.5 4.5 50 4 C53.5 4.5 56 8 58 15 C62 23 67 31 65.5 41 C58 37.4 42 37.4 34.5 41 Z" fill={LINEN} />
          <circle cx="50" cy="4.6" r="3" fill={LINEN} />
          <path d="M35 39 C42 35.8 58 35.8 65 39" fill="none" strokeWidth="1.1" opacity="0.5" />
        </g>
      ) : null}
      {crown === 4 ? (
        <g stroke={FRAME} strokeWidth="1.6" strokeLinejoin="round">
          <path d="M62 24 L62 5 L68.5 5 L68.5 24 Z" fill={RED} />
          <path d="M40.5 25 C40 16 45 8.5 50 6 C55 8.5 60 16 59.5 25 Z" fill={LINEN} />
          <path d="M30 42 L30 23 L70 23 L70 42 C62 37.6 38 37.6 30 42 Z" fill={RED} />
          <path d="M57 26 C51 20.5 50.5 14 56 11.5" fill="none" stroke={GOLD} strokeWidth="1.8" strokeLinecap="round" />
        </g>
      ) : null}

      {/* the cobra rearing on the brow */}
      {reg === 3 ? (
        <g stroke={FRAME} strokeWidth="1.1" strokeLinejoin="round">
          <path d="M50 28.5 C47.2 28.5 46.6 31.6 47.6 34.4 L50 39.4 L52.4 34.4 C53.4 31.6 52.8 28.5 50 28.5 Z" fill={GOLD} />
          <path d="M49 31.2 H51" stroke={RED} strokeWidth="1.4" />
        </g>
      ) : null}

      {/* the ankh, held up beside the face */}
      {reg === 4 ? (
        <g fill="none" stroke={GOLD} strokeWidth="2.6" strokeLinecap="round">
          <path d="M83 70 C79 70 78.6 76.4 83 78.6 C87.4 76.4 87 70 83 70 Z" />
          <path d="M77.4 79.4 H88.6 M83 78.6 V95" />
        </g>
      ) : null}

      <rect x="0.8" y="0.8" width="98.4" height="98.4" fill="none" stroke={FRAME} strokeWidth="1.6" />
    </svg>
  );
}

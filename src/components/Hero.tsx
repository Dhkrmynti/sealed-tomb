import { useMemo, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { DEFAULT_STEPS, STEP, amount, eth, type Status } from "../lib/api";
import { prefersReducedMotion } from "../lib/motion";
import { BuyButton, CaCoupon, Ramp, useMedia } from "./Bits";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/** The headline is the engine's state, painted in ochre across the stone. */
function story(status: Status | null, offline: boolean) {
  if (offline)
    return {
      head: ["The torches", "went out."],
      deck: "The engine isn't answering. Nothing gets carved until it does.",
    };
  if (!status || !status.tokenAddress)
    return {
      head: ["The tomb is", "being built."],
      deck: "Hold big, never sell. The 10 biggest blocks get the tribute in ETH. Sell once and you're cursed.",
    };
  if (status.rounds === 0)
    return {
      head: ["The tomb", "is open."],
      deck: "Every trade leaves an offering. The first tribute runs when the bowl fills. Hold big, never sell.",
    };
  return {
    head: ["Sealed. Paid.", "Again."],
    deck: `The capstone has been paid ${eth(status.totals.fedETH)} so far. ${status.counts.hopped} cursed wallets got nothing.`,
  };
}

/* ───────── the pyramid, as exact geometry ───────── */

interface Course {
  y: number;
  h: number;
  hw: number;
  /** Vertical joints between blocks. */
  joints: number[];
  /** Weathered or replaced blocks, drawn in a slightly different stone: [x, w]. */
  worn: [number, number][];
}

interface Geo {
  W: number;
  H: number;
  apexY: number;
  /** Bottom of the gilded pyramidion. */
  capY: number;
  /** Where the smooth casing ends and the stepped core begins (ragged). */
  casing: { y: number; edge: string } | null;
  baseY: number;
  horizonY: number;
  half: number;
  courses: Course[];
  ramp: { x0: number; y0: number; x1: number; y1: number } | null;
  far: { x: number; apex: number; half: number }[];
  dunes: string;
}

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Spec {
  W: number;
  H: number;
  apexY: number;
  capY: number;
  baseY: number;
  horizonY: number;
  half: number;
  n: number;
  ramp: boolean;
  far: Geo["far"];
}

/**
 * A Giza-style pyramid seen across one corner: the west face in sun, the east face in
 * shade, the ridge down the middle. Dozens of courses that thin toward the top, each
 * stepping in from the one below; the smooth limestone casing still clings to the upper
 * part (as it does on Khafre's pyramid) and breaks off along a ragged line.
 */
function build(s: Spec): Geo {
  const rand = rng(4663);
  const { W, apexY, capY, baseY, half, n } = s;
  const cx = W / 2;
  const halfAt = (y: number) => (half * (y - apexY)) / (baseY - apexY);

  // Course heights: real courses vary and get thinner toward the top.
  const weights = Array.from({ length: n }, (_, i) => (1 - (0.5 * i) / n) * (0.78 + rand() * 0.44));
  const sum = weights.reduce((a, b) => a + b, 0);
  const scale = (baseY - capY) / sum;
  let y = baseY;
  const courses: Course[] = weights.map((w) => {
    const h = w * scale;
    y -= h;
    const hw = halfAt(y + h) - rand() * 5;
    const joints: number[] = [];
    const worn: [number, number][] = [];
    let x = cx - hw + 10 + rand() * 40;
    let prev = cx - hw;
    while (x < cx + hw - 8) {
      joints.push(x);
      if (rand() < 0.14) worn.push([prev, x - prev]);
      prev = x;
      x += Math.max(14, h * (1.4 + rand() * 1.9));
    }
    return { y, h, hw, joints, worn };
  });

  // The casing covers roughly the top fifth of the core and ends in a broken edge.
  let casing: Geo["casing"] = null;
  const cy = capY + (baseY - capY) * 0.2;
  {
    const hw = halfAt(cy);
    const pts: string[] = [];
    for (let x = cx + hw; x >= cx - hw; x -= 26 + rand() * 30) pts.push(`${x.toFixed(1)} ${(cy + (rand() - 0.35) * 22).toFixed(1)}`);
    pts.push(`${(cx - hw).toFixed(1)} ${cy.toFixed(1)}`);
    const capHalf = halfAt(capY);
    casing = {
      y: cy,
      edge: `M${cx - capHalf} ${capY} L${cx + capHalf} ${capY} L${cx + hw} ${cy} L${pts.join(" L")} Z`,
    };
  }

  // A long, shallow construction ramp of mudbrick that runs in from the sand on the east
  // and meets the face at its working level, clear of the painted headline.
  const y1 = baseY - (baseY - apexY) * 0.25;
  const ramp = s.ramp ? { x0: W + 170, y0: baseY + 60, x1: cx + halfAt(y1) - 8, y1 } : null;

  // Low dunes along the horizon, running well past both edges of the stage so a screen
  // wider than the stage never shows where the scene stops.
  const hy = s.horizonY;
  let dunes = `M${-W} ${hy + 4}`;
  for (let x = -W; x < 2 * W; x += 200) dunes += ` Q${x + 100} ${hy - 10 - rand() * 14} ${x + 200} ${hy + 2 - rand() * 6}`;
  dunes += ` L${2 * W} ${hy + 30} L${-W} ${hy + 30} Z`;

  return { W, H: s.H, apexY, capY, casing, baseY, horizonY: hy, half, courses, ramp, far: s.far, dunes };
}

const WIDE = build({ W: 1600, H: 800, apexY: 64, capY: 136, baseY: 724, horizonY: 652, half: 640, n: 44, ramp: true, far: [
  { x: 190, apex: 560, half: 150 },
  { x: 40, apex: 606, half: 80 },
] });
// On a phone the stage stands upright: open sky for the headline, the pyramid below it,
// and the doorway steps out under the stage onto the sand so it never hides the stone.
const TALL = build({ W: 1000, H: 1160, apexY: 670, capY: 730, baseY: 1110, horizonY: 1050, half: 345, n: 22, ramp: false, far: [] });

/**
 * One hauler facing up the ramp (to the left), in silhouette: bare torso leaning into the
 * rope over the shoulder, a white kilt, and both feet standing on the slope `k`.
 */
function figure(k: number, stride: number) {
  const f = (n: number) => n.toFixed(1);
  const front = { x: -5.5 - stride, y: 0 };
  front.y = k * front.x;
  const back = { x: 6.5 + stride, y: 0 };
  back.y = k * back.x;
  const hip = { x: 1, y: -11 + k };
  const knee = { x: -3.6 - stride * 0.6, y: -5.6 + k * -3.6 };
  const sh = { x: -5, y: -21 - k };
  return {
    head: { x: +(sh.x - 2.4).toFixed(1), y: +(sh.y - 3.3).toFixed(1) },
    torso: `M${f(sh.x + 3.4)} ${f(sh.y + 0.4)} L${f(sh.x - 0.8)} ${f(sh.y - 0.4)} L${f(sh.x - 1.3)} ${f(sh.y + 3.6)} L${f(hip.x - 2.4)} ${f(hip.y)} L${f(hip.x + 2.6)} ${f(hip.y + 0.3)} Z`,
    kilt: `M${f(hip.x - 2.8)} ${f(hip.y - 1.2)} L${f(hip.x + 3)} ${f(hip.y - 1)} L${f(hip.x + 4.4)} ${f(hip.y + 5)} L${f(hip.x - 3.6)} ${f(hip.y + 4.3)} Z`,
    limbs: `M${f(hip.x - 1)} ${f(hip.y + 3.4)} L${f(knee.x)} ${f(knee.y)} L${f(front.x)} ${f(front.y)} M${f(hip.x + 1.6)} ${f(hip.y + 3.4)} L${f(back.x)} ${f(back.y)} M${f(sh.x + 1)} ${f(sh.y + 1.2)} L${f(sh.x - 1.2)} ${f(sh.y + 5)} L${f(sh.x - 4.4)} ${f(sh.y + 3.4)}`,
    rope: { x: sh.x + 0.8, y: sh.y + 0.3 },
    hand: { x: sh.x - 4.4, y: sh.y + 3.4 },
  };
}

export function Hero({ status, offline }: { status: Status | null; offline: boolean }) {
  const root = useRef<HTMLElement>(null);
  const sledge = useRef<SVGGElement>(null);
  const narrow = useMedia("(max-width: 760px)");
  const geo = narrow ? TALL : WIDE;
  const { head, deck } = story(status, offline);
  const steps = status?.cycle.steps ?? DEFAULT_STEPS;
  const next = status ? status.cycle.steps[status.cycle.index] ?? steps[0] : steps[0];
  const escrow = parseFloat(status?.escrowETH ?? "0");
  const target = parseFloat(next.thresholdETH);
  const climb = target > 0 ? Math.max(0, Math.min(1, escrow / target)) : 0;
  const live = !!status?.tokenAddress;
  const cx = geo.W / 2;
  const capHalf = (geo.half * (geo.capY - geo.apexY)) / (geo.baseY - geo.apexY);
  const pct = (v: number, of: number) => `${(v / of) * 100}%`;

  const rampAngle = useMemo(() => {
    const r = geo.ramp;
    return r ? (Math.atan2(r.y0 - r.y1, r.x0 - r.x1) * 180) / Math.PI : 0;
  }, [geo]);
  // The crew on the ramp, in the sledge's own coordinates: a water-carrier wetting the
  // sand in front of the runners, then five haulers on one rope, feet on the slope.
  const crew = useMemo(() => {
    const r = geo.ramp;
    if (!r) return null;
    const len = Math.hypot(r.x1 - r.x0, r.y1 - r.y0);
    const ux = (r.x1 - r.x0) / len;
    const uy = (r.y1 - r.y0) / len;
    const k = uy / ux; // rise of the ramp per unit of x, so a foot at x stands at k * x
    const haulers = [40, 55, 70, 85, 100].map((d, i) => {
      const at = { x: ux * d, y: uy * d };
      const stride = i % 2 ? 1 : -1; // alternate the stride so the line reads as walking
      return { at, ...figure(k, stride) };
    });
    const tie = { x: ux * 15, y: uy * 15 - 9 };
    const rope = [tie, ...haulers.map((h) => ({ x: h.at.x + h.rope.x, y: h.at.y + h.rope.y }))];
    const ahead = haulers[haulers.length - 1];
    rope.push({ x: ahead.at.x + ahead.hand.x, y: ahead.at.y + ahead.hand.y });
    return {
      k,
      haulers,
      rope: rope.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" "),
      water: { x: ux * 26, y: uy * 26 },
    };
  }, [geo]);

  useGSAP(
    () => {
      const r = geo.ramp;
      const place = (t: number) => (r ? { x: r.x0 + (r.x1 - r.x0) * t, y: r.y0 + (r.y1 - r.y0) * t } : { x: 0, y: 0 });
      const at = place(Math.max(0.05, climb));
      if (prefersReducedMotion()) {
        if (sledge.current) gsap.set(sledge.current, at);
        return;
      }
      // The build: courses are set from the ground up, the capstone is lowered last,
      // then the masons paint the headline across the stone, stroke by stroke.
      const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
      tl.from(".hero__course", { y: 18, opacity: 0, duration: 0.6, stagger: 0.022 })
        .from(".hero__casing, .ridge", { opacity: 0, duration: 0.5 }, "-=0.3")
        .from(".hero__cap", { y: -90, duration: 0.55, ease: "power3.in" }, "-=0.35")
        .to(".hero__cap", { y: -5, duration: 0.09, yoyo: true, repeat: 1, ease: "power1.out" })
        .from(".hero__line", { clipPath: "inset(-10% 100% -10% 0)", duration: 0.85, ease: "power2.inOut", stagger: 0.22 }, "-=0.1")
        .from(".hero__lede, .hero__door, .hero__tag, .hero__count", { opacity: 0, y: 16, duration: 0.7, stagger: 0.06 }, "-=0.45");
      if (sledge.current) tl.fromTo(sledge.current, place(0.02), { ...at, duration: 1.6, ease: "power2.inOut" }, "-=1.1");

      // The sun drops toward the horizon as the visitor leaves the plateau.
      gsap.to(".hero__sun", { y: 140, ease: "none", scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true } });
    },
    { scope: root, dependencies: [narrow, climb] },
  );

  const counts = (
    <dl className="hero__count is-west">
      <div>
        <dt>Sealed</dt>
        <dd className="tabular">{live ? amount(status!.counts.sitters) : "0"}</dd>
      </div>
      <div>
        <dt>Rites run</dt>
        <dd className="tabular">{live ? status!.rounds : 0}</dd>
      </div>
      <div className="is-cursed">
        <dt>Cursed</dt>
        <dd className="tabular">{live ? status!.counts.hopped : 0}</dd>
      </div>
    </dl>
  );

  const door = (
    <div className="hero__door">
      {narrow ? counts : null}
      <div className="hero__deal">
        <BuyButton status={status} />
        <CaCoupon status={status} compact={narrow} />
      </div>
      {narrow && !offline ? (
        <div className="hero__ramp-row">
          <Ramp value={escrow} target={target} label={`Offering ${escrow} of ${target} ETH toward ${STEP[next.kind].name}`} />
          <p className="tabular">
            Next: {STEP[next.kind].name} · {live ? `${escrow.toFixed(4)} / ${next.thresholdETH} ETH` : `at ${next.thresholdETH} ETH`}
          </p>
        </div>
      ) : null}
    </div>
  );

  return (
    <section className="hero" id="top" ref={root} aria-label="The Sealed Tomb">
      <div className="hero__stage" style={{ aspectRatio: `${geo.W} / ${geo.H}` }}>
        <svg className="hero__pyramid" viewBox={`0 0 ${geo.W} ${geo.H}`} preserveAspectRatio="xMidYMax meet" aria-hidden="true">
          <defs>
            <linearGradient id="hero-sky" gradientUnits="userSpaceOnUse" x1="0" y1={0} x2="0" y2={geo.horizonY + 30}>
              <stop offset="0" className="sky-top" />
              <stop offset="1" className="sky-low" />
            </linearGradient>
            <clipPath id="face-w">
              <rect x="0" y="0" width={cx} height={geo.H} />
            </clipPath>
            <clipPath id="face-e">
              <rect x={cx} y="0" width={cx} height={geo.H} />
            </clipPath>
          </defs>

          {/* sky, low sun from the west, the far pyramids in the haze, the dunes */}
          <rect className="hero__air" x={-geo.W} y={-geo.H} width={geo.W * 3} height={geo.H + geo.horizonY + 30} fill="url(#hero-sky)" />
          <circle className="hero__sun" cx={narrow ? cx - 300 : cx - geo.half * 0.68} cy={narrow ? geo.apexY + 60 : geo.apexY + 70} r={narrow ? 46 : 54} />
          {geo.far.map((f) => (
            <g key={f.x} className="far">
              <path className="far-w" d={`M${f.x} ${f.apex} L${f.x - f.half} ${geo.horizonY + 6} L${f.x} ${geo.horizonY + 6} Z`} />
              <path className="far-e" d={`M${f.x} ${f.apex} L${f.x + f.half} ${geo.horizonY + 6} L${f.x} ${geo.horizonY + 6} Z`} />
            </g>
          ))}
          <path className="dune" d={geo.dunes} />
          <rect className="sand" x={-geo.W} y={geo.horizonY + 22} width={geo.W * 3} height={geo.H - geo.horizonY} />
          <path
            className="ground-shadow"
            d={`M${cx + 20} ${geo.baseY} L${cx + geo.half} ${geo.baseY} L${cx + geo.half + 300} ${geo.baseY - 34} L${cx + geo.half * 0.55} ${geo.baseY - 46} Z`}
          />

          {/* the stepped core, course by course from the ground up */}
          {geo.courses.map((c, i) => (
            <g className="hero__course" key={i}>
              <rect className="riser-w" x={cx - c.hw} y={c.y} width={c.hw} height={c.h} />
              <rect className="riser-e" x={cx} y={c.y} width={c.hw} height={c.h} />
              {c.worn.map(([x, w]) => (
                <rect key={x} className={x + w / 2 < cx ? "worn-w" : "worn-e"} x={x} y={c.y} width={w} height={c.h} />
              ))}
              <path className="joints" d={c.joints.map((x) => `M${x.toFixed(1)} ${c.y.toFixed(1)}v${c.h.toFixed(1)}`).join("")} />
              <path className="tread" d={`M${(cx - c.hw).toFixed(1)} ${c.y.toFixed(1)}H${(cx + c.hw).toFixed(1)}`} />
            </g>
          ))}
          <rect className="contact" x={cx - geo.half} y={geo.baseY - 3} width={geo.half * 2} height="6" />

          {/* what is left of the smooth casing near the top */}
          {geo.casing ? (
            <g className="hero__casing">
              <path className="casing-w" d={geo.casing.edge} clipPath="url(#face-w)" />
              <path className="casing-e" d={geo.casing.edge} clipPath="url(#face-e)" />
            </g>
          ) : null}
          <path className="ridge" d={`M${cx} ${geo.capY} V${geo.baseY}`} />

          <g className="hero__cap">
            <path className="cap-lit" d={`M${cx} ${geo.apexY} L${cx - capHalf} ${geo.capY} L${cx} ${geo.capY} Z`} />
            <path className="cap-shade" d={`M${cx} ${geo.apexY} L${cx + capHalf} ${geo.capY} L${cx} ${geo.capY} Z`} />
          </g>

          {geo.ramp ? (
            <g className="hero__ramp">
              <path
                className="mud"
                d={`M${geo.ramp.x0} ${geo.ramp.y0} L${geo.ramp.x1} ${geo.ramp.y1} L${geo.ramp.x1 + 30} ${geo.ramp.y1} L${geo.ramp.x0 + 30} ${geo.ramp.y0} Z`}
              />
              {[8, 16, 24].map((o, i) => (
                <path key={o} className="mud-courses" strokeDashoffset={i * 9} d={`M${geo.ramp!.x0 + o} ${geo.ramp!.y0} L${geo.ramp!.x1 + o} ${geo.ramp!.y1}`} />
              ))}
              <g ref={sledge}>
                {crew ? (
                  <>
                    <path className="rope" d={crew.rope} />
                    {crew.haulers.map((h, i) => (
                      <g key={i} className="hauler" transform={`translate(${h.at.x.toFixed(1)} ${h.at.y.toFixed(1)})`}>
                        <path className="hauler__limb" d={h.limbs} />
                        <path className="hauler__skin" d={h.torso} />
                        <path className="hauler__kilt" d={h.kilt} />
                        <circle className="hauler__skin" cx={h.head.x} cy={h.head.y} r="2.9" />
                      </g>
                    ))}
                    {/* wetting the sand ahead of the runners, as in the tomb painting of Djehutihotep */}
                    <g className="hauler" transform={`translate(${crew.water.x.toFixed(1)} ${crew.water.y.toFixed(1)})`}>
                      <path className="water" d={`M10.6 -11.2 Q13 -5 9.5 ${(crew.k * 9.5).toFixed(1)}`} />
                      <path className="hauler__limb" d={`M-0.8 -6 L-4 ${(crew.k * -4).toFixed(1)} M1.4 -6 L4.2 ${(crew.k * 4.2).toFixed(1)} M3.6 -16.4 L7.4 -13.2`} />
                      <path className="hauler__skin" d="M1.6 -17.6 L5 -16.4 L2.2 -9.4 L-1.8 -10 Z" />
                      <path className="hauler__kilt" d="M-2.4 -10.6 L2.8 -10 L3.4 -5.4 L-2.8 -5.8 Z" />
                      <circle className="hauler__skin" cx="5.6" cy="-19.4" r="2.9" />
                      <ellipse className="jar" cx="9" cy="-13" rx="2.4" ry="3.1" transform="rotate(-35 9 -13)" />
                    </g>
                  </>
                ) : null}
                <g transform={`rotate(${rampAngle})`}>
                  <path className="sledge-runner" d="M-17 -4 H16 L16 0 H-14 Q-18 -1 -17 -4 Z" />
                  <rect className="sledge-block" x="-13" y="-19" width="26" height="15" />
                </g>
              </g>
            </g>
          ) : null}
        </svg>

        <a className="hero__tag" href="#vault" style={{ left: pct(cx + capHalf + 18, geo.W), top: pct(geo.apexY + (geo.capY - geo.apexY) * 0.42, geo.H) }}>
          {narrow ? "Capstone: top 10" : "The capstone: the 10 biggest blocks"}
        </a>

        {geo.ramp && !offline ? (
          <p className="hero__offering tabular" style={{ left: pct(geo.ramp.x1 + 30, geo.W), top: pct(geo.ramp.y1 - 112, geo.H) }}>
            <span>Next: {STEP[next.kind].name}</span>
            <span>{live ? `Offering ${escrow.toFixed(4)} of ${next.thresholdETH} ETH` : `Runs at ${next.thresholdETH} ETH`}</span>
          </p>
        ) : null}

        <div className="hero__face">
          <h1 className="hero__head">
            <span className="hero__line">{head[0]}</span> <span className="hero__line">{head[1]}</span>
          </h1>
          <p className="hero__lede">{deck}</p>
        </div>

        {narrow ? null : door}

        {narrow ? null : counts}
      </div>
      {narrow ? door : null}
      {geo.ramp ? (
        <Ramp className="sr-only" value={escrow} target={target} label={`Offering ${escrow} of ${target} ETH toward ${STEP[next.kind].name}`} />
      ) : null}
    </section>
  );
}

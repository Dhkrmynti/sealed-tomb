---
name: The Sealed Tomb
description: "$TOMB as the Pharaoh's pyramid going up on a sunlit plateau: limestone courses, red-ochre masons' marks, an electrum capstone for the ten biggest blocks, and a torchlit tomb inside."
colors:
  sky: "#d5d9d8"
  sky-deep: "#c3c8c6"
  sun: "#ece7da"
  stone: "#cbc1ad"
  stone-hi: "#d8cfbd"
  stone-lo: "#b4a890"
  stone-shade: "#a29681"
  joint: "#8a7f6b"
  haze: "#e8e4da"
  sand: "#d5bd93"
  sand-far: "#cbb48c"
  casing: "#dcd2be"
  casing-shade: "#bcb09a"
  far: "#c8beab"
  mud: "#8e6c4c"
  mud-lo: "#6b4f37"
  soot: "#1e1d1a"
  soot-soft: "#3f3b34"
  soot-faint: "#57514a"
  ochre: "#a3311b"
  ochre-deep: "#7f2412"
  ochre-ink: "#f4efe6"
  gold: "#d4a62c"
  gold-hi: "#e7c35e"
  gold-deep: "#8f6a10"
  tomb: "#15120f"
  tomb-wall: "#201b16"
  tomb-lift: "#2a241d"
  dust: "#e9deca"
  dust-soft: "#c4b8a3"
  dust-faint: "#a3967f"
  torch: "#e8a948"
  ochre-lit: "#e4643f"
  night-sky: "#11151a"
  night-stone: "#3b362e"
  night-stone-hi: "#48423a"
  night-soot: "#ece4d4"
  night-ochre: "#e0603c"
typography:
  display:
    fontFamily: "Dela Gothic One, Arial Black, sans-serif"
    fontSize: "5.3cqw"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Dela Gothic One, Arial Black, sans-serif"
    fontSize: "clamp(32px, 8.6vw, 100px)"
    fontWeight: 400
    lineHeight: 0.95
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Dela Gothic One, Arial Black, sans-serif"
    fontSize: "21px"
    fontWeight: 400
    lineHeight: 1.15
  deck:
    fontFamily: "Schibsted Grotesk, Helvetica Neue, Arial, sans-serif"
    fontSize: "clamp(17px, 1.4vw, 20px)"
    fontWeight: 400
    lineHeight: 1.5
  body:
    fontFamily: "Schibsted Grotesk, Helvetica Neue, Arial, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Schibsted Grotesk, Helvetica Neue, Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "0.04em"
  data:
    fontFamily: "Red Hat Mono, ui-monospace, Menlo, monospace"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.06em"
rounded:
  none: "0px"
  cartouche: "999px"
spacing:
  gutter: "clamp(16px, 3.4vw, 48px)"
  max: "1320px"
  head: "60px"
  section: "clamp(88px, 11vw, 160px)"
components:
  button-primary:
    backgroundColor: "{colors.ochre}"
    textColor: "{colors.ochre-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0 24px"
    height: "54px"
  button-primary-hover:
    backgroundColor: "{colors.ochre-deep}"
    textColor: "{colors.ochre-ink}"
  button-ink:
    backgroundColor: "{colors.soot}"
    textColor: "{colors.stone}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0 24px"
    height: "54px"
  button-ink-inside:
    backgroundColor: "{colors.dust}"
    textColor: "{colors.tomb}"
  button-small:
    padding: "0 16px"
    height: "40px"
  ca-tablet:
    textColor: "{colors.dust}"
    typography: "{typography.data}"
    rounded: "{rounded.none}"
    height: "54px"
  input-lookup:
    backgroundColor: "{colors.tomb}"
    textColor: "{colors.dust}"
    typography: "{typography.data}"
    rounded: "{rounded.none}"
    height: "54px"
  capstone-stone:
    backgroundColor: "{colors.gold-hi}"
    textColor: "{colors.soot}"
    rounded: "{rounded.none}"
  block-card:
    backgroundColor: "{colors.stone-hi}"
    textColor: "{colors.soot}"
    rounded: "{rounded.none}"
  lintel:
    backgroundColor: "{colors.tomb}"
    textColor: "{colors.dust}"
    height: "60px"
---

# Design System: The Sealed Tomb

## Overview

**Creative North Star: "The Pharaoh's Building Site"**

The site is the Pharaoh's pyramid while it is still going up. Outside, under a flat noon sky, every surface is limestone laid in courses with mortar joints; the masons' red-ochre marks set the headlines and the one action; the electrum capstone holds the ten biggest blocks. Inside, the same stone is lit by torches: dark sandstone, dust-coloured type, a warm light falling from the upper left. The two worlds meet once, at the entrance: the visitor walks up to the doorway and the daylight drains away.

The mechanism is drawn, not described: holders are blocks, rank is height in the pyramid, the top ten sit in the gold capstone, the escrow is a block hauled up the ramp, a seller is a block pulled out and cursed. Every number comes from the engine; demo numbers are labelled.

**Key Characteristics:**
- Limestone courses as the ground of the outside sections; flat sky behind the monuments.
- Red ochre for the masons' marks: headlines painted on stone, the primary action, the curse.
- Electrum gold reserved for the capstone and the ten blocks in it (and the CA tag).
- One theme switch, earned: day outside, torchlight inside, joined by the entrance walk.
- Square stone geometry; only the sun, the cartouche and the stela's top are round.
- Motion is construction: courses set from the ground up, stones lowered into the capstone, headlines painted stroke by stroke, the walk inside, the doors sliding shut.

## Colors

Four inks on stone: limestone, red ochre, soot and electrum, with a torchlit interior family and a moonlit night scheme.

### Primary
- **Red Ochre** (`ochre`): the masons' paint. Hero headline (multiplied onto the stone), the "next" mark on the rite, the curse tablet, the sell warning, the closing line, the primary button, focus rings, selection and caret. **Pressed Ochre** (`ochre-deep`) is its hover. **Linen** (`ochre-ink`) is the type on ochre. Inside the tomb the same role is played by **Lit Ochre** (`ochre-lit`).

### Secondary
- **Electrum** (`gold`, `gold-hi`, `gold-deep`): the capstone in the hero, the ten capstone stones, the tribute course and share, the CA tag, the connected-wallet dot. Nothing else is gold.

### Neutral
- **Limestone** (`stone`, `stone-hi`, `stone-lo`, `stone-shade`): the four tones blocks are cut in. Lit west face uses `stone-hi`/`stone`, the shaded east face `stone-lo`/`stone-shade`. `stone-hi` is also the plaque behind text set on the pyramid and the found block card.
- **Mortar** (`joint`): every joint line, block border and ramp edge.
- **Noon Sky** (`sky`, `sky-deep`, fading to `haze` at the horizon) and **Sun** (`sun`): the field behind the hero pyramid and the leaderboard pyramid.
- **The plateau** (`sand`, `sand-far`, `far`, `casing`, `casing-shade`, `mud`, `mud-lo`): ground, dunes, far pyramids, the surviving casing and the mudbrick ramp. Illustration only.
- **Soot** (`soot`, `soot-soft`, `soot-faint`): type and black marks outside. `soot-faint` is never used on `stone-lo`.
- **The Tomb** (`tomb`, `tomb-wall`, `tomb-lift`) with **Dust** type (`dust`, `dust-soft`, `dust-faint`) and **Torch** (`torch`): everything inside the entrance, the lintel and the hero doorway.

### Night
Under `prefers-color-scheme: dark` the plateau is moonlit: `night-sky`, darker limestone (`night-stone`, `night-stone-hi`), light soot (`night-soot`) and a brighter ochre (`night-ochre`). Multiply blending turns off at night so ochre paint stays legible on dark stone. The interior family does not change.

### Named Rules
**The Electrum Rule.** Gold means "in the capstone". Using it for decoration anywhere else breaks the one thing the colour has to say.
**The One Switch Rule.** The page changes theme exactly once, at the entrance, through the walk-in. No other section inverts.

## Typography

**Display Font:** Dela Gothic One (with Arial Black fallback)
**Body Font:** Schibsted Grotesk (400, 600, 800, italic)
**Data Font:** Red Hat Mono (400, 600)

All three are self-hosted through @fontsource.

**Character:** Dela's heavy, squared letters read like blocks cut and set; the grotesque is plain workaday reading; the mono marks anything that comes off the chain.

### Hierarchy
- **Display** (400, `5.3cqw` of the hero stage on desktop, `11.4cqw` on phones, 1.0, uppercase): the hero headline painted across the pyramid.
- **Headline** (400, `clamp(32px, 8.6vw, 100px)`, 0.95, uppercase, balanced): section heads, the entrance line, the closing line.
- **Title** (400, 20 to 24px, uppercase): law titles, the workshop head, the table caption, card names in the cartouche, big figures.
- **Deck** (400, 17 to 20px, max 54ch): the line under each section head.
- **Body** (400, 17px; 16px on phones): reading copy.
- **Label** (800, 14 to 18px, 0.04em, uppercase): buttons, course names, inscription kinds.
- **Data** (Red Hat Mono 400 to 600, 11.5 to 15px): field labels, addresses, tx links, amounts in tables, the CA.

### Named Rules
**The Mono Is Chain Rule.** Red Hat Mono sets addresses, hashes, amounts and the small labels over data; never prose or headlines.

## Layout

A centred column (max 1320px) with a fluid gutter. Sections are tall and separated by their ground, not by rules: limestone courses (the rite, the laws), open sky (the pyramid), torchlit wall (inside). Each section opens with the ochre levelling line (a 3px cord with end ticks), a headline and a deck.

The hero is a stage with the pyramid's own aspect ratio (1600 by 760 on desktop, 1000 by 1900 upright on phones) whose overlays are positioned in the stage's container-query units, so the painted headline, the doorway, the capstone tag, the ramp label and the base counts stay locked to the stone at any width. The rite is three stepped courses (narrowest on top). The leaderboard is a literal pyramid of 1, 2, 3 and 4 stones with a table below it. The laws are a stela beside a sticky curse tablet. Inside, the block search is two columns; the inscriptions are one full-width course per rite.

Breakpoints: 1080px (lintel nav hidden, inscriptions regrid), 900px (laws and block page to one column, ramp label hidden), 760px (phone stage, buttons show short labels in the lintel, single-column courses, stacked tally).

## Elevation & Depth

Depth comes from stone tone and the noon sun. One cast shadow (`--cast`: down and to the right, warm brown) sits under courses, capstone stones, the curse tablet and the primary button; inside, `--cast-dark` sits under the found block. Night darkens the cast. The torchlight inside is a single warm radial light from the upper left over the dark masonry.

### Named Rules
**The Noon Sun Rule.** Light comes from the upper left, always: the west face is lit, the east face is shaded, shadows fall down and to the right.

## Shapes

Stone is square: every block, button, field, card, course and stone has square corners. Round only where the world is round: the sun disc, the cartouche around a name on the block card (`rounded.cartouche`, with the tie bar at its end), the stela's arched top, the connected-wallet dot. Masons' marks may sit askew: the "next" mark at -6deg, the status stamp at -7deg.

## Components

### Buttons
- **Primary:** ochre slab, linen label in 800 uppercase, 54px tall, square, the cast shadow. Hover deepens to pressed ochre and lifts 1px; active sinks 1px and drops the shadow.
- **Ink:** soot slab outside, dust slab inside the tomb; hover turns ochre.
- **Small:** 40px, no shadow (lintel).
- **Waiting:** transparent, dashed border in the current colour, used before launch ("Tomb opens soon").

### The CA tablet
A square outline in the current colour with a gold "CA" tag, the address in mono with an ellipsis, a copy icon. Hover turns the outline to lit ochre.

### The lintel
A fixed soot beam (60px) with a 3px ochre line under it, the brand mask and name, the section index, the wallet button and the small buy button. It holds in daylight and in the tomb alike.

### The hero pyramid
Generated geometry of a Giza-style pyramid seen across one corner: 44 seeded courses (32 on phones) that thin toward the top and step in from the course below, lit west face and shaded east face split at the ridge, worn blocks and vertical joints, a light tread on every step, and the smooth casing (`casing`, `casing-shade`) still clinging to the upper fifth and breaking off along a ragged line, as on Khafre's pyramid. Around it: a hazy sky (`sky` to `haze`), the sun low in the west, two far pyramids in the haze, dunes, sand (`sand`) with the pyramid's shadow and a contact shadow at the base. A long, shallow mudbrick ramp (`mud`, `mud-lo`) runs in from the sand on the east; four haulers pull the sledge whose position is escrow / next threshold. The headline is painted in ochre across the courses; the lede sits on a `stone-hi` plaque; the doorway at the base holds the buy button and the CA.

### The ramp meter
On phones the ramp becomes a horizontal track in the doorway: dust track, lit-ochre progress, a small stone block riding at the escrow position.

### Capstone stones
Gold stones (1px gold-deep border, cast shadow) with rank, mask or X avatar, name and bag; each opens that wallet's block. Empty places are dashed outlines marked "open".

### The block card
A `stone-hi` block pulled into the torchlight: header with the brand and "Block", the mask, the name inside a cartouche, a two-column fact grid, an italic status line, a mono footer, and the mason's stamp (soot when sealed, faint when curing or loose, ochre when cursed).

### Masks
Every wallet wears a royal mask built from four parts (material, crown, regalia, backdrop; 5, 5, 6, 6 options, matching the engine's validation). The brand mark is the gold mask with the nemes and false beard.

### Motion
Exponential ease-out (`--ease-set`, GSAP `expo.out`). Section heads are cut in: the levelling line snaps across, the headline is chiselled in from the left by clip-path, the deck settles. Each section then has its own move: courses dragged in on sledges from alternating sides, capstone stones lowered course by course from the widest row up, the stela raised from the sand, the curse count counted out, inscriptions chiselled in batches, the doors of the seal sliding shut on scroll. The signature is the entrance: on desktop the wall pins and scales toward the doorway until its dark fills the screen; phones scrub the same walk without a pin. Lenis smooth scroll. Reduced motion skips all of it and shows the finished stone.

## Do's and Don'ts

### Do:
- **Do** keep gold to the capstone, the ten stones in it, the tribute course and the CA tag.
- **Do** paint headlines on stone in ochre with multiply in daylight, plain at night.
- **Do** put text that sits on the masonry on a `stone-hi` plaque when it is longer than a headline.
- **Do** keep light coming from the upper left.
- **Do** keep demo numbers labelled and every live number from the engine.
- **Do** collapse all motion to the finished stone under reduced motion.

### Don't:
- **Don't** call the tribute a dividend or holders shareholders, and don't let the pyramid read as recruitment: nobody earns from bringing anyone in.
- **Don't** add a second accent hue, gradients other than the torchlight, glows or neon.
- **Don't** round blocks, buttons, fields or cards.
- **Don't** invert any section other than at the entrance.
- **Don't** set prose in Red Hat Mono or body copy in Dela Gothic One.
- **Don't** use pure `#000` or `#fff`.

/**
 * Every wallet gets a royal alias until its owner carves a throne name. The alias is
 * computed from the address alone, so the same wallet always gets the same name,
 * everywhere, with nothing stored.
 */
const NAMES = [
  "Ahmose", "Seti", "Tiye", "Nefer", "Kha", "Meryt", "Ramose", "Hori", "Ipi", "Nakht",
  "Paser", "Senu", "Bek", "Hapu", "Iset", "Neb", "Sennefer", "Tuya", "Huy", "Djedi",
  "Henut", "Mahu", "Ptahmose", "Rensi", "Satre", "Tjia", "Wennefer", "Yuya", "Baki", "Khay",
];
const EPITHETS = [
  "the Patient", "the Unsold", "Twice-Sealed", "of the Long Hold", "the Quiet", "the Heavy",
  "Stone-Hand", "the Unmoved", "of the Deep Bag", "the Steady", "the Golden", "the Silent",
  "Sun-Baked", "the Mason", "the Elder", "of the Night Shift", "the Ramp-Hauler", "Never-Sold",
  "the Buried", "of the Capstone", "the Cured", "Sand-Footed", "the Keeper", "the Calm",
  "of the First Course", "the Stubborn", "the Sealed", "Granite-Willed", "the Watchful", "the Dry",
];

function hash(s: string) {
  // FNV-1a, 32-bit: small, fast, and stable across browsers
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function aliasFor(addr: string) {
  const h = hash(addr.toLowerCase());
  return `${NAMES[h % NAMES.length]} ${EPITHETS[Math.floor(h / NAMES.length) % EPITHETS.length]}`;
}

/** What the pyramid shows for a wallet: its X handle, else its carved throne name, else its royal alias. */
export function nameFor(addr: string, nickname?: string, x?: { username: string } | null) {
  if (x) return { name: `@${x.username}`, claimed: true, x: true };
  return nickname ? { name: nickname, claimed: true, x: false } : { name: aliasFor(addr), claimed: false, x: false };
}

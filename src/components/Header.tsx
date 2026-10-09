import type { Status } from "../lib/api";
import { BuyButton } from "./Bits";
import { ConnectButton } from "./Connect";
import { Mugshot } from "./Mugshot";

const PAGES = [
  ["#heist", "The rite"],
  ["#vault", "The pyramid"],
  ["#rules", "Laws"],
  ["#card", "Your block"],
  ["#blotter", "Inscriptions"],
] as const;

/** The lintel: a soot beam across the top that holds in daylight and in the tomb alike. */
export function Header({ status }: { status: Status | null }) {
  return (
    <header className="lintel">
      <div className="wrap lintel__inner">
        <a className="lintel__name" href="#top" aria-label="The Sealed Tomb, back to the top">
          <Mugshot traits={[0, 1, 1, 0]} size={30} className="lintel__mark" />
          <span>The Sealed Tomb</span>
        </a>
        <nav className="lintel__nav" aria-label="Sections">
          {PAGES.map(([href, label]) => (
            <a key={href} href={href}>
              {label}
            </a>
          ))}
        </nav>
        <div className="lintel__acts">
          <ConnectButton />
          <BuyButton status={status} className="is-small" />
        </div>
      </div>
    </header>
  );
}

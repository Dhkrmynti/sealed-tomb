/**
 * The header's wallet button. Connecting opens the holder's own block, already
 * unlocked for a throne name, mask or X link. It never asks for a transaction.
 */
import { useState } from "react";
import { Wallet } from "@phosphor-icons/react";
import { DEMO, demoPond, short } from "../lib/api";
import { connectWallet, hasWallet, pretendAccount, useAccount } from "../lib/wallet";
import { openCard } from "./CrewCard";

export function ConnectButton({ className = "" }: { className?: string }) {
  const account = useAccount();
  const [busy, setBusy] = useState(false);

  const press = async () => {
    if (account) return openCard(account);
    // Illustration edition: a real wallet only shares its address; without one, borrow a block.
    if (DEMO && !hasWallet()) {
      const a = demoPond().rows[1].addr;
      pretendAccount(a);
      return openCard(a);
    }
    if (!hasWallet()) return window.dispatchEvent(new Event("rbank:nowallet"));
    try {
      setBusy(true);
      openCard(await connectWallet());
    } catch {
      /* closed the popup: nothing to do */
    } finally {
      setBusy(false);
    }
  };

  return (
    <button type="button" className={`connect ${account ? "is-on" : ""} ${className}`} onClick={press} disabled={busy} aria-label={account ? `Connected as ${account}. Open my block` : "Connect wallet"}>
      {account ? <span className="connect__dot" aria-hidden="true" /> : <Wallet weight="bold" aria-hidden="true" />}
      <span className="connect__label tabular">{busy ? "Connecting" : account ? short(account) : "Connect"}</span>
    </button>
  );
}

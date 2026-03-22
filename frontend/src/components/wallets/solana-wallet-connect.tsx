"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useEffect } from "react";

interface Props {
  onConnect?: (address: string, walletName: string) => void;
}

export function SolanaWalletConnect({ onConnect }: Props) {
  const { publicKey, wallet, connected } = useWallet();

  useEffect(() => {
    if (connected && publicKey && wallet) {
      onConnect?.(publicKey.toBase58(), wallet.adapter.name);
    }
  }, [connected, publicKey, wallet, onConnect]);

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-medium" style={{ color: "var(--txt-3)" }}>Solana Wallet</p>
      <WalletMultiButton />
      {connected && publicKey && (
        <p className="font-mono text-[10px] truncate" style={{ color: "var(--txt-4)" }}>
          {publicKey.toBase58()}
        </p>
      )}
    </div>
  );
}

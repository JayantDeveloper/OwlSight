"use client";

import { useState, useCallback } from "react";
import { Trash2 } from "lucide-react";
import { EvmWalletConnect } from "@/components/wallets/evm-wallet-connect";

interface LinkedWallet {
  id: string;
  ecosystem: string;
  address: string;
  chainId: number | null;
  walletType: string | null;
  label: string | null;
}

export function WalletsClient({ initialWallets }: { initialWallets: LinkedWallet[] }) {
  const [wallets, setWallets] = useState(initialWallets);

  const saveWallet = useCallback(async (ecosystem: string, address: string, walletType: string, chainId?: number) => {
    const res = await fetch("/api/wallets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ecosystem, address, walletType, chainId, network: "mainnet" }),
    });
    if (res.ok) {
      const { wallet } = await res.json();
      setWallets((prev) => {
        const exists = prev.find((w) => w.id === wallet.id);
        if (exists) return prev.map((w) => (w.id === wallet.id ? wallet : w));
        return [...prev, wallet];
      });
    }
  }, []);

  const removeWallet = async (id: string) => {
    await fetch(`/api/wallets/${id}`, { method: "DELETE" });
    setWallets((prev) => prev.filter((w) => w.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* EVM */}
      <div>
        <EvmWalletConnect
          onConnect={(address, walletType, chainId) => saveWallet("evm", address, walletType, chainId)}
        />
      </div>

      {/* Solana placeholder - full adapter needs SSR-safe setup */}
      <div className="rounded-xl border px-4 py-3" style={{ borderColor: "var(--border)" }}>
        <p className="text-xs font-medium" style={{ color: "var(--txt-3)" }}>Solana Wallet</p>
        <p className="mt-1.5 text-xs" style={{ color: "var(--txt-4)" }}>
          Phantom and other Solana wallets — coming in the next release. Use the app&apos;s built-in wallet picker in Mission Control for now.
        </p>
      </div>

      {/* Saved wallets list */}
      {wallets.length > 0 && (
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--txt-4)" }}>Saved Wallets</p>
          <div className="space-y-2">
            {wallets.map((w) => (
              <div
                key={w.id}
                className="flex items-center gap-3 rounded-xl border px-4 py-3"
                style={{ borderColor: "var(--border)" }}
              >
                <div className="h-2 w-2 rounded-full shrink-0" style={{ background: w.ecosystem === "solana" ? "#9945FF" : "#3B82F6" }} />
                <span className="text-xs font-medium capitalize shrink-0" style={{ color: "var(--txt-3)" }}>{w.ecosystem}</span>
                <span className="font-mono text-xs truncate" style={{ color: "var(--txt-2)" }}>
                  {w.address.slice(0, 8)}…{w.address.slice(-6)}
                </span>
                {w.walletType && (
                  <span className="ml-auto shrink-0 text-[10px] capitalize" style={{ color: "var(--txt-4)" }}>{w.walletType}</span>
                )}
                <button
                  type="button"
                  onClick={() => removeWallet(w.id)}
                  className="shrink-0 text-red-400/60 transition-colors hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

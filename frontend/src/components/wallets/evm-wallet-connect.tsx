"use client";

import { useAccount, useConnect, useConnectors, useDisconnect } from "wagmi";
import { useEffect, useState } from "react";
import { ExternalLink, RefreshCw } from "lucide-react";

interface Props {
  onConnect?: (address: string, walletType: string, chainId: number) => void;
}

export function EvmWalletConnect({ onConnect }: Props) {
  const { address, isConnected, chainId } = useAccount();
  const { connect, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const connectors = useConnectors();

  // Wait for client-side mount before checking window.ethereum.
  // MetaMask injects its provider asynchronously after page load, so a
  // synchronous check during SSR/hydration will always return false.
  const [mounted, setMounted] = useState(false);
  const [hasInjectedProvider, setHasInjectedProvider] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check immediately, then once more after a short delay in case
    // MetaMask's injection is slightly deferred.
    const check = () => {
      setHasInjectedProvider(
        typeof (window as Window & { ethereum?: unknown }).ethereum !== "undefined"
      );
    };
    check();
    const t = setTimeout(check, 400);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (isConnected && address && chainId) {
      onConnect?.(address, "metamask", chainId);
    }
  }, [isConnected, address, chainId, onConnect]);

  if (isConnected && address) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium" style={{ color: "var(--txt-3)" }}>EVM Wallet Connected</p>
        <p className="font-mono text-xs truncate" style={{ color: "var(--txt-2)" }}>{address}</p>
        <button
          type="button"
          onClick={() => disconnect()}
          className="rounded-xl border px-3 py-2 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/[0.07]"
          style={{ borderColor: "var(--border)" }}
        >
          Disconnect
        </button>
      </div>
    );
  }

  const injectedConnector = connectors.find((c) => c.type === "injected");
  const wcConnector = connectors.find((c) => c.type === "walletConnect");

  // Before mount, show a neutral skeleton so we don't flash "no wallet" prematurely
  if (!mounted) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-xs font-medium" style={{ color: "var(--txt-3)" }}>EVM Wallet</p>
        <div
          className="animate-pulse rounded-xl border px-4 py-2.5"
          style={{ borderColor: "var(--border)", background: "var(--surface-2)", height: "40px" }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-medium" style={{ color: "var(--txt-3)" }}>EVM Wallet</p>

      <div className="flex flex-col gap-2">
        {injectedConnector && hasInjectedProvider ? (
          <button
            type="button"
            disabled={isPending}
            onClick={() => connect({ connector: injectedConnector })}
            className="rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-white/[0.06] disabled:opacity-50"
            style={{ borderColor: "var(--border)", color: "var(--txt-2)" }}
          >
            {isPending ? "Connecting… (check MetaMask popup)" : "Connect MetaMask"}
          </button>
        ) : (
          <div
            className="rounded-xl border px-4 py-4 space-y-2"
            style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
          >
            <p className="text-xs font-semibold" style={{ color: "var(--txt-2)" }}>
              MetaMask not detected
            </p>
            <p className="text-[11px] leading-5" style={{ color: "var(--txt-4)" }}>
              Make sure the MetaMask extension is installed and <strong>enabled</strong> in your browser, then reload this page.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-medium transition-colors hover:bg-white/[0.05]"
                style={{ borderColor: "var(--border)", color: "var(--txt-3)" }}
              >
                <RefreshCw className="h-3 w-3" />
                Reload page
              </button>
              <a
                href="https://metamask.io/download/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-solviolet hover:underline"
              >
                Get MetaMask <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </div>
          </div>
        )}

        {wcConnector && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => connect({ connector: wcConnector })}
            className="rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-white/[0.06] disabled:opacity-50"
            style={{ borderColor: "var(--border)", color: "var(--txt-2)" }}
          >
            {isPending ? "Connecting…" : "WalletConnect (mobile)"}
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/[0.07] px-3 py-2">
          <p className="text-xs font-medium text-red-400">Connection failed</p>
          <p className="mt-0.5 text-[11px] text-red-400/70">{error.message}</p>
          {error.message.toLowerCase().includes("user rejected") && (
            <p className="mt-1 text-[11px]" style={{ color: "var(--txt-4)" }}>
              You dismissed the MetaMask popup — click Connect again and approve the request.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

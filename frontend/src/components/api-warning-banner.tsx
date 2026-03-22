import { AlertTriangle } from "lucide-react";

interface ApiWarningBannerProps {
  warnings: string[];
}

export function ApiWarningBanner({ warnings }: ApiWarningBannerProps) {
  if (!warnings.length) return null;

  return (
    <div className="animate-fade-in rounded-2xl border border-amber-500/25 bg-amber-500/[0.08] p-4 text-amber-400">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em]">
            API Warning
          </p>
          <div className="mt-2 space-y-1 text-xs opacity-80">
            {warnings.map((w) => (
              <p key={w}>{w}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

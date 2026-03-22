function trimTrailingZeros(value: string): string {
  return value.replace(/\.0+$/, "").replace(/(\.\d*[1-9])0+$/, "$1");
}

function formatCompactCore(value: number): { sign: string; number: string; suffix: string } | null {
  const abs = Math.abs(value);
  const units = [
    { threshold: 1_000_000_000_000, suffix: "T" },
    { threshold: 1_000_000_000, suffix: "B" },
    { threshold: 1_000_000, suffix: "M" },
    { threshold: 1_000, suffix: "K" },
  ];

  for (const unit of units) {
    if (abs >= unit.threshold) {
      const scaled = abs / unit.threshold;
      const decimals = scaled >= 100 ? 0 : 1;
      return {
        sign: value < 0 ? "-" : "",
        number: trimTrailingZeros(scaled.toFixed(decimals)),
        suffix: unit.suffix,
      };
    }
  }

  return null;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: value < 100 ? 2 : 0,
    maximumFractionDigits: value >= 1000 ? 0 : 2,
  }).format(value);
}

export function formatBps(value: number): string {
  return `${value.toFixed(0)} bps`;
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(Math.abs(value) < 0.1 ? 1 : 0)}%`;
}

export function formatSignedPercent(value: number): string {
  const percentage = value * 100;
  const formatted = `${Math.abs(percentage).toFixed(Math.abs(percentage) < 1 ? 2 : 1)}%`;
  if (percentage > 0) {
    return `+${formatted}`;
  }
  if (percentage < 0) {
    return `-${formatted}`;
  }
  return formatted;
}

export function formatDuration(seconds: number): string {
  if (seconds < 10) {
    return `${seconds.toFixed(1)}s`;
  }
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }
  const mins = Math.floor(seconds / 60);
  const rem = seconds % 60;
  return rem === 0 ? `${mins}m` : `${mins}m ${rem}s`;
}

export function formatLatency(seconds: number): string {
  return formatDuration(seconds);
}

export function formatCompactNumber(value: number): string {
  const compact = formatCompactCore(value);
  if (compact) {
    return `${compact.sign}${compact.number}${compact.suffix}`;
  }

  if (Number.isInteger(value)) {
    return value.toString();
  }

  return trimTrailingZeros(value.toFixed(1));
}

export function formatTime(isoString: string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(isoString));
}

export function formatProviderName(value: string): string {
  if (value === "coingecko") {
    return "CoinGecko";
  }
  if (value === "birdeye") {
    return "Birdeye";
  }
  if (value === "mock") {
    return "Mock";
  }
  return value.replaceAll("_", " ");
}

export function formatScenarioName(value: string): string {
  if (value === "none") {
    return "Live Feed";
  }
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatRequestId(value?: string | null): string {
  if (!value) {
    return "Not assigned";
  }
  if (value.length <= 16) {
    return value;
  }
  return `${value.slice(0, 8)}…${value.slice(-4)}`;
}

export function formatCompactCurrency(value: number): string {
  const compact = formatCompactCore(value);
  if (compact) {
    return `${compact.sign}$${compact.number}${compact.suffix}`;
  }

  return formatCurrency(value);
}

export function formatStatusLabel(value: string): string {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

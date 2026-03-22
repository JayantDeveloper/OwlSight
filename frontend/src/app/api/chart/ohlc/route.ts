import { NextRequest, NextResponse } from "next/server";

// Force dynamic so Next.js never caches this route — we manage our own day-based cache.
export const dynamic = "force-dynamic";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ChartPoint {
  t: number;        // unix ms
  close: number;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
}

export interface CoinChartData {
  symbol: string;
  source: "birdeye" | "coingecko";
  hasOHLC: boolean;
  hasVolume: boolean;
  points: ChartPoint[];    // daily close prices (for line chart)
  candles?: ChartPoint[];  // raw OHLCV candles (for candlestick mode)
  error?: string;
}

// ── Config ────────────────────────────────────────────────────────────────────

const CG_KEY  = process.env.COINGECKO_API_KEY ?? "";
const CG_BASE = "https://api.coingecko.com/api/v3";
const BE_KEY  = process.env.BIRDEYE_API_KEY ?? "";
const BE_BASE = "https://public-api.birdeye.so";

// CoinGecko coin IDs (non-Solana assets)
const CG_IDS: Record<string, string> = {
  ETH:   "ethereum",
  BTC:   "bitcoin",
  WBTC:  "wrapped-bitcoin",
  USDC:  "usd-coin",
  USDT:  "tether",
  BNB:   "binancecoin",
  MATIC: "matic-network",
  AVAX:  "avalanche-2",
  ARB:   "arbitrum",
  OP:    "optimism",
  LINK:  "chainlink",
  UNI:   "uniswap",
  AAVE:  "aave",
  WETH:  "weth",
};

// Birdeye Solana token addresses
const BE_ADDRESSES: Record<string, string> = {
  SOL: "So11111111111111111111111111111111111111112",
};

// ── Day-based in-memory cache ─────────────────────────────────────────────────

interface CacheEntry {
  data: CoinChartData;
  fetchedDate: string; // "YYYY-MM-DD" UTC
}

const cache = new Map<string, CacheEntry>();

function todayUTC(): string {
  return new Date().toISOString().split("T")[0];
}

function getCached(symbol: string, days: number): CoinChartData | null {
  const entry = cache.get(`${symbol}_${days}`);
  if (entry?.fetchedDate === todayUTC()) return entry.data;
  return null;
}

function setCache(symbol: string, days: number, data: CoinChartData): void {
  cache.set(`${symbol}_${days}`, { data, fetchedDate: todayUTC() });
}

// ── CoinGecko fetcher ─────────────────────────────────────────────────────────

async function fetchCoinGecko(symbol: string, days: number): Promise<CoinChartData> {
  const coinId = CG_IDS[symbol];
  if (!coinId) {
    return { symbol, source: "coingecko", hasOHLC: false, hasVolume: false, points: [], error: `No price feed for ${symbol}` };
  }

  const headers: Record<string, string> = { accept: "application/json" };
  if (CG_KEY) headers["x-cg-demo-api-key"] = CG_KEY;

  // ── 1. Daily close prices + volume (market_chart) ──────────────────────────
  let points: ChartPoint[] = [];
  let hasVolume = false;

  try {
    const chartRes = await fetch(
      `${CG_BASE}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}&interval=daily`,
      { headers, cache: "no-store" },
    );

    if (chartRes.status === 429) {
      return { symbol, source: "coingecko", hasOHLC: false, hasVolume: false, points: [], error: "CoinGecko rate limit — try again shortly" };
    }
    if (!chartRes.ok) {
      return { symbol, source: "coingecko", hasOHLC: false, hasVolume: false, points: [], error: `CoinGecko error ${chartRes.status}` };
    }

    const chartData = await chartRes.json() as {
      prices?: [number, number][];
      total_volumes?: [number, number][];
    };

    const prices  = chartData.prices ?? [];
    const volumes = chartData.total_volumes ?? [];
    const volMap  = new Map(volumes.map(([t, v]) => [t, v]));

    hasVolume = volumes.length > 0;
    points = prices.map(([t, close]) => ({
      t,
      close,
      ...(volMap.has(t) ? { volume: volMap.get(t) as number } : {}),
    }));
  } catch {
    return { symbol, source: "coingecko", hasOHLC: false, hasVolume: false, points: [], error: "Network error reaching CoinGecko" };
  }

  if (!points.length) {
    return { symbol, source: "coingecko", hasOHLC: false, hasVolume: false, points: [], error: `No price data returned for ${symbol}` };
  }

  // ── 2. OHLC candles (separate endpoint) ────────────────────────────────────
  let candles: ChartPoint[] | undefined;
  let hasOHLC = false;

  try {
    const ohlcRes = await fetch(
      `${CG_BASE}/coins/${coinId}/ohlc?vs_currency=usd&days=${days}`,
      { headers, cache: "no-store" },
    );

    if (ohlcRes.ok) {
      const ohlcArr = await ohlcRes.json() as [number, number, number, number, number][];
      if (Array.isArray(ohlcArr) && ohlcArr.length > 0) {
        candles = ohlcArr.map(([t, o, h, l, c]) => ({ t, open: o, high: h, low: l, close: c }));
        hasOHLC = true;
      }
    }
  } catch {
    // OHLC is optional — line chart still works without it
  }

  return { symbol, source: "coingecko", hasOHLC, hasVolume, points, candles };
}

// ── Birdeye fetcher ───────────────────────────────────────────────────────────

type BirdeyeOhlcvItem = {
  unixTime?: number;
  o?: number; open?: number;
  h?: number; high?: number;
  l?: number; low?: number;
  c?: number; close?: number;
  v?: number; volume?: number;
};

async function fetchBirdeye(symbol: string, days: number): Promise<CoinChartData> {
  const address = BE_ADDRESSES[symbol];
  if (!address) {
    return { symbol, source: "birdeye", hasOHLC: false, hasVolume: false, points: [], error: `No Birdeye address for ${symbol}` };
  }

  const now  = Math.floor(Date.now() / 1000);
  const from = now - days * 86400;

  const headers = {
    "X-API-KEY": BE_KEY,
    "x-chain":   "solana",
    accept:      "application/json",
  };

  // ── 1. Try OHLCV endpoint ──────────────────────────────────────────────────
  try {
    const ohlcvRes = await fetch(
      `${BE_BASE}/defi/ohlcv?address=${address}&type=1D&time_from=${from}&time_to=${now}`,
      { headers, cache: "no-store" },
    );

    if (ohlcvRes.ok) {
      const ohlcvData = await ohlcvRes.json() as {
        success?: boolean;
        data?: { items?: BirdeyeOhlcvItem[] };
      };

      if (ohlcvData?.success && Array.isArray(ohlcvData?.data?.items) && ohlcvData.data!.items!.length > 0) {
        const candles: ChartPoint[] = ohlcvData.data!.items!
          .map((item) => ({
            t:      (item.unixTime ?? 0) * 1000,
            open:   item.o ?? item.open  ?? 0,
            high:   item.h ?? item.high  ?? 0,
            low:    item.l ?? item.low   ?? 0,
            close:  item.c ?? item.close ?? 0,
            volume: item.v ?? item.volume,
          }))
          .filter((p) => p.t > 0 && p.close > 0);

        if (candles.length > 0) {
          const points: ChartPoint[] = candles.map((c) => ({ t: c.t, close: c.close, volume: c.volume }));
          return { symbol, source: "birdeye", hasOHLC: true, hasVolume: true, points, candles };
        }
      }
    }
  } catch {
    // Fall through to history_price
  }

  // ── 2. Fallback: history_price (close only) ────────────────────────────────
  try {
    const histRes = await fetch(
      `${BE_BASE}/defi/history_price?address=${address}&address_type=token&type=1D&time_from=${from}&time_to=${now}`,
      { headers, cache: "no-store" },
    );

    if (!histRes.ok) {
      return { symbol, source: "birdeye", hasOHLC: false, hasVolume: false, points: [], error: `Birdeye unavailable (HTTP ${histRes.status})` };
    }

    const histData = await histRes.json() as {
      success?: boolean;
      data?: { items?: { unixTime?: number; value?: number }[] };
    };

    if (!histData?.success || !Array.isArray(histData?.data?.items) || !histData.data!.items!.length) {
      return { symbol, source: "birdeye", hasOHLC: false, hasVolume: false, points: [], error: "Birdeye returned no data for SOL" };
    }

    const points: ChartPoint[] = histData.data!.items!
      .map((item) => ({ t: (item.unixTime ?? 0) * 1000, close: item.value ?? 0 }))
      .filter((p) => p.t > 0 && p.close > 0);

    if (!points.length) {
      return { symbol, source: "birdeye", hasOHLC: false, hasVolume: false, points: [], error: "Birdeye returned no usable data" };
    }

    return { symbol, source: "birdeye", hasOHLC: false, hasVolume: false, points };
  } catch {
    return { symbol, source: "birdeye", hasOHLC: false, hasVolume: false, points: [], error: "Network error reaching Birdeye" };
  }
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const coinsParam = searchParams.get("coins") ?? "";
  const daysParam  = parseInt(searchParams.get("days") ?? "30", 10);
  const days       = ([7, 30, 90] as const).includes(daysParam as 7 | 30 | 90) ? (daysParam as 7 | 30 | 90) : 30;

  const symbols = coinsParam
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 8); // max 8 coins per request

  if (!symbols.length) {
    return NextResponse.json({ error: "No coins specified" }, { status: 400 });
  }

  const coinData = await Promise.all(
    symbols.map(async (sym) => {
      const cached = getCached(sym, days);
      if (cached) return cached;

      const result = BE_ADDRESSES[sym]
        ? await fetchBirdeye(sym, days)
        : await fetchCoinGecko(sym, days);

      setCache(sym, days, result);
      return result;
    }),
  );

  return NextResponse.json({
    coins:       coinData,
    days,
    fetchedDate: todayUTC(),
  });
}

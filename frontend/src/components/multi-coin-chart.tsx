"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Plus, TrendingUp, X } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ChartPoint {
  t: number;
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
  points: ChartPoint[];
  candles?: ChartPoint[];
  error?: string;
}

interface ChartApiResponse {
  coins: CoinChartData[];
  days: number;
  fetchedDate: string;
}

type Days = 7 | 30 | 90;
type ChartMode = "line" | "candle";

// ── Constants ─────────────────────────────────────────────────────────────────

const COIN_COLORS: Record<string, string> = {
  SOL:  "#9945FF",
  ETH:  "#818CF8",
  BTC:  "#F7931A",
  WBTC: "#E8831D",
  USDC: "#2775CA",
  USDT: "#26A17B",
  ARB:  "#28A0F0",
  MATIC:"#8247E5",
  AVAX: "#E84142",
  OP:   "#FF0420",
  LINK: "#2A5ADA",
  UNI:  "#FF007A",
  AAVE: "#B6509E",
  BNB:  "#F3BA2F",
  WETH: "#818CF8",
};

const FALLBACK_COLORS = ["#14F195", "#f59e0b", "#38BDF8", "#f87171", "#a78bfa"];

export const CHART_KNOWN_SYMBOLS = new Set([
  "SOL", "ETH", "BTC", "WBTC", "USDC", "USDT", "BNB", "MATIC",
  "AVAX", "ARB", "OP", "LINK", "UNI", "AAVE", "WETH",
]);

// ── Helpers ───────────────────────────────────────────────────────────────────

function getCoinColor(symbol: string, idx: number): string {
  return COIN_COLORS[symbol] ?? FALLBACK_COLORS[idx % FALLBACK_COLORS.length];
}

function fmtPrice(v: number): string {
  if (v >= 1000) return `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (v >= 1)    return `$${v.toFixed(2)}`;
  return `$${v.toFixed(4)}`;
}

function fmtVol(v: number): string {
  if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(0)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
  return v.toFixed(0);
}

function fmtDate(t: number): string {
  return new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });
}

function pctChange(current: number, first: number): number {
  if (!first) return 0;
  return ((current - first) / first) * 100;
}

function findNearestIdx(points: ChartPoint[], t: number): number {
  let best = 0, bestDiff = Infinity;
  for (let i = 0; i < points.length; i++) {
    const diff = Math.abs(points[i].t - t);
    if (diff < bestDiff) { bestDiff = diff; best = i; }
  }
  return best;
}

// ── CandleView ────────────────────────────────────────────────────────────────

function CandleView({
  coinData,
  dims,
}: {
  coinData: CoinChartData | null;
  dims: { width: number; height: number };
}) {
  const [crosshair, setCrosshair] = useState<{
    svgX: number; svgY: number; snapX: number; idx: number;
  } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const candles = coinData?.candles ?? coinData?.points ?? [];

  if (!coinData || candles.length < 2) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="font-mono text-xs text-white/30">
          {coinData?.error ?? "No candlestick data available"}
        </p>
      </div>
    );
  }

  const { width: W, height: H } = dims;
  const ML = 8, MR = 72, MT = 52, MB = 36, GAP = 10;
  const chartW = Math.max(W - ML - MR, 10);
  const totalInnerH = Math.max(H - MT - MB, 40);
  const priceH = Math.floor(totalInnerH * 0.72);
  const volH   = Math.floor(totalInnerH * 0.22);
  const volY0  = MT + priceH + GAP;
  const n      = candles.length;
  const candleW = Math.max(chartW / n, 1);
  const bodyW   = Math.max(candleW * 0.55, 1);

  // Price domain
  let pMin = Infinity, pMax = -Infinity;
  for (const c of candles) {
    const lo = c.low  ?? c.close;
    const hi = c.high ?? c.close;
    if (lo < pMin) pMin = lo;
    if (hi > pMax) pMax = hi;
  }
  const pPad = (pMax - pMin) * 0.08 || pMin * 0.05;
  pMin -= pPad; pMax += pPad;

  const vMax = Math.max(...candles.map((c) => c.volume ?? 0), 1);

  const toX  = (i: number) => ML + i * candleW + candleW / 2;
  const toYP = (v: number) => MT + priceH - ((v - pMin) / Math.max(pMax - pMin, 0.001)) * priceH;

  // Y-axis ticks
  const pTicks: number[] = [];
  const rawStep = (pMax - pMin) / 6;
  const mag = Math.pow(10, Math.floor(Math.log10(Math.max(rawStep, 0.001))));
  const niceStep = Math.ceil(rawStep / mag) * mag;
  for (let t = Math.ceil(pMin / niceStep) * niceStep; t <= pMax && pTicks.length < 8; t += niceStep) {
    pTicks.push(Math.round(t * 1e6) / 1e6);
  }

  // X labels
  const xLabels: { i: number; label: string }[] = [];
  const step = Math.max(1, Math.floor(n / Math.max(Math.floor(chartW / 60), 2)));
  for (let i = 0; i < n; i += step) {
    xLabels.push({
      i,
      label: new Date(candles[i].t).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    });
  }

  const displayIdx = crosshair?.idx ?? n - 1;
  const dc = candles[displayIdx];
  const bullish = dc.close >= (dc.open ?? dc.close);
  const currentPrice  = candles[n - 1].close;
  const currentPriceY = toYP(currentPrice);

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const svgX = e.clientX - rect.left;
    const svgY = e.clientY - rect.top;
    const clampedX = Math.max(ML, Math.min(ML + chartW, svgX));
    const rawIdx = Math.round((clampedX - ML - candleW / 2) / candleW);
    const idx = Math.min(n - 1, Math.max(0, rawIdx));
    setCrosshair({ svgX, svgY, snapX: toX(idx), idx });
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* OHLC tooltip — top-left */}
      {crosshair && (
        <div className="pointer-events-none absolute left-2 top-2 z-10 rounded-lg border border-white/[0.12] bg-[#080B11]/95 p-2 font-mono text-[9px] backdrop-blur-sm">
          <p className="mb-1 text-white/40">{fmtDate(dc.t)}</p>
          <div className="space-y-0.5">
            <div className="flex gap-2">
              <span className="text-white/35">O</span>
              <span className="text-white/80">{fmtPrice(dc.open ?? dc.close)}</span>
              <span className="text-white/35">H</span>
              <span className="text-emerald-400">{fmtPrice(dc.high ?? dc.close)}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-white/35">L</span>
              <span className="text-red-400">{fmtPrice(dc.low ?? dc.close)}</span>
              <span className="text-white/35">C</span>
              <span className={`font-semibold ${bullish ? "text-emerald-400" : "text-red-400"}`}>
                {fmtPrice(dc.close)}
              </span>
            </div>
            {dc.volume !== undefined && (
              <div className="text-white/25">Vol {fmtVol(dc.volume)}</div>
            )}
            <div className="text-white/20 text-[8px] pt-0.5">
              {coinData.source === "birdeye" ? "Birdeye" : "CoinGecko"}
            </div>
          </div>
        </div>
      )}

      <svg
        ref={svgRef}
        width={W}
        height={H}
        className="absolute inset-0 cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setCrosshair(null)}
      >
        {/* Symbol label */}
        <text x={ML} y={16} fill="rgba(255,255,255,0.3)" fontSize={9} fontFamily="monospace">
          {coinData.symbol}/USD
        </text>

        {/* Price Y-axis ticks + gridlines */}
        {pTicks.map((tick) => {
          const y = toYP(tick);
          if (y < MT || y > MT + priceH) return null;
          return (
            <g key={tick}>
              <line x1={ML} y1={y} x2={ML + chartW} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
              <text x={W - MR + 6} y={y} dominantBaseline="middle" fill="rgba(255,255,255,0.28)" fontSize={9} fontFamily="monospace">
                {fmtPrice(tick).replace("$", "")}
              </text>
            </g>
          );
        })}

        {/* X-axis labels */}
        {xLabels.map(({ i, label }) => (
          <text key={i} x={toX(i)} y={H - 6} textAnchor="middle" fill="rgba(255,255,255,0.18)" fontSize={8} fontFamily="monospace">
            {label}
          </text>
        ))}

        {/* Volume divider */}
        <line x1={ML} y1={volY0 - 4} x2={ML + chartW} y2={volY0 - 4} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />

        {/* Volume bars */}
        {candles.map((c, i) => {
          if (c.volume === undefined) return null;
          const cx  = toX(i);
          const isUp = c.close >= (c.open ?? c.close);
          const barH = Math.max((c.volume / vMax) * volH, 1);
          return (
            <rect
              key={i}
              x={cx - bodyW / 2} y={volY0 + volH - barH}
              width={bodyW} height={barH}
              fill={isUp ? "#14F195" : "#f87171"} fillOpacity={0.3}
            />
          );
        })}

        {/* Candles */}
        {candles.map((c, i) => {
          const cx   = toX(i);
          const isUp = c.close >= (c.open ?? c.close);
          const color = isUp ? "#14F195" : "#f87171";
          const bodyTop = Math.min(toYP(c.open ?? c.close), toYP(c.close));
          const bodyBot = Math.max(toYP(c.open ?? c.close), toYP(c.close));
          return (
            <g key={i}>
              <line
                x1={cx} y1={toYP(c.high ?? c.close)}
                x2={cx} y2={toYP(c.low  ?? c.close)}
                stroke={color} strokeWidth={Math.max(candleW * 0.12, 0.5)} strokeOpacity={0.8}
              />
              <rect
                x={cx - bodyW / 2} y={bodyTop}
                width={bodyW} height={Math.max(bodyBot - bodyTop, 1)}
                fill={isUp ? color : "transparent"} stroke={color} strokeWidth={0.8}
                fillOpacity={isUp ? 0.85 : 0}
              />
            </g>
          );
        })}

        {/* Current price dashed line + pill */}
        {currentPriceY >= MT && currentPriceY <= MT + priceH && (
          <g>
            <line
              x1={ML} y1={currentPriceY} x2={ML + chartW} y2={currentPriceY}
              stroke="#f59e0b" strokeWidth={1} strokeDasharray="3 3" strokeOpacity={0.5}
            />
            <rect x={W - MR + 2} y={currentPriceY - 9} width={MR - 4} height={18} fill="#f59e0b" rx={3} />
            <text
              x={W - MR / 2 + 2} y={currentPriceY}
              textAnchor="middle" dominantBaseline="middle"
              fill="#000" fontSize={8} fontFamily="monospace" fontWeight={700}
            >
              {fmtPrice(currentPrice).replace("$", "")}
            </text>
          </g>
        )}

        {/* Crosshair */}
        {crosshair && (
          <>
            {/* Vertical — snapped to candle center */}
            <line
              x1={crosshair.snapX} y1={MT}
              x2={crosshair.snapX} y2={volY0 + volH}
              stroke="rgba(255,255,255,0.28)" strokeWidth={1} strokeDasharray="3 3" pointerEvents="none"
            />
            {/* Horizontal — follows mouse Y */}
            <line
              x1={ML} y1={crosshair.svgY}
              x2={ML + chartW} y2={crosshair.svgY}
              stroke="rgba(255,255,255,0.14)" strokeWidth={1} strokeDasharray="3 3" pointerEvents="none"
            />
            {/* Price label on right Y-axis at mouse Y */}
            {crosshair.svgY >= MT && crosshair.svgY <= MT + priceH && (() => {
              const price = pMin + ((MT + priceH - crosshair.svgY) / priceH) * (pMax - pMin);
              return (
                <g>
                  <rect
                    x={W - MR + 2} y={crosshair.svgY - 8}
                    width={MR - 4} height={16}
                    fill="#080B11" stroke="rgba(255,255,255,0.15)" strokeWidth={0.5} rx={2}
                  />
                  <text
                    x={W - MR / 2 + 2} y={crosshair.svgY}
                    textAnchor="middle" dominantBaseline="middle"
                    fill="rgba(255,255,255,0.65)" fontSize={8} fontFamily="monospace"
                  >
                    {fmtPrice(price).replace("$", "")}
                  </text>
                </g>
              );
            })()}
          </>
        )}
      </svg>
    </div>
  );
}

// ── MultiCoinChart ────────────────────────────────────────────────────────────

export function MultiCoinChart({
  coins,
  onCoinsChange,
}: {
  coins: string[];
  onCoinsChange: (coins: string[]) => void;
}) {
  const [data,       setData]       = useState<CoinChartData[] | null>(null);
  const [loading,    setLoading]    = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [days,       setDays]       = useState<Days>(30);
  const [visibleCoins, setVisibleCoins] = useState<Set<string>>(new Set(coins));
  const [chartMode,  setChartMode]  = useState<ChartMode>("line");
  const [candleCoin, setCandleCoin] = useState<string | null>(coins[0] ?? null);
  const [addInput,   setAddInput]   = useState("");
  const [dims,       setDims]       = useState({ width: 700, height: 400 });
  const [crosshair,  setCrosshair]  = useState<{
    svgX: number; svgY: number; snapX: number; dataIdx: number;
  } | null>(null);

  const svgRef       = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync visible set when coin list changes externally
  useEffect(() => {
    setVisibleCoins((prev) => {
      const next = new Set(coins);
      // Keep previous visibility choices for coins that remain in the list
      for (const sym of prev) {
        if (!coins.includes(sym)) next.delete(sym);
      }
      return next;
    });
    if (coins.length > 0 && (!candleCoin || !coins.includes(candleCoin))) {
      setCandleCoin(coins[0]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coins]);

  // ResizeObserver
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDims({ width: Math.max(width, 300), height: Math.max(height, 160) });
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Fetch data when coins or days changes
  useEffect(() => {
    if (!coins.length) { setData(null); return; }
    setLoading(true);
    setFetchError(null);
    void fetch(`/api/chart/ohlc?coins=${coins.join(",")}&days=${days}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<ChartApiResponse>;
      })
      .then((r) => {
        setData(r.coins);
        if (candleCoin && !r.coins.find((c) => c.symbol === candleCoin)) {
          setCandleCoin(r.coins.find((c) => c.hasOHLC)?.symbol ?? r.coins[0]?.symbol ?? null);
        }
      })
      .catch((e: Error) => setFetchError(e.message))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coins, days]);

  // ── Chart math ──────────────────────────────────────────────────────────────

  const ML = 52, MR = 16, MT = 28, MB = 28;
  const { width: W, height: H } = dims;
  const chartW = Math.max(W - ML - MR, 10);
  const chartH = Math.max(H - MT - MB, 10);

  const visibleData = useMemo(
    () => (data ?? []).filter((cd) => visibleCoins.has(cd.symbol) && cd.points.length >= 2 && !cd.error),
    [data, visibleCoins],
  );

  const allNorms = useMemo(
    () => visibleData.flatMap((cd) => cd.points.map((p) => pctChange(p.close, cd.points[0].close))),
    [visibleData],
  );

  const rawYMin = allNorms.length ? Math.min(...allNorms) : -5;
  const rawYMax = allNorms.length ? Math.max(...allNorms) : 5;
  const yPad    = Math.max((rawYMax - rawYMin) * 0.12, 1.5);
  const yMin    = rawYMin - yPad;
  const yMax    = rawYMax + yPad;

  const { tMin, tMax } = useMemo(() => {
    const allTs = visibleData.flatMap((cd) => cd.points.map((p) => p.t));
    return {
      tMin: allTs.length ? Math.min(...allTs) : Date.now() - days * 86400000,
      tMax: allTs.length ? Math.max(...allTs) : Date.now(),
    };
  }, [visibleData, days]);

  const toX = useCallback(
    (t: number) => ML + ((t - tMin) / Math.max(tMax - tMin, 1)) * chartW,
    [tMin, tMax, chartW],
  );
  const toY = useCallback(
    (pct: number) => MT + chartH - ((pct - yMin) / Math.max(yMax - yMin, 0.001)) * chartH,
    [yMin, yMax, chartH],
  );
  const fromX = useCallback(
    (px: number) => tMin + ((px - ML) / chartW) * (tMax - tMin),
    [tMin, tMax, chartW],
  );

  // Y-axis nice ticks
  const yTicks = useMemo(() => {
    const ticks: number[] = [];
    const rawStep = (yMax - yMin) / 5;
    const mag = Math.pow(10, Math.floor(Math.log10(Math.max(Math.abs(rawStep), 0.01))));
    const niceStep = Math.ceil(rawStep / mag) * mag;
    for (let t = Math.ceil(yMin / niceStep) * niceStep; t <= yMax && ticks.length < 8; t += niceStep) {
      ticks.push(Math.round(t * 100) / 100);
    }
    return ticks;
  }, [yMin, yMax]);

  // X-axis date labels
  const xLabels = useMemo(() => {
    const pts = visibleData[0]?.points ?? [];
    if (!pts.length) return [];
    const numLabels = Math.max(2, Math.floor(chartW / 80));
    const step = Math.max(1, Math.floor(pts.length / numLabels));
    return pts
      .filter((_, i) => i % step === 0)
      .map((p) => ({
        t: p.t,
        label: new Date(p.t).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      }));
  }, [visibleData, chartW]);

  const primaryPoints = visibleData[0]?.points ?? [];

  function buildPath(cd: CoinChartData): string {
    const first = cd.points[0]?.close;
    if (!first || cd.points.length < 2) return "";
    return cd.points
      .map((p, i) => {
        const x = toX(p.t);
        const y = toY(pctChange(p.close, first));
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  }

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || !primaryPoints.length) return;
    const svgX = e.clientX - rect.left;
    const svgY = e.clientY - rect.top;
    const clampedX = Math.max(ML, Math.min(ML + chartW, svgX));
    const t   = fromX(clampedX);
    const idx = findNearestIdx(primaryPoints, t);
    setCrosshair({ svgX, svgY, snapX: toX(primaryPoints[idx].t), dataIdx: idx });
  }

  const hasAnyOHLC        = (data ?? []).some((cd) => cd.hasOHLC);
  const candleCoinsOHLC   = (data ?? []).filter((cd) => cd.hasOHLC).map((cd) => cd.symbol);
  const candleData        = useMemo(
    () => (data ?? []).find((cd) => cd.symbol === candleCoin) ?? null,
    [data, candleCoin],
  );

  // Coin management
  function toggleCoin(sym: string) {
    setVisibleCoins((prev) => {
      if (prev.has(sym) && prev.size <= 1) return prev;
      const next = new Set(prev);
      if (next.has(sym)) next.delete(sym); else next.add(sym);
      return next;
    });
  }

  function handleAddCoin() {
    const sym = addInput.trim().toUpperCase();
    if (!sym || coins.includes(sym) || !CHART_KNOWN_SYMBOLS.has(sym)) {
      setAddInput(""); return;
    }
    onCoinsChange([...coins, sym]);
    setAddInput("");
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full flex-col">

      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.05] px-3 py-1.5">

        {/* Time range */}
        <div className="flex items-center gap-0.5 rounded-lg border border-white/[0.07] bg-white/[0.03] p-0.5">
          {([7, 30, 90] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              className={`rounded-md px-2.5 py-0.5 font-mono text-[10px] transition-all ${
                days === d ? "bg-solviolet text-white shadow-sm" : "text-white/40 hover:text-white/70"
              }`}
            >
              {d}D
            </button>
          ))}
        </div>

        {/* Chart mode — only shown if OHLC data available */}
        {hasAnyOHLC && (
          <select
            value={chartMode}
            onChange={(e) => setChartMode(e.target.value as ChartMode)}
            className="rounded-md border border-white/[0.07] bg-[#080B11] px-2 py-0.5 font-mono text-[10px] text-white/50 focus:outline-none focus:ring-1 focus:ring-solviolet/50"
          >
            <option value="line">Line</option>
            <option value="candle">Candlestick</option>
          </select>
        )}

        {/* Candlestick coin selector */}
        {chartMode === "candle" && candleCoinsOHLC.length > 0 && (
          <select
            value={candleCoin ?? ""}
            onChange={(e) => setCandleCoin(e.target.value)}
            className="rounded-md border border-white/[0.07] bg-[#080B11] px-2 py-0.5 font-mono text-[10px] text-white/50 focus:outline-none focus:ring-1 focus:ring-solviolet/50"
          >
            {candleCoinsOHLC.map((sym) => (
              <option key={sym} value={sym}>{sym}</option>
            ))}
          </select>
        )}

        {/* Loading indicator */}
        {loading && (
          <div className="flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin text-white/25" />
            <span className="font-mono text-[9px] text-white/25">Loading…</span>
          </div>
        )}

        {/* Data source badges */}
        {data && !loading && (
          <div className="flex items-center gap-1">
            {[...new Set(data.map((d) => d.source))].map((src) => (
              <span key={src} className="rounded-full border border-white/[0.06] bg-white/[0.03] px-1.5 py-0.5 font-mono text-[9px] text-white/22">
                {src === "birdeye" ? "Birdeye" : "CoinGecko"}
              </span>
            ))}
          </div>
        )}

        {/* Manual coin add */}
        <div className="ml-auto flex items-center gap-1">
          <input
            value={addInput}
            onChange={(e) => setAddInput(e.target.value.toUpperCase().slice(0, 6))}
            onKeyDown={(e) => { if (e.key === "Enter") handleAddCoin(); }}
            placeholder="Add coin…"
            className="w-20 rounded-md border border-white/[0.07] bg-white/[0.03] px-2 py-0.5 font-mono text-[10px] text-white/55 placeholder:text-white/15 focus:outline-none focus:ring-1 focus:ring-solviolet/50"
          />
          <button
            type="button"
            onClick={handleAddCoin}
            className="rounded-md border border-white/[0.07] bg-white/[0.03] p-1 text-white/30 transition-colors hover:text-white/60"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* ── Chart area ──────────────────────────────────────────────────────── */}
      <div ref={containerRef} className="relative min-h-0 flex-1 overflow-hidden">

        {/* Empty state */}
        {coins.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <div className="inline-flex rounded-2xl border border-white/[0.07] bg-white/[0.04] p-5">
              <TrendingUp className="h-10 w-10 text-white/15" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-white/30">Live Market Data</p>
              <p className="mt-1 text-xs text-white/20">Submit a trading intent to load price charts</p>
            </div>
            <p className="font-mono text-[9px] text-white/12">Powered by CoinGecko &amp; Birdeye</p>
          </div>
        )}

        {/* Fetch error */}
        {fetchError && !loading && (
          <div className="absolute left-4 right-4 top-3 z-20 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 font-mono text-xs text-red-400">
            {fetchError}
          </div>
        )}

        {/* Line chart tooltip — fixed top-left */}
        {chartMode === "line" && crosshair !== null && primaryPoints[crosshair.dataIdx] && (
          <div className="pointer-events-none absolute left-14 top-2 z-10 max-w-[280px] rounded-lg border border-white/[0.12] bg-[#080B11]/95 p-2 backdrop-blur-sm">
            <p className="mb-1.5 font-mono text-[9px] text-white/38">
              {fmtDate(primaryPoints[crosshair.dataIdx].t)}
            </p>
            {visibleData.map((cd, idx) => {
              const pt = cd.points[crosshair.dataIdx];
              if (!pt) return null;
              const pct   = pctChange(pt.close, cd.points[0].close);
              const color = getCoinColor(cd.symbol, idx);
              return (
                <div key={cd.symbol} className="mb-1 font-mono text-[9px]">
                  <div className="flex items-center gap-1.5">
                    <span style={{ color }}>●</span>
                    <span className="font-medium text-white/60">{cd.symbol}</span>
                    <span className="text-white/85">{fmtPrice(pt.close)}</span>
                    <span className={pct >= 0 ? "text-emerald-400" : "text-red-400"}>
                      {pct >= 0 ? "+" : ""}{pct.toFixed(2)}%
                    </span>
                  </div>
                  {(pt.open !== undefined || pt.volume !== undefined) && (
                    <div className="ml-4 mt-0.5 flex flex-wrap gap-x-2 text-white/25">
                      {pt.open !== undefined && (
                        <span>O:{fmtPrice(pt.open)} H:{fmtPrice(pt.high!)} L:{fmtPrice(pt.low!)}</span>
                      )}
                      {pt.volume !== undefined && <span>Vol:{fmtVol(pt.volume)}</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── SVG line chart ── */}
        {chartMode === "line" && coins.length > 0 && !loading && (
          <svg
            ref={svgRef}
            width={W}
            height={H}
            className="absolute inset-0 cursor-crosshair"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setCrosshair(null)}
          >
            {/* Y-axis ticks + gridlines */}
            {yTicks.map((tick) => {
              const y = toY(tick);
              if (y < MT || y > MT + chartH) return null;
              const isZero = Math.abs(tick) < 0.001;
              return (
                <g key={tick}>
                  <line
                    x1={ML} y1={y} x2={ML + chartW} y2={y}
                    stroke={isZero ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.04)"}
                    strokeWidth={1}
                    strokeDasharray={isZero ? undefined : "4 4"}
                  />
                  <text
                    x={ML - 4} y={y}
                    textAnchor="end" dominantBaseline="middle"
                    fill="rgba(255,255,255,0.26)" fontSize={9} fontFamily="monospace"
                  >
                    {tick >= 0 ? "+" : ""}{tick.toFixed(tick % 1 === 0 ? 0 : 1)}%
                  </text>
                </g>
              );
            })}

            {/* X-axis date labels */}
            {xLabels.map(({ t, label }) => (
              <text
                key={t}
                x={toX(t)} y={MT + chartH + 16}
                textAnchor="middle"
                fill="rgba(255,255,255,0.18)" fontSize={8} fontFamily="monospace"
              >
                {label}
              </text>
            ))}

            {/* Chart border */}
            <line x1={ML} y1={MT} x2={ML} y2={MT + chartH} stroke="rgba(255,255,255,0.07)" strokeWidth={1} />
            <line x1={ML} y1={MT + chartH} x2={ML + chartW} y2={MT + chartH} stroke="rgba(255,255,255,0.07)" strokeWidth={1} />

            {/* Coin lines */}
            {visibleData.map((cd, idx) => {
              const color = getCoinColor(cd.symbol, idx);
              const d     = buildPath(cd);
              if (!d) return null;
              return (
                <path
                  key={cd.symbol}
                  d={d}
                  fill="none"
                  stroke={color}
                  strokeWidth={1.5}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  opacity={0.9}
                />
              );
            })}

            {/* ── Crosshair ── */}
            {crosshair && (
              <>
                {/* Vertical — snapped to nearest data point */}
                <line
                  x1={crosshair.snapX} y1={MT}
                  x2={crosshair.snapX} y2={MT + chartH}
                  stroke="rgba(255,255,255,0.28)" strokeWidth={1} strokeDasharray="3 3" pointerEvents="none"
                />
                {/* Horizontal — follows actual mouse Y */}
                <line
                  x1={ML} y1={crosshair.svgY}
                  x2={ML + chartW} y2={crosshair.svgY}
                  stroke="rgba(255,255,255,0.14)" strokeWidth={1} strokeDasharray="3 3" pointerEvents="none"
                />

                {/* % label on left Y-axis at mouse Y position */}
                {crosshair.svgY >= MT && crosshair.svgY <= MT + chartH && (() => {
                  const pct = yMin + ((MT + chartH - crosshair.svgY) / chartH) * (yMax - yMin);
                  return (
                    <g>
                      <rect
                        x={1} y={crosshair.svgY - 8}
                        width={ML - 4} height={16}
                        fill="#080B11" stroke="rgba(255,255,255,0.1)" strokeWidth={0.5} rx={2}
                      />
                      <text
                        x={ML - 6} y={crosshair.svgY}
                        textAnchor="end" dominantBaseline="middle"
                        fill="rgba(255,255,255,0.6)" fontSize={8} fontFamily="monospace"
                      >
                        {pct >= 0 ? "+" : ""}{pct.toFixed(1)}%
                      </text>
                    </g>
                  );
                })()}

                {/* Dots at each visible coin's Y value at the snap index */}
                {visibleData.map((cd, idx) => {
                  const pt = cd.points[crosshair.dataIdx];
                  if (!pt) return null;
                  const cy = toY(pctChange(pt.close, cd.points[0].close));
                  if (cy < MT || cy > MT + chartH) return null;
                  return (
                    <circle
                      key={cd.symbol}
                      cx={crosshair.snapX} cy={cy}
                      r={3.5}
                      fill={getCoinColor(cd.symbol, idx)}
                      stroke="#080B11"
                      strokeWidth={1.5}
                      pointerEvents="none"
                    />
                  );
                })}
              </>
            )}
          </svg>
        )}

        {/* ── Candlestick view ── */}
        {chartMode === "candle" && (
          <CandleView coinData={candleData} dims={dims} />
        )}
      </div>

      {/* ── Coin toggle pills ────────────────────────────────────────────────── */}
      {coins.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 border-t border-white/[0.05] px-3 py-1.5">
          {(data ?? coins.map((sym) => ({
            symbol: sym, source: "coingecko" as const,
            hasOHLC: false, hasVolume: false, points: [],
          }))).map((cd, idx) => {
            const color     = getCoinColor(cd.symbol, idx);
            const isVisible = visibleCoins.has(cd.symbol);
            const hasErr    = !!(cd as CoinChartData).error;
            return (
              <div key={cd.symbol} className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => toggleCoin(cd.symbol)}
                  title={hasErr ? (cd as CoinChartData).error : undefined}
                  className={`flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[10px] transition-all ${
                    hasErr
                      ? "border-red-500/25 bg-red-500/10 text-red-400/60"
                      : isVisible
                        ? "border-white/[0.1] text-white/65"
                        : "border-white/[0.04] text-white/22 hover:text-white/50"
                  }`}
                  style={isVisible && !hasErr ? { borderColor: color + "44" } : undefined}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{
                      backgroundColor: hasErr ? "#ef4444" : color,
                      opacity: isVisible ? 1 : 0.3,
                      boxShadow: isVisible && !hasErr ? `0 0 4px ${color}` : undefined,
                    }}
                  />
                  {cd.symbol}
                  {hasErr && <span className="text-red-400/70">!</span>}
                </button>
                <button
                  type="button"
                  onClick={() => onCoinsChange(coins.filter((c) => c !== cd.symbol))}
                  className="rounded-full p-0.5 text-white/12 transition-colors hover:text-white/45"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

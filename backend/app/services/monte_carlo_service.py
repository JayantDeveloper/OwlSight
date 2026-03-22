from __future__ import annotations

import math
import random
from dataclasses import dataclass
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.schemas import Opportunity


@dataclass
class MonteCarloResult:
    num_simulations: int
    expected_profit_usd: float
    probability_of_profit: float
    p10_usd: float
    p50_usd: float
    p90_usd: float
    best_case_usd: float
    worst_case_usd: float
    std_dev_usd: float
    sharpe_approx: float
    recommendation: str
    risk_label: str


def _sample_normal(mean: float, std: float) -> float:
    """Box-Muller transform for a normal sample without numpy."""
    u1 = random.random() or 1e-10
    u2 = random.random()
    z = math.sqrt(-2 * math.log(u1)) * math.cos(2 * math.pi * u2)
    return mean + std * z


def _sample_lognormal(mean_log: float, std_log: float) -> float:
    return math.exp(_sample_normal(mean_log, std_log))


def _percentile(sorted_data: list[float], p: float) -> float:
    if not sorted_data:
        return 0.0
    idx = (len(sorted_data) - 1) * p / 100.0
    lower = int(idx)
    upper = min(lower + 1, len(sorted_data) - 1)
    frac = idx - lower
    return sorted_data[lower] + frac * (sorted_data[upper] - sorted_data[lower])


class MonteCarloService:
    """
    Probabilistic execution simulation via Monte Carlo sampling.

    For each simulated path we independently vary:
    - slippage (normal ±35% of base estimate)
    - fees   (normal ±8% of base estimate)
    - bridge latency (log-normal, σ=0.25)
    - price drift during latency (normal, 4 bps/min annualised)

    Returns a MonteCarloResult with distribution statistics.
    """

    DEFAULT_N = 500

    def simulate(self, opportunity: "Opportunity", n: int = DEFAULT_N) -> MonteCarloResult:
        results: list[float] = []

        gross = opportunity.gross_profit_usd
        base_fees = opportunity.estimated_fees_usd
        base_slippage_bps = opportunity.estimated_slippage_bps
        notional = opportunity.notional_usd
        base_latency = float(opportunity.estimated_bridge_latency_sec)

        for _ in range(n):
            # --- slippage draw ---
            slippage_mult = max(0.0, _sample_normal(1.0, 0.35))
            actual_slippage_cost = notional * (base_slippage_bps * slippage_mult) / 10_000

            # --- fee draw ---
            fee_mult = max(0.8, _sample_normal(1.0, 0.08))
            actual_fees = base_fees * fee_mult

            # --- latency draw (log-normal so always positive) ---
            latency = base_latency * _sample_lognormal(0.0, 0.25)

            # --- price drift during bridge transit ---
            # Assume ≈4 bps/min volatility for the cross-chain leg
            drift_bps = _sample_normal(0.0, 4.0 * (latency / 60.0) ** 0.5)
            price_impact = notional * abs(drift_bps) / 10_000

            net = gross - actual_fees - actual_slippage_cost - price_impact
            results.append(round(net, 4))

        results.sort()

        expected = sum(results) / len(results)
        prob_profit = sum(1 for r in results if r > 0) / len(results)
        p10 = _percentile(results, 10)
        p50 = _percentile(results, 50)
        p90 = _percentile(results, 90)
        best = _percentile(results, 95)
        worst = _percentile(results, 5)

        variance = sum((r - expected) ** 2 for r in results) / len(results)
        std_dev = math.sqrt(variance)
        sharpe = expected / (std_dev + 1e-6)

        recommendation = self._recommendation(prob_profit, sharpe, expected)
        risk_label = self._risk_label(std_dev, notional)

        return MonteCarloResult(
            num_simulations=n,
            expected_profit_usd=round(expected, 2),
            probability_of_profit=round(prob_profit, 3),
            p10_usd=round(p10, 2),
            p50_usd=round(p50, 2),
            p90_usd=round(p90, 2),
            best_case_usd=round(best, 2),
            worst_case_usd=round(worst, 2),
            std_dev_usd=round(std_dev, 2),
            sharpe_approx=round(sharpe, 3),
            recommendation=recommendation,
            risk_label=risk_label,
        )

    @staticmethod
    def _recommendation(prob_profit: float, sharpe: float, expected: float) -> str:
        if prob_profit >= 0.80 and sharpe >= 2.0 and expected > 0:
            return "Strong execute — high probability of profit with favourable risk-adjusted return."
        if prob_profit >= 0.65 and expected > 0:
            return "Conditionally execute — edge is present but moderate execution variance remains."
        if prob_profit >= 0.50 and expected > 0:
            return "Marginal — the trade is borderline. Tighten slippage guardrails before committing."
        if expected <= 0:
            return "Do not execute — simulation expects a net loss after friction costs."
        return "High variance — edge is uncertain. Reduce notional or wait for a cleaner entry."

    @staticmethod
    def _risk_label(std_dev: float, notional: float) -> str:
        pct = std_dev / (notional + 1e-6)
        if pct < 0.005:
            return "Low"
        if pct < 0.015:
            return "Moderate"
        if pct < 0.030:
            return "Elevated"
        return "High"

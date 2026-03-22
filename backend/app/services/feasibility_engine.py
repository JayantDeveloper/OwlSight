from __future__ import annotations

from typing import Dict, List, Tuple

from app.core.config import Settings
from app.schemas import CostBreakdown, MonteCarloResult, Opportunity, RouteLeg
from app.services.monte_carlo_service import MonteCarloService
from app.services.opportunity_engine import OpportunityCandidate


BRIDGE_PROFILES: Dict[Tuple[str, str], Dict[str, float | str]] = {
    ("Solana", "Base"): {
        "bridge_name": "Wormhole",
        "latency_sec": 95,
        "bridge_fee_bps": 10,
        "reliability": 0.93,
    },
    ("Base", "Solana"): {
        "bridge_name": "Wormhole",
        "latency_sec": 95,
        "bridge_fee_bps": 10,
        "reliability": 0.93,
    },
    ("Solana", "Ethereum"): {
        "bridge_name": "Wormhole",
        "latency_sec": 240,
        "bridge_fee_bps": 13,
        "reliability": 0.84,
    },
    ("Ethereum", "Solana"): {
        "bridge_name": "Wormhole",
        "latency_sec": 240,
        "bridge_fee_bps": 13,
        "reliability": 0.84,
    },
    ("Solana", "Arbitrum"): {
        "bridge_name": "Wormhole",
        "latency_sec": 135,
        "bridge_fee_bps": 11,
        "reliability": 0.9,
    },
    ("Arbitrum", "Solana"): {
        "bridge_name": "Wormhole",
        "latency_sec": 135,
        "bridge_fee_bps": 11,
        "reliability": 0.9,
    },
    ("Base", "Ethereum"): {
        "bridge_name": "Across",
        "latency_sec": 75,
        "bridge_fee_bps": 8,
        "reliability": 0.95,
    },
    ("Ethereum", "Base"): {
        "bridge_name": "Across",
        "latency_sec": 75,
        "bridge_fee_bps": 8,
        "reliability": 0.95,
    },
    ("Arbitrum", "Ethereum"): {
        "bridge_name": "Across",
        "latency_sec": 90,
        "bridge_fee_bps": 8,
        "reliability": 0.94,
    },
    ("Ethereum", "Arbitrum"): {
        "bridge_name": "Across",
        "latency_sec": 90,
        "bridge_fee_bps": 8,
        "reliability": 0.94,
    },
    ("Base", "Arbitrum"): {
        "bridge_name": "Across",
        "latency_sec": 80,
        "bridge_fee_bps": 9,
        "reliability": 0.94,
    },
    ("Arbitrum", "Base"): {
        "bridge_name": "Across",
        "latency_sec": 80,
        "bridge_fee_bps": 9,
        "reliability": 0.94,
    },
}

DEFAULT_BRIDGE_PROFILE: Dict[str, float | str] = {
    "bridge_name": "Generic Bridge",
    "latency_sec": 180,
    "bridge_fee_bps": 12,
    "reliability": 0.82,
}


class FeasibilityEngine:
    def __init__(
        self, asset_profiles: Dict[str, Dict[str, float]], settings: Settings
    ) -> None:
        self._asset_profiles = asset_profiles
        self._settings = settings
        self._monte_carlo = MonteCarloService()

    def evaluate(self, candidates: List[OpportunityCandidate]) -> List[Opportunity]:
        return [self._evaluate_candidate(candidate) for candidate in candidates]

    def _evaluate_candidate(self, candidate: OpportunityCandidate) -> Opportunity:
        bridge_profile = BRIDGE_PROFILES.get(
            (candidate.buy_quote.chain, candidate.sell_quote.chain),
            DEFAULT_BRIDGE_PROFILE,
        )
        asset_profile = self._asset_profiles[candidate.asset_symbol]

        trading_fees_usd = round(
            candidate.notional_usd
            * (candidate.buy_quote.fee_bps + candidate.sell_quote.fee_bps)
            / 10_000,
            2,
        )
        bridge_fee_usd = round(
            candidate.notional_usd * float(bridge_profile["bridge_fee_bps"]) / 10_000, 2
        )
        slippage_bps = self._estimate_slippage_bps(candidate)
        slippage_cost_usd = round(candidate.notional_usd * slippage_bps / 10_000, 2)
        latency_sec = int(bridge_profile["latency_sec"])
        latency_penalty_usd = round(
            candidate.notional_usd * latency_sec / 250_000,
            2,
        )
        estimated_fees_usd = round(trading_fees_usd + bridge_fee_usd, 2)
        expected_net_profit_usd = round(
            candidate.gross_profit_usd
            - estimated_fees_usd
            - slippage_cost_usd
            - latency_penalty_usd,
            2,
        )
        confidence_score = self._confidence_score(
            candidate,
            bridge_profile,
            estimated_fees_usd,
            slippage_bps,
            expected_net_profit_usd,
        )

        execute = (
            expected_net_profit_usd >= self._settings.opportunity_min_net_profit_usd
            and confidence_score >= self._settings.confidence_threshold
            and slippage_bps <= float(asset_profile["max_slippage_bps"])
            and latency_sec <= 220
        )
        approval_reason = self._approval_reason(
            execute=execute,
            expected_net_profit_usd=expected_net_profit_usd,
            confidence_score=confidence_score,
            latency_sec=latency_sec,
            slippage_bps=slippage_bps,
            max_slippage_bps=float(asset_profile["max_slippage_bps"]),
        )

        route_legs = [
            RouteLeg(
                kind="buy",
                label=f"Acquire {candidate.asset_symbol} on {candidate.buy_quote.venue}",
                chain=candidate.buy_quote.chain,
                venue=candidate.buy_quote.venue,
                expected_duration_sec=15,
                detail=(
                    f"Buy {candidate.asset_amount:.4f} {candidate.asset_symbol} at "
                    f"${candidate.buy_quote.price_usd:,.2f}"
                ),
            ),
            RouteLeg(
                kind="bridge",
                label=f"Bridge inventory via {bridge_profile['bridge_name']}",
                chain=candidate.sell_quote.chain,
                expected_duration_sec=latency_sec,
                detail=(
                    f"Move exposure from {candidate.buy_quote.chain} to "
                    f"{candidate.sell_quote.chain}"
                ),
            ),
            RouteLeg(
                kind="sell",
                label=f"Exit on {candidate.sell_quote.venue}",
                chain=candidate.sell_quote.chain,
                venue=candidate.sell_quote.venue,
                expected_duration_sec=20,
                detail=(
                    f"Sell into {candidate.sell_quote.venue} at "
                    f"${candidate.sell_quote.price_usd:,.2f}"
                ),
            ),
        ]

        opp = Opportunity(
            id=candidate.id,
            source="mock",
            asset_symbol=candidate.asset_symbol,
            buy_chain=candidate.buy_quote.chain,
            buy_venue=candidate.buy_quote.venue,
            sell_chain=candidate.sell_quote.chain,
            sell_venue=candidate.sell_quote.venue,
            bridge_name=str(bridge_profile["bridge_name"]),
            bridge_pair=candidate.bridge_pair,
            notional_usd=candidate.notional_usd,
            asset_amount=candidate.asset_amount,
            gross_spread_bps=candidate.gross_spread_bps,
            gross_profit_usd=candidate.gross_profit_usd,
            estimated_fees_usd=estimated_fees_usd,
            estimated_bridge_latency_sec=latency_sec,
            estimated_slippage_bps=slippage_bps,
            estimated_latency_penalty_usd=latency_penalty_usd,
            expected_net_profit_usd=expected_net_profit_usd,
            confidence_score=confidence_score,
            execute=execute,
            approval_stage="approved" if execute else "rejected",
            approval_reason=approval_reason,
            route_legs=route_legs,
            cost_breakdown=CostBreakdown(
                trading_fees_usd=trading_fees_usd,
                bridge_fee_usd=bridge_fee_usd,
                slippage_cost_usd=slippage_cost_usd,
                latency_penalty_usd=latency_penalty_usd,
            ),
            buy_quote=candidate.buy_quote,
            sell_quote=candidate.sell_quote,
        )

        # Attach Monte Carlo simulation
        try:
            mc_raw = self._monte_carlo.simulate(opp)
            opp = opp.model_copy(
                update={
                    "monte_carlo": MonteCarloResult(
                        num_simulations=mc_raw.num_simulations,
                        expected_profit_usd=mc_raw.expected_profit_usd,
                        probability_of_profit=mc_raw.probability_of_profit,
                        p10_usd=mc_raw.p10_usd,
                        p50_usd=mc_raw.p50_usd,
                        p90_usd=mc_raw.p90_usd,
                        best_case_usd=mc_raw.best_case_usd,
                        worst_case_usd=mc_raw.worst_case_usd,
                        std_dev_usd=mc_raw.std_dev_usd,
                        sharpe_approx=mc_raw.sharpe_approx,
                        recommendation=mc_raw.recommendation,
                        risk_label=mc_raw.risk_label,
                    )
                }
            )
        except Exception:
            pass

        return opp

    @staticmethod
    def _estimate_slippage_bps(candidate: OpportunityCandidate) -> float:
        liquidity_ceiling = min(
            candidate.buy_quote.available_liquidity_usd,
            candidate.sell_quote.available_liquidity_usd,
        )
        depth_ratio = candidate.notional_usd / liquidity_ceiling
        depth_penalty = 1 - ((candidate.buy_quote.depth_score + candidate.sell_quote.depth_score) / 2)
        slippage_bps = 4.5 + (depth_ratio * 135) + (depth_penalty * 22)
        return round(slippage_bps, 2)

    def _confidence_score(
        self,
        candidate: OpportunityCandidate,
        bridge_profile: Dict[str, float | str],
        estimated_fees_usd: float,
        slippage_bps: float,
        expected_net_profit_usd: float,
    ) -> float:
        cost_bps = ((estimated_fees_usd / candidate.notional_usd) * 10_000) + slippage_bps
        edge_buffer_bps = max(candidate.gross_spread_bps - cost_bps, 0)
        depth_bonus = ((candidate.buy_quote.depth_score + candidate.sell_quote.depth_score) / 2) - 0.8
        freshness_penalty = max(
            candidate.buy_quote.freshness_seconds, candidate.sell_quote.freshness_seconds
        ) / 120
        latency_penalty = float(bridge_profile["latency_sec"]) / 1200
        profitability_bonus = max(expected_net_profit_usd, 0) / max(candidate.notional_usd, 1)

        score = 0.46
        score += min(0.22, edge_buffer_bps / 220)
        score += max(0.0, min(0.12, depth_bonus))
        score += min(0.1, float(bridge_profile["reliability"]) - 0.82)
        score += min(0.08, profitability_bonus * 10)
        score -= min(0.14, freshness_penalty)
        score -= min(0.16, latency_penalty)

        return round(max(0.05, min(0.98, score)), 2)

    def _approval_reason(
        self,
        execute: bool,
        expected_net_profit_usd: float,
        confidence_score: float,
        latency_sec: int,
        slippage_bps: float,
        max_slippage_bps: float,
    ) -> str:
        if execute:
            return (
                "Approved: net edge survives fees and slippage, with bridge timing inside "
                "execution guardrails."
            )
        if expected_net_profit_usd < self._settings.opportunity_min_net_profit_usd:
            return "Rejected: execution costs erase too much of the spread."
        if latency_sec > 220:
            return "Rejected: bridge latency is too high to rely on the spread staying open."
        if slippage_bps > max_slippage_bps:
            return "Rejected: the route is too thin for this notional size."
        if confidence_score < self._settings.confidence_threshold:
            return "Rejected: confidence score is below the execution threshold."
        return "Rejected: route failed execution guardrails."

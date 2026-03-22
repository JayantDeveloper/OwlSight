from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List

from app.schemas import MarketQuote


@dataclass(frozen=True)
class OpportunityCandidate:
    id: str
    asset_symbol: str
    buy_quote: MarketQuote
    sell_quote: MarketQuote
    notional_usd: float
    asset_amount: float
    gross_spread_bps: float
    gross_profit_usd: float
    bridge_pair: str
    max_slippage_bps: float


class OpportunityEngine:
    def __init__(self, asset_profiles: Dict[str, Dict[str, float]]) -> None:
        self._asset_profiles = asset_profiles

    def build_candidates(self, quotes: List[MarketQuote]) -> List[OpportunityCandidate]:
        grouped: Dict[str, List[MarketQuote]] = {}
        for quote in quotes:
            grouped.setdefault(quote.asset_symbol, []).append(quote)

        candidates: List[OpportunityCandidate] = []
        for asset_symbol, asset_quotes in grouped.items():
            asset_profile = self._asset_profiles[asset_symbol]
            notional_usd = float(asset_profile["default_notional_usd"])
            max_slippage_bps = float(asset_profile["max_slippage_bps"])

            for buy_quote in asset_quotes:
                for sell_quote in asset_quotes:
                    if buy_quote.quote_id == sell_quote.quote_id:
                        continue
                    if buy_quote.chain == sell_quote.chain:
                        continue
                    if sell_quote.price_usd <= buy_quote.price_usd:
                        continue

                    asset_amount = round(notional_usd / buy_quote.price_usd, 6)
                    gross_spread_bps = round(
                        ((sell_quote.price_usd - buy_quote.price_usd) / buy_quote.price_usd)
                        * 10_000,
                        2,
                    )
                    gross_profit_usd = round(
                        (sell_quote.price_usd - buy_quote.price_usd) * asset_amount,
                        2,
                    )

                    candidates.append(
                        OpportunityCandidate(
                            id=self._candidate_id(asset_symbol, buy_quote, sell_quote),
                            asset_symbol=asset_symbol,
                            buy_quote=buy_quote,
                            sell_quote=sell_quote,
                            notional_usd=notional_usd,
                            asset_amount=asset_amount,
                            gross_spread_bps=gross_spread_bps,
                            gross_profit_usd=gross_profit_usd,
                            bridge_pair=f"{buy_quote.chain}->{sell_quote.chain}",
                            max_slippage_bps=max_slippage_bps,
                        )
                    )

        return sorted(candidates, key=lambda item: item.gross_profit_usd, reverse=True)

    @staticmethod
    def _candidate_id(
        asset_symbol: str, buy_quote: MarketQuote, sell_quote: MarketQuote
    ) -> str:
        raw_id = (
            f"{asset_symbol}-{buy_quote.chain}-{buy_quote.venue}-"
            f"{sell_quote.chain}-{sell_quote.venue}"
        )
        return (
            raw_id.lower()
            .replace(" ", "-")
            .replace("/", "-")
            .replace(">", "-")
            .replace(".", "-")
        )


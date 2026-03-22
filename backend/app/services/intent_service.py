from __future__ import annotations

import re
from dataclasses import dataclass
from typing import List, Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from app.schemas import Opportunity


KNOWN_ASSETS = ["SOL", "ETH", "WBTC", "BTC", "USDC", "USDT", "BNB", "MATIC", "ARB"]
KNOWN_CHAINS = {
    "solana": "Solana",
    "ethereum": "Ethereum",
    "eth": "Ethereum",
    "base": "Base",
    "arbitrum": "Arbitrum",
    "arb": "Arbitrum",
}
CHAIN_ALIASES = {
    "solana": "Solana",
    "sol": "Solana",
    "ethereum": "Ethereum",
    "eth chain": "Ethereum",
    "base": "Base",
    "arbitrum": "Arbitrum",
    "arb": "Arbitrum",
}

# Synonyms for intent verbs
_SWAP_VERBS = r"(?:swap|convert|exchange|trade|turn)"
_BRIDGE_VERBS = r"(?:bridge|move|transfer|send)"
_FIND_VERBS = r"(?:find|get|show|discover|what(?:'s| is) the best)"

# Amount patterns: "$1000", "1000 USDC", "2 ETH", "2.5 SOL", "$1k", "1k"
_AMT_PAT = r"(?:\$\s*)?(\d+(?:[.,]\d+)?(?:k|K)?)\s*(?:usdc|usd|dollars?|\$)?"
_ASSET_PAT = r"(?:(" + "|".join(KNOWN_ASSETS) + r"))"

_RE_FLAGS = re.IGNORECASE | re.UNICODE


@dataclass
class ParsedIntent:
    raw: str
    intent_type: str            # "swap" | "bridge" | "find_route" | "unknown"
    asset_from: Optional[str]
    asset_to: Optional[str]
    amount_usd: Optional[float]
    chain_from: Optional[str]
    chain_to: Optional[str]
    summary: str                # Human-readable restatement of what we understood


def _parse_amount(text: str) -> Optional[float]:
    m = re.search(r"\$?\s*(\d+(?:[.,]\d+)?)([kK]?)", text)
    if not m:
        return None
    val = float(m.group(1).replace(",", ""))
    if m.group(2).lower() == "k":
        val *= 1000
    return val


def _parse_assets(text: str) -> tuple[Optional[str], Optional[str]]:
    """Return (from_asset, to_asset) by scanning left-to-right."""
    hits = re.findall(r"\b(" + "|".join(KNOWN_ASSETS) + r")\b", text, _RE_FLAGS)
    hits = [h.upper() for h in hits]
    if len(hits) >= 2:
        return hits[0], hits[1]
    if len(hits) == 1:
        return hits[0], None
    return None, None


def _parse_chain(text: str) -> Optional[str]:
    for alias, canonical in CHAIN_ALIASES.items():
        if re.search(r"\b" + re.escape(alias) + r"\b", text, _RE_FLAGS):
            return canonical
    return None


def _parse_chain_to(text: str) -> Optional[str]:
    """Look for 'to <chain>' or 'on <chain>' after a bridge verb."""
    m = re.search(r"(?:to|on|onto)\s+(" + "|".join(CHAIN_ALIASES.keys()) + r")\b", text, _RE_FLAGS)
    if m:
        return CHAIN_ALIASES[m.group(1).lower()]
    return None


class IntentService:
    """Parse natural-language trading intents and match against live opportunities."""

    def parse(self, raw: str) -> ParsedIntent:
        text = raw.strip()

        # Determine intent type
        if re.search(_SWAP_VERBS, text, _RE_FLAGS):
            intent_type = "swap"
        elif re.search(_BRIDGE_VERBS, text, _RE_FLAGS):
            intent_type = "bridge"
        elif re.search(_FIND_VERBS, text, _RE_FLAGS):
            intent_type = "find_route"
        else:
            intent_type = "unknown"

        amount_usd = _parse_amount(text)
        asset_from, asset_to = _parse_assets(text)
        chain_from = _parse_chain(text)
        chain_to = _parse_chain_to(text)

        summary = self._build_summary(intent_type, asset_from, asset_to, amount_usd, chain_from, chain_to)
        return ParsedIntent(
            raw=text,
            intent_type=intent_type,
            asset_from=asset_from,
            asset_to=asset_to,
            amount_usd=amount_usd,
            chain_from=chain_from,
            chain_to=chain_to,
            summary=summary,
        )

    def match_opportunities(
        self, parsed: ParsedIntent, opportunities: List["Opportunity"]
    ) -> List["Opportunity"]:
        """
        Score and rank opportunities against a parsed intent.
        Higher score = better match.
        """
        scored: list[tuple[float, "Opportunity"]] = []

        for opp in opportunities:
            score = 0.0

            if parsed.asset_from and opp.asset_symbol.upper() == parsed.asset_from.upper():
                score += 3.0

            if parsed.asset_from and (
                opp.asset_symbol.upper() == parsed.asset_from.upper()
                or opp.buy_quote.asset_symbol.upper() == parsed.asset_from.upper()
            ):
                score += 2.0

            if parsed.chain_from and opp.buy_chain.lower() == parsed.chain_from.lower():
                score += 1.5

            if parsed.chain_to and opp.sell_chain.lower() == parsed.chain_to.lower():
                score += 1.5

            # Prefer approved opportunities
            if opp.execute:
                score += 2.0

            # Prefer higher confidence
            score += opp.confidence_score * 1.5

            # Prefer better net profit
            if opp.expected_net_profit_usd > 0:
                score += min(1.0, opp.expected_net_profit_usd / 500)

            if score > 0:
                scored.append((score, opp))

        if not scored:
            # No filter match — return all, ranked by approval + confidence
            return sorted(
                opportunities,
                key=lambda o: (o.execute, o.confidence_score),
                reverse=True,
            )

        scored.sort(key=lambda x: x[0], reverse=True)
        return [opp for _, opp in scored]

    @staticmethod
    def _build_summary(
        intent_type: str,
        asset_from: Optional[str],
        asset_to: Optional[str],
        amount_usd: Optional[float],
        chain_from: Optional[str],
        chain_to: Optional[str],
    ) -> str:
        parts: List[str] = []

        if intent_type == "swap":
            action = "Swap"
        elif intent_type == "bridge":
            action = "Bridge"
        elif intent_type == "find_route":
            action = "Find best route for"
        else:
            action = "Analyse"

        asset_part = asset_from or "asset"
        if amount_usd:
            asset_part = f"${amount_usd:,.0f} of {asset_part}"

        dest = asset_to or chain_to
        if dest:
            parts.append(f"{action} {asset_part} → {dest}")
        else:
            parts.append(f"{action} {asset_part}")

        if chain_from and not chain_to:
            parts.append(f"from {chain_from}")
        elif chain_from and chain_to:
            parts.append(f"({chain_from} → {chain_to})")

        return " ".join(parts) if parts else "Analyse trading intent"

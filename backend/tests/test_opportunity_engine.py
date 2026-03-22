from datetime import datetime, timezone

from app.core.config import get_settings
from app.services.feasibility_engine import FeasibilityEngine
from app.services.market_data_service import MarketDataService
from app.services.opportunity_engine import OpportunityEngine


def test_build_candidates_and_evaluate_mix():
    settings = get_settings()
    market_data_service = MarketDataService(
        settings.mock_market_data_path,
        settings=settings,
    )
    opportunity_engine = OpportunityEngine(market_data_service.get_asset_profiles())
    feasibility_engine = FeasibilityEngine(
        market_data_service.get_asset_profiles(), settings=settings
    )

    quotes = market_data_service.get_market_quotes(
        now=datetime(2026, 3, 21, 16, 0, tzinfo=timezone.utc)
    )
    candidates = opportunity_engine.build_candidates(quotes)
    opportunities = feasibility_engine.evaluate(candidates)

    assert candidates
    assert any(candidate.asset_symbol == "SOL" for candidate in candidates)
    assert any(opportunity.execute for opportunity in opportunities)
    assert any(not opportunity.execute for opportunity in opportunities)


def test_evaluated_opportunity_contains_required_metrics():
    settings = get_settings()
    market_data_service = MarketDataService(
        settings.mock_market_data_path,
        settings=settings,
    )
    opportunity_engine = OpportunityEngine(market_data_service.get_asset_profiles())
    feasibility_engine = FeasibilityEngine(
        market_data_service.get_asset_profiles(), settings=settings
    )

    quotes = market_data_service.get_market_quotes(
        now=datetime(2026, 3, 21, 16, 0, tzinfo=timezone.utc)
    )
    opportunity = feasibility_engine.evaluate(opportunity_engine.build_candidates(quotes))[0]

    assert opportunity.gross_spread_bps > 0
    assert opportunity.estimated_fees_usd > 0
    assert opportunity.estimated_bridge_latency_sec > 0
    assert opportunity.estimated_slippage_bps > 0
    assert 0.0 <= opportunity.confidence_score <= 1.0

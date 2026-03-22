from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Tuple

from fastapi import APIRouter, HTTPException

from app.core.config import get_settings
from app.schemas import (
    DemoScenario,
    ExecutionRun,
    HealthResponse,
    IntentRequest,
    IntentResponse,
    Opportunity,
    OpportunityListResponse,
)
from app.services.demo_state_service import DemoStateService
from app.services.intent_service import IntentService
from app.services.feasibility_engine import FeasibilityEngine
from app.services.hummingbot_adapter import HummingbotAdapter
from app.services.hummingbot_client import HummingbotClient
from app.services.market_data_service import MarketDataService, MarketSnapshot
from app.services.opportunity_engine import OpportunityEngine
from app.stores.execution_store import ExecutionStore


settings = get_settings()
market_data_service = MarketDataService(
    settings.mock_market_data_path,
    settings=settings,
)
opportunity_engine = OpportunityEngine(market_data_service.get_asset_profiles())
feasibility_engine = FeasibilityEngine(
    market_data_service.get_asset_profiles(), settings=settings
)
execution_store = ExecutionStore()
demo_state_service = DemoStateService()
hummingbot_client = HummingbotClient(settings)
hummingbot_adapter = HummingbotAdapter(
    settings,
    execution_store,
    hummingbot_client,
    demo_state_service,
)

intent_service = IntentService()

router = APIRouter(prefix=settings.api_prefix)


def _analyze_opportunities() -> Tuple[MarketSnapshot, List[Opportunity]]:
    snapshot = market_data_service.get_market_snapshot()
    demo_state_service.record_market_data_status(snapshot.market_data_status)

    candidates = opportunity_engine.build_candidates(snapshot.quotes)
    evaluated = [
        opportunity.model_copy(update={"source": snapshot.source})
        for opportunity in feasibility_engine.evaluate(candidates)
    ]
    evaluated, pinned_id = demo_state_service.apply_to_opportunities(evaluated)

    approved = [opportunity for opportunity in evaluated if opportunity.execute]
    rejected = [opportunity for opportunity in evaluated if not opportunity.execute]

    selected = approved[:4] + rejected[:2]
    if len(selected) < 6:
        existing_ids = {opportunity.id for opportunity in selected}
        for opportunity in evaluated:
            if opportunity.id in existing_ids:
                continue
            selected.append(opportunity)
            if len(selected) == 6:
                break

    selected = sorted(
        selected,
        key=lambda item: (
            item.execute,
            item.expected_net_profit_usd,
            item.confidence_score,
        ),
        reverse=True,
    )
    selected = _pin_primary_opportunity(selected, evaluated, pinned_id)
    return snapshot, selected


def _pin_primary_opportunity(
    selected: List[Opportunity],
    evaluated: List[Opportunity],
    pinned_id: str | None,
) -> List[Opportunity]:
    if pinned_id is None:
        return selected

    pinned = next((opportunity for opportunity in evaluated if opportunity.id == pinned_id), None)
    if pinned is None:
        return selected

    remainder = [opportunity for opportunity in selected if opportunity.id != pinned_id]
    return [pinned, *remainder][:6]


def _build_opportunities_response() -> OpportunityListResponse:
    snapshot, opportunities = _analyze_opportunities()
    return OpportunityListResponse(
        as_of=datetime.now(timezone.utc),
        source=snapshot.source,
        execution_mode=settings.execution_mode,
        total=len(opportunities),
        opportunities=opportunities,
        hummingbot_status=hummingbot_adapter.get_status(),
        market_data_status=snapshot.market_data_status,
        demo_session=demo_state_service.get_session_state(),
        event_log=demo_state_service.get_event_log(),
    )


def _enrich_execution_run(execution: ExecutionRun) -> ExecutionRun:
    snapshot = market_data_service.get_market_snapshot()
    demo_state_service.record_market_data_status(snapshot.market_data_status)
    return execution.model_copy(
        update={
            "market_data_status": snapshot.market_data_status,
            "demo_session": demo_state_service.get_session_state(),
            "event_log": demo_state_service.get_event_log(),
        }
    )


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    snapshot = market_data_service.get_market_snapshot()
    demo_state_service.record_market_data_status(snapshot.market_data_status)
    return HealthResponse(
        status="ok",
        execution_mode=settings.execution_mode,
        market_data_provider=settings.market_data_provider,
        hummingbot_status=hummingbot_adapter.get_status(),
        market_data_status=snapshot.market_data_status,
        demo_session=demo_state_service.get_session_state(),
        event_log=demo_state_service.get_event_log(),
        as_of=datetime.now(timezone.utc),
    )


@router.get("/opportunities", response_model=OpportunityListResponse)
def list_opportunities() -> OpportunityListResponse:
    return _build_opportunities_response()


@router.get("/opportunities/{opportunity_id}", response_model=Opportunity)
def get_opportunity(opportunity_id: str) -> Opportunity:
    _, opportunities = _analyze_opportunities()
    for opportunity in opportunities:
        if opportunity.id == opportunity_id:
            return opportunity
    raise HTTPException(status_code=404, detail="Opportunity not found")


@router.post("/opportunities/{opportunity_id}/execute", response_model=ExecutionRun)
def execute_opportunity(opportunity_id: str) -> ExecutionRun:
    _, opportunities = _analyze_opportunities()
    for opportunity in opportunities:
        if opportunity.id == opportunity_id:
            return _enrich_execution_run(hummingbot_adapter.submit_opportunity(opportunity))
    raise HTTPException(status_code=404, detail="Opportunity not found")


@router.get("/executions/{execution_id}", response_model=ExecutionRun)
def get_execution(execution_id: str) -> ExecutionRun:
    execution = execution_store.get_run(execution_id)
    if execution is None:
        raise HTTPException(status_code=404, detail="Execution run not found")
    return _enrich_execution_run(execution)


def _arm_scenario(scenario: DemoScenario) -> OpportunityListResponse:
    demo_state_service.arm_scenario(scenario)
    return _build_opportunities_response()


@router.post("/demo/scenario/profitable", response_model=OpportunityListResponse)
def run_profitable_scenario() -> OpportunityListResponse:
    return _arm_scenario("profitable")


@router.post("/demo/scenario/rejected", response_model=OpportunityListResponse)
def run_rejected_scenario() -> OpportunityListResponse:
    return _arm_scenario("rejected")


@router.post("/demo/scenario/high-slippage", response_model=OpportunityListResponse)
def run_high_slippage_scenario() -> OpportunityListResponse:
    return _arm_scenario("high_slippage")


@router.post("/demo/scenario/fallback", response_model=OpportunityListResponse)
def run_fallback_scenario() -> OpportunityListResponse:
    return _arm_scenario("fallback")


@router.post("/demo/scenario/high-latency", response_model=OpportunityListResponse)
def run_high_latency_scenario() -> OpportunityListResponse:
    return _arm_scenario("high_latency")


@router.post("/demo/replay", response_model=OpportunityListResponse)
def replay_demo() -> OpportunityListResponse:
    demo_state_service.replay()
    return _build_opportunities_response()


@router.post("/demo/reset", response_model=OpportunityListResponse)
def reset_demo() -> OpportunityListResponse:
    demo_state_service.reset()
    return _build_opportunities_response()


@router.post("/intent", response_model=IntentResponse)
def analyse_intent(body: IntentRequest) -> IntentResponse:
    parsed = intent_service.parse(body.intent)
    snapshot, opportunities = _analyze_opportunities()
    matched = intent_service.match_opportunities(parsed, opportunities)
    return IntentResponse(
        parsed_intent=parsed.summary,
        intent_type=parsed.intent_type,
        asset_from=parsed.asset_from,
        asset_to=parsed.asset_to,
        amount_usd=parsed.amount_usd,
        chain_from=parsed.chain_from,
        chain_to=parsed.chain_to,
        opportunities=matched,
        total=len(matched),
        as_of=datetime.now(timezone.utc),
    )

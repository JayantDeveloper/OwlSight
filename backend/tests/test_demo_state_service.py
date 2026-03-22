from app.services.demo_state_service import DemoStateService
from tests.test_execution_store import _build_opportunity


def test_arm_replay_and_reset_demo_session():
    service = DemoStateService()

    armed = service.arm_scenario("profitable")
    replayed = service.replay()
    reset = service.reset()

    assert armed.active_scenario == "profitable"
    assert replayed.replay_count == 1
    assert replayed.is_replay is True
    assert reset.active_scenario == "none"
    assert reset.status == "idle"


def test_high_slippage_scenario_overrides_primary_opportunity():
    service = DemoStateService()
    service.arm_scenario("high_slippage")

    opportunities, pinned_id = service.apply_to_opportunities(
        [_build_opportunity(execute=True)]
    )

    assert pinned_id == "sol-solana-jupiter-base-aerodrome"
    assert opportunities[0].execute is False
    assert opportunities[0].estimated_slippage_bps > 40
    assert opportunities[0].cost_breakdown.latency_penalty_usd > 0


def test_fallback_scenario_sets_failover_flag():
    service = DemoStateService()
    service.arm_scenario("fallback")

    assert service.should_force_hummingbot_failure() is True

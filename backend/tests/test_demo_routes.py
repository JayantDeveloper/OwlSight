from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_opportunities_response_is_enriched():
    client.post("/api/demo/reset")
    response = client.get("/api/opportunities")

    assert response.status_code == 200
    body = response.json()
    assert "market_data_status" in body
    assert "demo_session" in body
    assert "event_log" in body


def test_high_slippage_scenario_endpoint_arms_demo_state():
    response = client.post("/api/demo/scenario/high-slippage")

    assert response.status_code == 200
    body = response.json()
    assert body["demo_session"]["active_scenario"] == "high_slippage"
    assert body["opportunities"][0]["execute"] is False
    assert body["event_log"]


def test_replay_and_reset_endpoints_work():
    client.post("/api/demo/scenario/profitable")

    replay = client.post("/api/demo/replay")
    reset = client.post("/api/demo/reset")

    assert replay.status_code == 200
    assert replay.json()["demo_session"]["replay_count"] == 1
    assert reset.status_code == 200
    assert reset.json()["demo_session"]["active_scenario"] == "none"


def test_execution_response_contains_enriched_fields():
    client.post("/api/demo/reset")
    opportunities = client.get("/api/opportunities").json()["opportunities"]
    approved = next(opportunity for opportunity in opportunities if opportunity["execute"])

    response = client.post(f"/api/opportunities/{approved['id']}/execute")

    assert response.status_code == 200
    body = response.json()
    assert "execution_mode" in body
    assert "execution_status" in body
    assert "executor" in body
    assert "connection_status" in body
    assert "request_id" in body
    assert "fallback_used" in body

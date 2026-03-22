from datetime import datetime, timezone

from app.core.config import get_settings
from app.services.market_data_service import MarketDataService


class StubResponse:
    def __init__(self, status_code, payload):
        self.status_code = status_code
        self._payload = payload

    def json(self):
        return self._payload


class StubClient:
    def __init__(self, responses):
        self._responses = list(responses)
        self.calls = []

    def get(self, path, params=None, headers=None):
        self.calls.append({"path": path, "params": params, "headers": headers})
        return self._responses.pop(0)


def _build_settings(**overrides):
    settings = get_settings()
    return settings.__class__(**{**settings.__dict__, **overrides})


def test_mock_provider_returns_mock_snapshot():
    settings = _build_settings(market_data_provider="mock")
    service = MarketDataService(settings.mock_market_data_path, settings=settings)

    snapshot = service.get_market_snapshot(
        now=datetime(2026, 3, 21, 16, 0, tzinfo=timezone.utc)
    )

    assert snapshot.source == "mock"
    assert snapshot.quotes


def test_birdeye_provider_falls_back_to_mock_on_failure():
    settings = _build_settings(
        market_data_provider="birdeye",
        birdeye_api_key="demo-key",
    )
    client = StubClient(
        [
            StubResponse(429, {"success": False}),
        ]
    )
    service = MarketDataService(
        settings.mock_market_data_path,
        settings=settings,
        http_client=client,
        sleep_fn=lambda _: None,
        monotonic_fn=lambda: 100.0,
    )

    snapshot = service.get_market_snapshot(
        now=datetime(2026, 3, 21, 16, 0, tzinfo=timezone.utc)
    )

    assert snapshot.source == "mock"


def test_birdeye_provider_uses_cache():
    settings = _build_settings(
        market_data_provider="birdeye",
        birdeye_api_key="demo-key",
        cache_ttl_seconds=20,
    )
    client = StubClient(
        [
            StubResponse(
                200,
                {"success": True, "data": {"value": 190.25, "updateUnixTime": 1774118400}},
            ),
            StubResponse(
                200,
                {"success": True, "data": {"value": 3420.1, "updateUnixTime": 1774118400}},
            ),
            StubResponse(
                200,
                {"success": True, "data": {"value": 62450.0, "updateUnixTime": 1774118400}},
            ),
        ]
    )
    service = MarketDataService(
        settings.mock_market_data_path,
        settings=settings,
        http_client=client,
        sleep_fn=lambda _: None,
        monotonic_fn=lambda: 100.0,
    )

    now = datetime(2026, 3, 21, 16, 0, tzinfo=timezone.utc)
    first_snapshot = service.get_market_snapshot(now=now)
    second_snapshot = service.get_market_snapshot(now=now)

    assert first_snapshot.source == "birdeye"
    assert second_snapshot.source == "birdeye"
    assert len(client.calls) == 3


def test_coingecko_provider_uses_demo_header_and_cache():
    settings = _build_settings(
        market_data_provider="coingecko",
        coingecko_api_key="cg-demo-key",
        coingecko_api_tier="demo",
        coingecko_base_url="https://api.coingecko.com/api/v3",
        cache_ttl_seconds=20,
    )
    client = StubClient(
        [
            StubResponse(
                200,
                {
                    "solana": {"usd": 189.42, "last_updated_at": 1774118400},
                    "ethereum": {"usd": 3411.3, "last_updated_at": 1774118400},
                    "wrapped-bitcoin": {
                        "usd": 62301.7,
                        "last_updated_at": 1774118400,
                    },
                },
            )
        ]
    )
    service = MarketDataService(
        settings.mock_market_data_path,
        settings=settings,
        http_client=client,
        sleep_fn=lambda _: None,
        monotonic_fn=lambda: 100.0,
    )

    now = datetime(2026, 3, 21, 16, 0, tzinfo=timezone.utc)
    first_snapshot = service.get_market_snapshot(now=now)
    second_snapshot = service.get_market_snapshot(now=now)

    assert first_snapshot.source == "coingecko"
    assert second_snapshot.source == "coingecko"
    assert len(client.calls) == 1
    assert (
        client.calls[0]["headers"]["x-cg-demo-api-key"]
        == "cg-demo-key"
    )


def test_coingecko_provider_falls_back_to_mock_on_failure():
    settings = _build_settings(
        market_data_provider="coingecko",
        coingecko_api_key="cg-demo-key",
        coingecko_api_tier="demo",
        coingecko_base_url="https://api.coingecko.com/api/v3",
    )
    client = StubClient([StubResponse(429, {})])
    service = MarketDataService(
        settings.mock_market_data_path,
        settings=settings,
        http_client=client,
        sleep_fn=lambda _: None,
        monotonic_fn=lambda: 100.0,
    )

    snapshot = service.get_market_snapshot(
        now=datetime(2026, 3, 21, 16, 0, tzinfo=timezone.utc)
    )

    assert snapshot.source == "mock"
    assert snapshot.market_data_status.connection_status == "fallback_to_mock"

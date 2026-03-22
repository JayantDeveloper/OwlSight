"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  executeOpportunity,
  fetchExecution,
  fetchOpportunities,
  replayDemo,
  resetDemo,
  triggerDemoScenario,
} from "@/lib/api";
import { formatProviderName, formatScenarioName } from "@/lib/format";
import {
  DemoSessionState,
  EventLogEntry,
  ExecutionRun,
  HummingbotStatus,
  MarketDataStatus,
  Opportunity,
  OpportunityListResponse,
  RequestedExecutionMode,
} from "@/lib/types";

export type DemoAction =
  | "profitable"
  | "rejected"
  | "high-slippage"
  | "fallback"
  | "high-latency"
  | "replay"
  | "reset";

export interface HummingbotPresentationStatus {
  state: "connected" | "simulation" | "failover";
  label: string;
  detail: string;
  tone: "neutral" | "positive" | "warning";
}

export interface StatusPresentation {
  label: string;
  detail: string;
  tone: "neutral" | "positive" | "warning";
}

const emptyDemoSession: DemoSessionState = {
  active_scenario: "none",
  status: "idle",
  session_label: "Live Feed",
  replay_count: 0,
  is_replay: false,
  armed_at: null,
};

function dedupeWarnings(warnings: string[]): string[] {
  return Array.from(new Set(warnings));
}

function auditOpportunityResponse(response: OpportunityListResponse): string[] {
  const payload = response as Partial<OpportunityListResponse>;
  const warnings: string[] = [];

  if (!Array.isArray(payload.opportunities)) {
    warnings.push("Backend response missing opportunities. Feed may be incomplete.");
  }
  if (!payload.market_data_status) {
    warnings.push(
      "Backend response missing market_data_status. Market provider labels are degraded.",
    );
  }
  if (!payload.hummingbot_status) {
    warnings.push(
      "Backend response missing hummingbot_status. Hummingbot state is being emulated.",
    );
  }
  if (!payload.demo_session) {
    warnings.push(
      "Backend response missing demo_session. Demo state is being shown with fallback defaults.",
    );
  }
  if (!Array.isArray(payload.event_log)) {
    warnings.push(
      "Backend response missing event_log. Operator feed may be incomplete.",
    );
  }
  if (!payload.execution_mode) {
    warnings.push(
      "Backend response missing execution_mode. Execution engine labels may be degraded.",
    );
  }
  if (
    Array.isArray(payload.opportunities) &&
    payload.opportunities.some((opportunity) => !(opportunity as Partial<Opportunity>).source)
  ) {
    warnings.push(
      "One or more opportunities are missing source metadata. LIVE / MOCK badges may be inaccurate.",
    );
  }
  if (
    Array.isArray(payload.opportunities) &&
    payload.opportunities.some(
      (opportunity) =>
        (opportunity as Partial<Opportunity>).expected_net_profit_usd === undefined,
    )
  ) {
    warnings.push(
      "One or more opportunities are missing expected_net_profit_usd. Net edge rendering may be incomplete.",
    );
  }

  return warnings;
}

function auditExecutionResponse(response: ExecutionRun): string[] {
  const payload = response as Partial<ExecutionRun>;
  const warnings: string[] = [];

  if (!payload.execution_mode) {
    warnings.push(
      "Execution response missing execution_mode. Execution badges may be degraded.",
    );
  }
  if (!payload.executor) {
    warnings.push(
      "Execution response missing executor. Execution target is not fully verified.",
    );
  }
  if (!payload.connection_status) {
    warnings.push(
      "Execution response missing connection_status. Hummingbot connection state is unclear.",
    );
  }
  if (!Array.isArray(payload.timeline_events)) {
    warnings.push(
      "Execution response missing timeline_events. Timeline may be incomplete.",
    );
  }
  if (payload.request_id == null) {
    warnings.push(
      "Execution response missing request_id. The execution handoff was not fully identified by the API.",
    );
  }

  return warnings;
}

function deriveHummingbotPresentationStatus(
  hummingbotStatus: HummingbotStatus | null,
  executionModeConfigured: RequestedExecutionMode,
  execution: ExecutionRun | null,
): HummingbotPresentationStatus {
  if (execution?.fallback_used) {
    return {
      state: "failover",
      label: "Hummingbot Unavailable",
      detail: "Failover to Mock Execution",
      tone: "warning",
    };
  }

  if (
    hummingbotStatus?.state === "connected" &&
    executionModeConfigured === "paper_hummingbot"
  ) {
    return {
      state: "connected",
      label: "Hummingbot Connected",
      detail: "Paper Trading Ready",
      tone: "positive",
    };
  }

  return {
    state: "simulation",
    label: "Hummingbot Simulation",
    detail:
      executionModeConfigured === "paper_hummingbot"
        ? "Paper Trading Emulated"
        : "Mock Execution Primary",
    tone: "neutral",
  };
}

export function useCopilotRuntime() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<string | null>(
    null,
  );
  const [execution, setExecution] = useState<ExecutionRun | null>(null);
  const [executionModeConfigured, setExecutionModeConfigured] =
    useState<RequestedExecutionMode>("mock");
  const [hummingbotStatus, setHummingbotStatus] = useState<HummingbotStatus | null>(
    null,
  );
  const [marketDataStatus, setMarketDataStatus] = useState<MarketDataStatus | null>(
    null,
  );
  const [demoSession, setDemoSession] = useState<DemoSessionState>(emptyDemoSession);
  const [eventLog, setEventLog] = useState<EventLogEntry[]>([]);
  const [responseWarnings, setResponseWarnings] = useState<string[]>([]);
  const [executionWarnings, setExecutionWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isDemoBusy, setIsDemoBusy] = useState(false);

  const applyOpportunityResponse = useCallback((response: OpportunityListResponse) => {
    setOpportunities(response.opportunities);
    setExecutionModeConfigured(response.execution_mode);
    setHummingbotStatus(response.hummingbot_status);
    setMarketDataStatus(response.market_data_status);
    setDemoSession(response.demo_session);
    setEventLog(response.event_log);
    setResponseWarnings(auditOpportunityResponse(response));
    setExecutionWarnings([]);
  }, []);

  const applyExecutionResponse = useCallback((response: ExecutionRun) => {
    setExecution(response);
    if (response.market_data_status) {
      setMarketDataStatus(response.market_data_status);
    }
    if (response.demo_session) {
      setDemoSession(response.demo_session);
    }
    if (response.event_log?.length) {
      setEventLog(response.event_log);
    }
    setExecutionWarnings(auditExecutionResponse(response));
  }, []);

  const loadOpportunities = useCallback(async () => {
    const response = await fetchOpportunities();
    applyOpportunityResponse(response);
  }, [applyOpportunityResponse]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetchOpportunities();
        if (cancelled) {
          return;
        }
        applyOpportunityResponse(response);
        setError(null);
      } catch {
        if (!cancelled) {
          setError("Backend unavailable. Start the FastAPI server on port 8000.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    const interval = window.setInterval(load, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [applyOpportunityResponse]);

  useEffect(() => {
    if (!opportunities.length) {
      setSelectedOpportunityId(null);
      return;
    }

    const exists = opportunities.some(
      (opportunity) => opportunity.id === selectedOpportunityId,
    );
    if (!exists) {
      setSelectedOpportunityId(opportunities[0].id);
    }
  }, [opportunities, selectedOpportunityId]);

  useEffect(() => {
    if (!execution || execution.terminal) {
      return;
    }

    let cancelled = false;
    const interval = window.setInterval(async () => {
      try {
        const nextExecution = await fetchExecution(execution.id);
        if (!cancelled) {
          applyExecutionResponse(nextExecution);
          if (nextExecution.terminal) {
            setIsExecuting(false);
          }
        }
      } catch {
        if (!cancelled) {
          setError("Execution polling failed. Check the backend connection.");
          setIsExecuting(false);
        }
      }
    }, 1000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [applyExecutionResponse, execution]);

  const selectedOpportunity = useMemo(
    () =>
      opportunities.find((opportunity) => opportunity.id === selectedOpportunityId) ??
      null,
    [opportunities, selectedOpportunityId],
  );

  const approvedCount = useMemo(
    () => opportunities.filter((opportunity) => opportunity.execute).length,
    [opportunities],
  );

  const avgConfidence = useMemo(
    () =>
      opportunities.length
        ? opportunities.reduce(
            (sum, opportunity) => sum + opportunity.confidence_score,
            0,
          ) / opportunities.length
        : 0,
    [opportunities],
  );

  const projectedNet = useMemo(
    () =>
      opportunities
        .filter((opportunity) => opportunity.execute)
        .reduce((sum, opportunity) => sum + opportunity.expected_net_profit_usd, 0),
    [opportunities],
  );

  const featuredOpportunity = selectedOpportunity ?? opportunities[0] ?? null;

  const apiWarnings = useMemo(
    () => dedupeWarnings([...responseWarnings, ...executionWarnings]),
    [executionWarnings, responseWarnings],
  );

  const fallbackState = useMemo(() => {
    if (
      execution?.fallback_used ||
      marketDataStatus?.connection_status === "fallback_to_mock"
    ) {
      return {
        label: "Failover Active",
        tone: "warning" as const,
      };
    }

    if (demoSession.active_scenario === "fallback") {
      return {
        label: "Failover Armed",
        tone: "warning" as const,
      };
    }

    return {
      label: "Stable",
      tone: "neutral" as const,
    };
  }, [demoSession.active_scenario, execution?.fallback_used, marketDataStatus]);

  const hummingbotPresentation = useMemo(
    () =>
      deriveHummingbotPresentationStatus(
        hummingbotStatus,
        executionModeConfigured,
        execution,
      ),
    [execution, executionModeConfigured, hummingbotStatus],
  );

  const executionEngineLabel = useMemo(() => {
    if (
      execution?.execution_mode === "paper_hummingbot" ||
      (executionModeConfigured === "paper_hummingbot" &&
        hummingbotStatus?.state === "connected")
    ) {
      return "Paper Trade";
    }

    return "Mock Execution";
  }, [execution?.execution_mode, executionModeConfigured, hummingbotStatus?.state]);

  const marketProviderLabel = marketDataStatus
    ? formatProviderName(marketDataStatus.actual_provider)
    : loading
      ? "Loading"
      : "Status Missing";

  const demoSessionLabel = formatScenarioName(demoSession.active_scenario);

  const marketDataPresentation = useMemo<StatusPresentation>(() => {
    if (marketDataStatus) {
      return {
        label: formatProviderName(marketDataStatus.actual_provider),
        detail:
          marketDataStatus.fallback_reason ??
          marketDataStatus.message ??
          "Market snapshot status received.",
        tone:
          marketDataStatus.connection_status === "live"
            ? "positive"
            : marketDataStatus.connection_status === "fallback_to_mock"
              ? "warning"
              : "neutral",
      };
    }

    return {
      label: loading ? "Loading" : "Status Missing",
      detail: loading
        ? "Waiting for /api/opportunities."
        : "API did not return market_data_status.",
      tone: loading ? "neutral" : "warning",
    };
  }, [loading, marketDataStatus]);

  const executionEnginePresentation = useMemo<StatusPresentation>(() => {
    if (execution) {
      return {
        label: executionEngineLabel,
        detail:
          execution.executor ||
          "API did not return executor. Execution target is unclear.",
        tone: execution.fallback_used
          ? "warning"
          : execution.execution_mode === "paper_hummingbot"
            ? "positive"
            : "neutral",
      };
    }

    if (executionModeConfigured === "paper_hummingbot") {
      return {
        label: "Paper Trade",
        detail: hummingbotStatus
          ? hummingbotStatus.state === "connected"
            ? "Configured by backend for Hummingbot paper trading."
            : "Configured for paper trade, currently emulated until Hummingbot acknowledges."
          : "API did not return hummingbot_status. Showing emulated paper-trade state.",
        tone: hummingbotStatus?.state === "connected" ? "positive" : hummingbotStatus ? "neutral" : "warning",
      };
    }

    return {
      label: "Mock Execution",
      detail: "Configured by backend for mock execution.",
      tone: "neutral",
    };
  }, [execution, executionEngineLabel, executionModeConfigured, hummingbotStatus]);

  const fallbackPresentation = useMemo<StatusPresentation>(() => {
    if (execution?.fallback_used) {
      return {
        label: "Failover Active",
        detail:
          execution.fallback_reason ??
          "Fallback engaged, but the API did not return a fallback_reason.",
        tone: "warning",
      };
    }

    if (marketDataStatus?.connection_status === "fallback_to_mock") {
      return {
        label: "Provider Failover",
        detail:
          marketDataStatus.fallback_reason ??
          "Live provider failed. Using mock market snapshot.",
        tone: "warning",
      };
    }

    if (demoSession.active_scenario === "fallback") {
      return {
        label: "Failover Armed",
        detail: "The current demo session will force Hummingbot failover on execution.",
        tone: "warning",
      };
    }

    return {
      label: "Stable",
      detail: "No provider or execution failover is active.",
      tone: "neutral",
    };
  }, [demoSession.active_scenario, execution, marketDataStatus]);

  const demoSessionPresentation = useMemo<StatusPresentation>(() => {
    if (!responseWarnings.some((warning) => warning.includes("demo_session"))) {
      return {
        label: demoSessionLabel,
        detail:
          demoSession.active_scenario === "none"
            ? "Backend live feed mode."
            : demoSession.is_replay
              ? `Replay ${demoSession.replay_count} in progress.`
              : "Backend deterministic scenario is armed.",
        tone: demoSession.active_scenario === "none" ? "neutral" : "warning",
      };
    }

    return {
      label: "Status Missing",
      detail: "API did not return demo_session.",
      tone: "warning",
    };
  }, [demoSession.active_scenario, demoSession.is_replay, demoSession.replay_count, demoSessionLabel, responseWarnings]);

  const recentEvents = useMemo(() => eventLog.slice().reverse().slice(0, 4), [eventLog]);

  const selectOpportunity = useCallback((opportunityId: string) => {
    setSelectedOpportunityId(opportunityId);
    setExecution(null);
    setIsExecuting(false);
  }, []);

  const executeSelectedOpportunity = useCallback(async () => {
    if (!selectedOpportunity) {
      return;
    }

    try {
      setIsExecuting(true);
      const createdExecution = await executeOpportunity(selectedOpportunity.id);
      applyExecutionResponse(createdExecution);
      setError(null);
      if (createdExecution.terminal) {
        setIsExecuting(false);
      }
    } catch {
      setError("Execution request failed. Confirm the backend is running.");
      setIsExecuting(false);
    }
  }, [applyExecutionResponse, selectedOpportunity]);

  const runDemoAction = useCallback(async (action: DemoAction) => {
    try {
      setIsDemoBusy(true);
      setExecution(null);
      setIsExecuting(false);

      const response =
        action === "replay"
          ? await replayDemo()
          : action === "reset"
            ? await resetDemo()
            : await triggerDemoScenario(action);

      applyOpportunityResponse(response);
      setError(null);
    } catch {
      setError("Demo control request failed. Confirm the backend is running.");
    } finally {
      setIsDemoBusy(false);
    }
  }, [applyOpportunityResponse]);

  return {
    opportunities,
    selectedOpportunity,
    selectedOpportunityId,
    execution,
    executionModeConfigured,
    hummingbotStatus,
    hummingbotPresentation,
    marketDataStatus,
    marketProviderLabel,
    marketDataPresentation,
    demoSession,
    demoSessionLabel,
    demoSessionPresentation,
    eventLog,
    recentEvents,
    apiWarnings,
    loading,
    error,
    isExecuting,
    isDemoBusy,
    approvedCount,
    avgConfidence,
    projectedNet,
    featuredOpportunity,
    executionEngineLabel,
    executionEnginePresentation,
    fallbackState,
    fallbackPresentation,
    loadOpportunities,
    selectOpportunity,
    executeSelectedOpportunity,
    runDemoAction,
  };
}

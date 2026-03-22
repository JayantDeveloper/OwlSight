import { ExecutionRun, IntentResponse, Opportunity, OpportunityListResponse } from "@/lib/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function fetchOpportunities(): Promise<OpportunityListResponse> {
  return request<OpportunityListResponse>("/api/opportunities");
}

export async function fetchOpportunity(opportunityId: string): Promise<Opportunity> {
  return request<Opportunity>(`/api/opportunities/${opportunityId}`);
}

export async function executeOpportunity(
  opportunityId: string,
): Promise<ExecutionRun> {
  return request<ExecutionRun>(`/api/opportunities/${opportunityId}/execute`, {
    method: "POST",
  });
}

export async function fetchExecution(executionId: string): Promise<ExecutionRun> {
  return request<ExecutionRun>(`/api/executions/${executionId}`);
}

export async function triggerDemoScenario(
  path:
    | "profitable"
    | "rejected"
    | "high-slippage"
    | "fallback"
    | "high-latency",
): Promise<OpportunityListResponse> {
  return request<OpportunityListResponse>(`/api/demo/scenario/${path}`, {
    method: "POST",
  });
}

export async function replayDemo(): Promise<OpportunityListResponse> {
  return request<OpportunityListResponse>("/api/demo/replay", {
    method: "POST",
  });
}

export async function resetDemo(): Promise<OpportunityListResponse> {
  return request<OpportunityListResponse>("/api/demo/reset", {
    method: "POST",
  });
}

export async function analyseIntent(intent: string): Promise<IntentResponse> {
  return request<IntentResponse>("/api/intent", {
    method: "POST",
    body: JSON.stringify({ intent }),
  });
}

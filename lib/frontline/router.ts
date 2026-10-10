/**
 * Deterministic intent router for Manufy Frontline Mode.
 *
 * Implements strict three-path decision architecture:
 * - PATH_A: Existing supported interactive mock handlers (cards, checklists, approval).
 * - PATH_B: Analytical reasoning, multi-record summaries, aggregations, and comparisons over mock operational data.
 * - PATH_C: Unsupported, unrelated, or nonsensical input returning the exact application guardrail message.
 */

import { FRONTLINE_GUARDRAIL_MESSAGE } from "../mock/frontlineData";

export type PathType = "PATH_A" | "PATH_B" | "PATH_C";

export type PathAScenario =
  | "approve"
  | "oil_history"
  | "equipment_drift"
  | "training"
  | "inventory_stock";

export interface RouteDecision {
  path: PathType;
  scenario?: PathAScenario;
  reasoningCategory?: "shift" | "maintenance" | "inventory" | "training" | "factory_overview";
  guardrailText?: string;
  normalizedQuery: string;
}

/**
 * Check if the query explicitly asks for multi-record synthesis, summary,
 * comparison, aggregation, or cross-record analysis.
 */
function isAnalyticalReasoningRequest(q: string): boolean {
  // Analytical / synthesis verbs and phrases
  const analyticalVerbs = [
    "summarize",
    "summarise",
    "summary",
    "overview",
    "breakdown",
    "recap",
    "synthesize",
    "synthesis",
    "compare",
    "comparison",
    "difference between",
    "pattern",
    "trends",
    "trend",
    "aggregate",
    "list all",
    "across the factory",
    "across the plant",
    "across the floor",
    "all issues",
    "all tickets",
    "all work orders",
    "all maintenance",
    "all the maintenance",
    "handover",
    "next shift know",
    "what happened last shift",
    "what happened",
    "what is pending",
    "what's pending",
    "unresolved",
    "outstanding",
  ];

  const hasAnalyticalIntent = analyticalVerbs.some((term) => q.includes(term));
  if (!hasAnalyticalIntent) {
    return false;
  }

  // Must pertain to operational context to qualify for Path B
  const operationalTerms = [
    "shift",
    "maintenance",
    "activity",
    "activities",
    "work order",
    "work orders",
    "ticket",
    "tickets",
    "issue",
    "issues",
    "factory",
    "plant",
    "floor",
    "press",
    "press 3",
    "machine",
    "machines",
    "equipment",
    "incident",
    "incidents",
    "handover",
    "tool",
    "inventory",
    "stock",
    "reorder",
    "insert",
    "inserts",
    "training",
    "cert",
    "station 4",
    "station",
    "conveyor",
    "unresolved",
    "outstanding",
    "today",
  ];

  return operationalTerms.some((term) => q.includes(term));
}

/**
 * Determine if input is plausibly operational or shop-floor related.
 */
function isOperationallyRelevant(q: string): boolean {
  const shopFloorTerms = [
    "press",
    "oil",
    "hyd",
    "hydraulic",
    "drift",
    "equipment",
    "temp",
    "temperature",
    "down",
    "priya",
    "training",
    "cert",
    "chemical",
    "stock",
    "cnmg",
    "insert",
    "inventory",
    "order",
    "approve",
    "bearing",
    "conveyor",
    "bracket",
    "bolt",
    "allen-bradley",
    "plc",
    "station",
    "crib",
    "cage",
    "shift",
    "maintenance",
    "marcus",
    "devin",
    "dana",
    "work order",
    "w-3318",
    "w-3321",
    "w-3307",
    "t-118",
    "p-1042",
    "iso 46",
    "seal",
    "pump",
    "psi",
    "coolant",
  ];

  return shopFloorTerms.some((term) => q.includes(term));
}

/**
 * Classifies an incoming message into Path A, Path B, or Path C.
 */
export function classifyFrontlineIntent(
  rawQuery: string,
  options?: { canApprovePo?: boolean; currentPersonaId?: string }
): RouteDecision {
  const query = (rawQuery || "").trim();
  const q = query.toLowerCase();

  // 1. Path A: Direct Approval Action
  if (q === "approve" || q === "approve po" || q === "approve po-1042") {
    return {
      path: "PATH_A",
      scenario: "approve",
      normalizedQuery: query,
    };
  }

  // 2. Path B: Explicit analytical reasoning, summary, or multi-record comparison
  // Must take precedence over broad keyword matching (e.g. "Summarize Press 3 maintenance history"
  // must go to Gemini, NOT trigger the canned "when was press oil changed" history card).
  if (isAnalyticalReasoningRequest(q)) {
    let reasoningCategory: "shift" | "maintenance" | "inventory" | "training" | "factory_overview" = "factory_overview";

    if (q.includes("inventory") || q.includes("stock") || q.includes("tool") || q.includes("reorder") || q.includes("insert")) {
      reasoningCategory = "inventory";
    } else if (q.includes("maintenance") || q.includes("incident") || q.includes("press") || q.includes("oil") || q.includes("conveyor") || q.includes("history")) {
      reasoningCategory = "maintenance";
    } else if (q.includes("training") || q.includes("cert") || q.includes("priya")) {
      reasoningCategory = "training";
    } else if (q.includes("shift") || q.includes("work order") || q.includes("ticket") || q.includes("handover") || q.includes("outstanding") || q.includes("unresolved")) {
      reasoningCategory = "shift";
    }

    return {
      path: "PATH_B",
      reasoningCategory,
      normalizedQuery: query,
    };
  }

  // 3. Path A: Existing Supported Mock Interactions
  if (
    q.includes("drift") ||
    q.includes("equipment") ||
    q.includes("temp") ||
    q.includes("down")
  ) {
    return {
      path: "PATH_A",
      scenario: "equipment_drift",
      normalizedQuery: query,
    };
  }

  if (q.includes("oil") || q.includes("press")) {
    return {
      path: "PATH_A",
      scenario: "oil_history",
      normalizedQuery: query,
    };
  }

  if (
    q.includes("priya") ||
    q.includes("training") ||
    q.includes("cert") ||
    q.includes("chemical")
  ) {
    return {
      path: "PATH_A",
      scenario: "training",
      normalizedQuery: query,
    };
  }

  if (
    q.includes("stock") ||
    q.includes("cnmg") ||
    q.includes("insert") ||
    q.includes("inventory") ||
    q.includes("order")
  ) {
    return {
      path: "PATH_A",
      scenario: "inventory_stock",
      normalizedQuery: query,
    };
  }

  // 4. Ambiguous but plausibly operational inquiries (e.g. "hyd oil prob press 3", "machine down")
  // Catch domain keywords to prevent false guardrail rejection
  if (isOperationallyRelevant(q)) {
    if (q.includes("hyd") || q.includes("seal") || q.includes("pump") || q.includes("coolant") || q.includes("bearing")) {
      return {
        path: "PATH_A",
        scenario: "oil_history",
        normalizedQuery: query,
      };
    }
  }

  // 5. Path C: Out-of-scope, unrelated, or nonsensical input
  return {
    path: "PATH_C",
    guardrailText: FRONTLINE_GUARDRAIL_MESSAGE,
    normalizedQuery: query,
  };
}


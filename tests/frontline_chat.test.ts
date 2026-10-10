import assert from "node:assert/strict";
import test from "node:test";
import { POST as handleFrontlineChat } from "../app/api/frontline/chat/route";
import { formatFrontlinePlainText } from "../lib/frontline/format";
import { retrieveMockRecords } from "../lib/frontline/retriever";
import { classifyFrontlineIntent } from "../lib/frontline/router";
import {
  FRONTLINE_GUARDRAIL_MESSAGE,
  MOCK_INVENTORY,
  MOCK_MAINTENANCE_HISTORY,
  MOCK_TRAINING_RECORDS,
  PERSONAS,
} from "../lib/mock/frontlineData";
import { NextRequest } from "next/server";

// =========================================================================
// 1. ROUTER INTENT CLASSIFICATION (PATH A, B, C)
// =========================================================================

test("Frontline Router (Path A): Standard mock oil question routes to oil_history scenario", () => {
  const result = classifyFrontlineIntent("When was the press oil last changed?");
  assert.strictEqual(result.path, "PATH_A");
  assert.strictEqual(result.scenario, "oil_history");
});

test("Frontline Router (Path A): Equipment drift question routes to equipment_drift scenario", () => {
  const result = classifyFrontlineIntent("Press 3 temperature is too high.");
  assert.strictEqual(result.path, "PATH_A");
  assert.strictEqual(result.scenario, "equipment_drift");
});

test("Frontline Router (Path A): Direct stock query routes to inventory_stock scenario", () => {
  const result = classifyFrontlineIntent("Show me the CNMG insert stock.");
  assert.strictEqual(result.path, "PATH_A");
  assert.strictEqual(result.scenario, "inventory_stock");
});

test("Frontline Router (Path A): Priya certification query routes to training scenario", () => {
  const result = classifyFrontlineIntent("Show Priya's pending certifications.");
  assert.strictEqual(result.path, "PATH_A");
  assert.strictEqual(result.scenario, "training");
});

test("Frontline Router (Path A): Approval action routes to approve scenario", () => {
  const result = classifyFrontlineIntent("approve", { canApprovePo: true });
  assert.strictEqual(result.path, "PATH_A");
  assert.strictEqual(result.scenario, "approve");
});

// =========================================================================
// 2. ROUTER PRIORITY: ANALYTICAL QUESTIONS (PATH B)
// =========================================================================

test("Frontline Router (Path B): Shift summary routes to Gemini (Path B)", () => {
  const result = classifyFrontlineIntent("Summarize the current shift.");
  assert.strictEqual(result.path, "PATH_B");
  assert.strictEqual(result.reasoningCategory, "shift");
});

test("Frontline Router (Path B): Press 3 summary routes to Path B (not captured by generic 'press' keyword)", () => {
  const result = classifyFrontlineIntent("Summarize the recent Press 3 incidents and explain their common pattern.");
  assert.strictEqual(result.path, "PATH_B");
  assert.strictEqual(result.reasoningCategory, "maintenance");
});

test("Frontline Router (Path B): Tool inventory summary routes to Path B (not captured by generic 'inventory' keyword)", () => {
  const result = classifyFrontlineIntent(
    "Summarize tool inventory and identify which items are below their mock reorder thresholds."
  );
  assert.strictEqual(result.path, "PATH_B");
  assert.strictEqual(result.reasoningCategory, "inventory");
});

test("Frontline Router (Path B): Compare machine maintenance history routes to Path B", () => {
  const result = classifyFrontlineIntent("Compare the maintenance history of the machines represented in our data.");
  assert.strictEqual(result.path, "PATH_B");
  assert.strictEqual(result.reasoningCategory, "maintenance");
});

test("Frontline Router (Path B): Next shift handover query routes to Path B", () => {
  const result = classifyFrontlineIntent("What should the next shift know based on the available handover records?");
  assert.strictEqual(result.path, "PATH_B");
  assert.strictEqual(result.reasoningCategory, "shift");
});

test("Frontline Router (Path B): Unresolved issues overview routes to Path B", () => {
  const result = classifyFrontlineIntent("Based on the available records, what operational issues are still unresolved?");
  assert.strictEqual(result.path, "PATH_B");
  assert.strictEqual(result.reasoningCategory, "shift");
});

test("Frontline Router (Path B): Colloquial maintenance summary routes to Path B", () => {
  const result = classifyFrontlineIntent("summarise today's maintenance");
  assert.strictEqual(result.path, "PATH_B");
  assert.strictEqual(result.reasoningCategory, "maintenance");
});

// =========================================================================
// 3. ROUTER GUARDRAILS (PATH C) & AVOID FALSE GUARDRAILS
// =========================================================================

test("Frontline Router (Path C): Random gibberish returns exact guardrail message", () => {
  const result = classifyFrontlineIntent("banana spaceship purple");
  assert.strictEqual(result.path, "PATH_C");
  assert.strictEqual(result.guardrailText, FRONTLINE_GUARDRAIL_MESSAGE);
});

test("Frontline Router (Path C): Unrelated pop culture query returns exact guardrail message", () => {
  const result = classifyFrontlineIntent("Who won the Grammy for best album in 2024?");
  assert.strictEqual(result.path, "PATH_C");
  assert.strictEqual(result.guardrailText, FRONTLINE_GUARDRAIL_MESSAGE);
});

test("Frontline Router (Path C): Nonsensical character sequence returns exact guardrail message", () => {
  const result = classifyFrontlineIntent("asdfghjkl qwerty 123456");
  assert.strictEqual(result.path, "PATH_C");
  assert.strictEqual(result.guardrailText, FRONTLINE_GUARDRAIL_MESSAGE);
});

test("Frontline Router (Avoid False Guardrail): Typo-laden operational phrase routes safely", () => {
  const result = classifyFrontlineIntent("hyd oil prob press 3");
  // Plausibly operational phrase with domain terms should NOT be rejected as Path C
  assert.notStrictEqual(result.path, "PATH_C");
  assert.strictEqual(result.path, "PATH_A");
  assert.strictEqual(result.scenario, "oil_history");
});

// =========================================================================
// 4. RETRIEVER: FACTUAL FIDELITY TO REPOSITORY MOCK DATA
// =========================================================================

test("Frontline Retriever: Inventory query pulls only existing mock stock items", () => {
  const ctx = retrieveMockRecords("Summarize inventory levels and reorder points");
  assert.strictEqual(ctx.category, "inventory");
  const items = ctx.records.inventoryItems as Array<{ item: string; onHand: number; reorderPoint: number; isBelowReorder: boolean }>;
  assert.ok(Array.isArray(items));
  assert.strictEqual(items.length, MOCK_INVENTORY.length);

  // Verifies CNMG 432 inserts on-hand 3 vs reorder point 12
  const cnmg = items.find((i) => i.item.includes("CNMG 432"));
  assert.ok(cnmg);
  assert.strictEqual(cnmg.onHand, 3);
  assert.strictEqual(cnmg.reorderPoint, 12);
  assert.strictEqual(cnmg.isBelowReorder, true);
});

test("Frontline Retriever: Press 3 query isolates Press 3 maintenance records", () => {
  const ctx = retrieveMockRecords("Summarize recent Press 3 maintenance events");
  assert.strictEqual(ctx.category, "maintenance");
  const logs = ctx.records.maintenanceLog as Array<{ equipment: string; title: string }>;
  assert.ok(Array.isArray(logs));
  for (const log of logs) {
    assert.ok(log.equipment.toLowerCase().includes("press") || log.title.toLowerCase().includes("press"));
  }
});

test("Frontline Retriever: Shift query compiles all 4 personas' active tickets", () => {
  const ctx = retrieveMockRecords("Give me an overview of outstanding work orders");
  assert.strictEqual(ctx.category, "shift");
  const allOrders = ctx.records.allWorkOrders as Array<{ code: string; title: string }>;
  assert.ok(Array.isArray(allOrders));

  const totalExpectedTickets = PERSONAS.reduce((sum, p) => sum + p.tickets.length, 0);
  assert.strictEqual(allOrders.length, totalExpectedTickets);

  // Verifies core ticket codes are present
  assert.ok(allOrders.some((t) => t.code === "W-3321"));
  assert.ok(allOrders.some((t) => t.code === "W-3318"));
  assert.ok(allOrders.some((t) => t.code === "T-118"));
  assert.ok(allOrders.some((t) => t.code === "P-1042"));
});

test("Frontline Retriever: Training query isolates Priya's certification status", () => {
  const ctx = retrieveMockRecords("Priya's training summary");
  assert.strictEqual(ctx.category, "training");
  const records = ctx.records.operatorTrainingRecords as typeof MOCK_TRAINING_RECORDS;
  assert.ok(Array.isArray(records));
  assert.strictEqual(records[0].name, "Priya S.");
  assert.strictEqual(records[0].certifications.find((c) => c.name === "Forklift basics")?.certified, true);
  assert.strictEqual(records[0].certifications.find((c) => c.name === "Chemical handling")?.certified, false);
});

// =========================================================================
// 5. API ROUTE (/api/frontline/chat) CONTRACT & GUARDRAILS
// =========================================================================

test("Frontline Chat API: Rejects empty query with HTTP 400", async () => {
  const req = new NextRequest("http://localhost:3000/api/frontline/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: "   " }),
  });

  const res = await handleFrontlineChat(req);
  assert.strictEqual(res.status, 400);
  const data = await res.json();
  assert.ok(data.error.includes("cannot be empty"));
});

test("Frontline Chat API: Path A request returns scenario without calling Gemini", async () => {
  const req = new NextRequest("http://localhost:3000/api/frontline/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: "When was the press oil last changed?" }),
  });

  const res = await handleFrontlineChat(req);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.path, "PATH_A");
  assert.strictEqual(data.scenario, "oil_history");
});

test("Frontline Chat API: Path C request returns exact guardrail text without calling Gemini", async () => {
  const req = new NextRequest("http://localhost:3000/api/frontline/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: "banana spaceship purple" }),
  });

  const res = await handleFrontlineChat(req);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.path, "PATH_C");
  assert.strictEqual(data.text, FRONTLINE_GUARDRAIL_MESSAGE);
});

test("Frontline Chat API: Path B when Gemini unavailable returns recoverable 503 error, never fake summary", async () => {
  const req = new NextRequest("http://localhost:3000/api/frontline/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: "Summarize the current shift." }),
  });

  const res = await handleFrontlineChat(req);
  // In dev / test environment without live credentials, Vertex AI fails gracefully with 503
  if (res.status === 503) {
    const data = await res.json();
    assert.ok(data.error.includes("unavailable"));
    assert.ok(data.details);
  } else {
    // If live credentials happened to be present
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.path, "PATH_B");
    assert.ok(typeof data.text === "string");
  }
});

// =========================================================================
// 6. PLAIN-TEXT FORMATTING & MARKDOWN STRIPPING (REQUIREMENT 6)
// =========================================================================

test("Plain-text Formatter: Strips asterisks (**bold**) without leaving literal characters", () => {
  const input = "**Priority Anomalies & Equipment Drift:**\n• **Press 3 (Line 2):** Hydraulic temp drifting.";
  const formatted = formatFrontlinePlainText(input);
  assert.ok(!formatted.includes("**"));
  assert.ok(!formatted.includes("*"));
  assert.ok(formatted.includes("Priority Anomalies & Equipment Drift:"));
  assert.ok(formatted.includes("Press 3 (Line 2): Hydraulic temp drifting."));
});

test("Plain-text Formatter: Strips Markdown headings (# and ##) cleanly", () => {
  const input = "# Plant Overview\n## Urgent Work Orders\n• All systems running.";
  const formatted = formatFrontlinePlainText(input);
  assert.ok(!formatted.includes("#"));
  assert.ok(formatted.includes("Plant Overview"));
  assert.ok(formatted.includes("Urgent Work Orders"));
});

test("Plain-text Formatter: Strips inline backticks (`code`) around identifiers", () => {
  const input = "Work order `W-3318` on `Press 3` cites `SOP-HYD-11`.";
  const formatted = formatFrontlinePlainText(input);
  assert.ok(!formatted.includes("`"));
  assert.strictEqual(formatted, "Work order W-3318 on Press 3 cites SOP-HYD-11.");
});

test("Plain-text Formatter: Converts asterisk bullets (* item) to clean bullets (• item)", () => {
  const input = "* Press 3 is drifting\n* Tool Crib B is low on inserts";
  const formatted = formatFrontlinePlainText(input);
  assert.ok(!formatted.includes("*"));
  assert.ok(formatted.includes("• Press 3 is drifting"));
  assert.ok(formatted.includes("• Tool Crib B is low on inserts"));
});

test("Plain-text Formatter: Preserves equipment IDs, ticket codes, units, and numbers intact", () => {
  const input = `**Equipment & Orders:**
• **Press 3:** +13° thermal drift (Ticket \`W-3318\`, started at 09:12).
• **Engine Line 2:** Torque 6 bolts to 45 Nm (\`W-3321\`, DUE TODAY 14:00).
• **Tool Crib B:** 3 CNMG 432 inserts on hand (reorder 12, draft \`PO-1042\` for 50 pcs).
• **Cage D:** 2 pails of ISO 46 oil.`;

  const formatted = formatFrontlinePlainText(input);

  // Verifies all markdown symbols are removed
  assert.ok(!formatted.includes("**"));
  assert.ok(!formatted.includes("`"));

  // Verifies all operational facts, identifiers, and units are preserved
  assert.ok(formatted.includes("Press 3"));
  assert.ok(formatted.includes("+13°"));
  assert.ok(formatted.includes("W-3318"));
  assert.ok(formatted.includes("09:12"));
  assert.ok(formatted.includes("Engine Line 2"));
  assert.ok(formatted.includes("45 Nm"));
  assert.ok(formatted.includes("W-3321"));
  assert.ok(formatted.includes("14:00"));
  assert.ok(formatted.includes("Tool Crib B"));
  assert.ok(formatted.includes("3 CNMG 432 inserts"));
  assert.ok(formatted.includes("reorder 12"));
  assert.ok(formatted.includes("PO-1042"));
  assert.ok(formatted.includes("50 pcs"));
  assert.ok(formatted.includes("Cage D"));
  assert.ok(formatted.includes("2 pails of ISO 46 oil"));
});

test("Plain-text Formatter: Preserves existing scripted guardrail message unchanged", () => {
  const formatted = formatFrontlinePlainText(FRONTLINE_GUARDRAIL_MESSAGE);
  assert.strictEqual(formatted, FRONTLINE_GUARDRAIL_MESSAGE);
});

test("Plain-text Formatter: Preserves existing scripted oil history message unchanged", () => {
  const cannedMsg = "Here's the last change — straight from the floor record.";
  const formatted = formatFrontlinePlainText(cannedMsg);
  assert.strictEqual(formatted, cannedMsg);
});


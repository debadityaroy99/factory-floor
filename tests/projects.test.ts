import assert from "node:assert";
import test from "node:test";
import {
  createProjectRecord,
  deleteProjectRecord,
  listProjectRecords,
  getProjectRecord,
  addRunToProject,
  seedMockProjectsIfEmpty,
} from "../lib/db/projects";
import { DEFAULT_MOCK_PROJECTS } from "../lib/types/projects";

test("Projects Repository: Seeds default mock projects and lists them", async () => {
  const { config } = await import("../lib/config");
  config.useMockServices = true;

  // 1. List projects should return the mock projects
  const projects = await listProjectRecords();
  assert.ok(Array.isArray(projects));
  assert.ok(projects.length >= 6);

  const clevisProject = projects.find((p) => p.id === "proj-clevis");
  assert.ok(clevisProject);
  assert.strictEqual(clevisProject.name, "Clevis bracket — Line 2 cell");
  assert.strictEqual(clevisProject.status, "IN REVIEW");
});

test("Projects Repository: Creates a new project with Cloud Storage & Firestore persistence", async () => {
  const { config } = await import("../lib/config");
  config.useMockServices = true;

  const testName = `Hydraulic Valve Manifold ${Date.now()}`;
  const dummyBuffer = Buffer.from("ISO-10303-21; CAD GEOMETRY DATA");

  // 1. Create project with attached file
  const created = await createProjectRecord({
    name: testName,
    chipType: "step",
    file: {
      buffer: dummyBuffer,
      fileName: "valve_manifold.step",
      contentType: "application/octet-stream",
    },
  });

  assert.ok(created);
  assert.ok(created.id.startsWith("proj-"));
  assert.strictEqual(created.name, testName);
  assert.strictEqual(created.thumb, "sheet");
  assert.strictEqual(created.status, "DRAFT");
  assert.ok(created.storageUri);
  assert.strictEqual(created.sourceFileName, "valve_manifold.step");

  // 2. Retrieve project by ID
  const retrieved = await getProjectRecord(created.id);
  assert.ok(retrieved);
  assert.strictEqual(retrieved.id, created.id);
  assert.strictEqual(retrieved.name, testName);

  // 3. Listed projects contains newly created project
  const allProjects = await listProjectRecords();
  const found = allProjects.find((p) => p.id === created.id);
  assert.ok(found);

  // 4. Delete project
  const deleted = await deleteProjectRecord(created.id);
  assert.strictEqual(deleted, true);

  // 5. Verify no longer exists
  const afterDelete = await getProjectRecord(created.id);
  assert.strictEqual(afterDelete, null);

  const updatedProjects = await listProjectRecords();
  assert.strictEqual(updatedProjects.some((p) => p.id === created.id), false);
});

test("Projects Repository: Adds module runs to a project and persists to Storage & Firestore", async () => {
  const { config } = await import("../lib/config");
  config.useMockServices = true;

  const testName = `Project For Run Test ${Date.now()}`;
  const created = await createProjectRecord({
    name: testName,
    chipType: "step",
  });

  assert.ok(created);
  assert.strictEqual(created.runs.autodraft, 0);
  assert.strictEqual(created.runs.di, 0);
  assert.strictEqual(created.runsList.length, 0);

  // Add an Autodraft run
  const withAutodraft = await addRunToProject({
    projectId: created.id,
    moduleName: "AUTODRAFT",
    moduleCode: "01-autodraft",
    runTitle: "STEP to drawing · clevis.step",
    fileName: "clevis.step",
    result: "DRAWING GENERATED",
    resultType: "clear",
    runId: "run-ad-123",
  });

  assert.strictEqual(withAutodraft.runs.autodraft, 1);
  assert.strictEqual(withAutodraft.runsList.length, 1);
  assert.strictEqual(withAutodraft.runsList[0].moduleName, "AUTODRAFT");
  assert.strictEqual(withAutodraft.runsList[0].result, "DRAWING GENERATED");
  assert.ok(withAutodraft.runsList[0].storageUri);

  // Add a Design Intelligence run with issues
  const withDI = await addRunToProject({
    projectId: created.id,
    moduleName: "DESIGN INTELLIGENCE",
    moduleCode: "02-design-intelligence",
    runTitle: "Missing-dimension review",
    fileName: "D1000130-DIFFUSER-PLATE.pdf",
    result: "4 OPEN ISSUES",
    resultType: "error",
  });

  assert.strictEqual(withDI.runs.autodraft, 1);
  assert.strictEqual(withDI.runs.di, 1);
  assert.strictEqual(withDI.runsList.length, 2);
  assert.strictEqual(withDI.status, "ISSUES OPEN");
  assert.strictEqual(withDI.findings, "4 OPEN ISSUES");

  // Clean up
  await deleteProjectRecord(created.id);
});



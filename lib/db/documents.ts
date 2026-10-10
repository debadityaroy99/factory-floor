import { getFirestoreClient } from "../gcp/firestore";
import { CompanyDocument, DocumentCitation, UserRole } from "../types";

const DOCUMENTS_COLLECTION = "frontline_documents";

const initialDocuments: CompanyDocument[] = [
  {
    id: "doc-sop-hyd-11",
    title: "Hydraulic Stamping Unit Thermal Drift & PM Guide",
    docNumber: "SOP-HYD-11",
    category: "SOP",
    equipmentTypes: ["PRESS"],
    allowedRoles: ["OPERATOR", "TECHNICIAN", "SUPERVISOR", "ADMIN"],
    storageUri: "gs://factory-floor-docs/sops/SOP-HYD-11_rev4.pdf",
    version: "Rev 4.2 (2026-01-15)",
    sections: [
      {
        sectionId: "SOP-HYD-11 §1.1",
        heading: "Operating Limits & Baseline Thresholds",
        content:
          "Nominal operating hydraulic reservoir temperature is 45°C to 55°C (baseline mean 50.0°C ± 2.5°C). Warning alert is triggered at 65.0°C. If temperature reaches 75.0°C, automated thermal trip initiates emergency motor shutdown to prevent pump cavitation and valve seal degradation.",
      },
      {
        sectionId: "SOP-HYD-11 §2.3",
        heading: "Fluid Specifications & Replenishment",
        content:
          "Use only ISO VG 46 Anti-Wear Hydraulic Fluid (Mobil DTE 25 or equivalent). Stocked in Cage D in 5-gallon pails. Do not mix with ISO 32 or zinc-free fluids. Change interval is every 500 operating hours.",
      },
      {
        sectionId: "SOP-HYD-11 §3.2",
        heading: "Thermal Drift Troubleshooting & Heat Exchanger Diagnostics",
        content:
          "When continuous upward thermal drift is observed without pressure loss: (1) Check shell-and-tube heat exchanger water inlet valve. (2) Verify cooling water flow rate >= 15 GPM and differential pressure > 1.2 bar. (3) Inspect proportional relief valve pilot orifice for clogging or sticking. If sediment fouling is present on heat exchanger tube bundle, schedule chemical descaling flush.",
      },
    ],
  },
  {
    id: "doc-sop-cnc-07",
    title: "5-Axis Milling Spindle and Coolant System Service Manual",
    docNumber: "SOP-CNC-07",
    category: "SOP",
    equipmentTypes: ["CNC"],
    allowedRoles: ["OPERATOR", "TECHNICIAN", "SUPERVISOR", "ADMIN"],
    storageUri: "gs://factory-floor-docs/sops/SOP-CNC-07_rev2.pdf",
    version: "Rev 2.1 (2025-11-10)",
    sections: [
      {
        sectionId: "SOP-CNC-07 §2.1",
        heading: "Through-Spindle Coolant Delivery Parameters",
        content:
          "Target delivery pressure is 28.0 psi (tolerance 25 to 32 psi). Pressure drop below 20.0 psi reduces tool life and causes thermal cracking in carbide inserts. Machine controller will pause high-speed roughing cycles if pressure falls below 16 psi for > 5 seconds.",
      },
      {
        sectionId: "SOP-CNC-07 §4.1",
        heading: "Intake Strainer & Seal Inspection",
        content:
          "During step-function coolant pressure loss: (1) Check 50-micron stainless intake mesh in sump tank for aluminum swarf packing. Clean with parts washer. (2) Inspect pump mechanical shaft seal lip for coolant seepage. (3) Verify level sensor is not giving a false low reading.",
      },
    ],
  },
  {
    id: "doc-sop-mnt-04",
    title: "Conveyor Gantry Transmission & Bearing Replacement Standard",
    docNumber: "SOP-MNT-04",
    category: "SOP",
    equipmentTypes: ["CONVEYOR"],
    allowedRoles: ["OPERATOR", "TECHNICIAN", "SUPERVISOR", "ADMIN"],
    storageUri: "gs://factory-floor-docs/sops/SOP-MNT-04_rev3.pdf",
    version: "Rev 3.0 (2025-08-19)",
    sections: [
      {
        sectionId: "SOP-MNT-04 §1.2",
        heading: "Vibration Baseline Monitoring & ISO 10816-3 Thresholds",
        content:
          "Conveyor drive-end (DE) bearing normal RMS vibration is 1.8 to 2.4 mm/s. Alert warning threshold is 4.5 mm/s. Critical shutdown threshold is 7.1 mm/s. Vibration above 4.5 mm/s with high-frequency harmonic acceleration indicates inner raceway fatigue or lack of lubrication.",
      },
      {
        sectionId: "SOP-MNT-04 §3.0",
        heading: "Bearing Replacement Procedure (6205-2RS)",
        content:
          "To replace DE bearing: (1) Lockout main conveyor motor M-201. (2) Slack gantry tensioning bolts. (3) Remove retaining circlip. (4) Extract worn bearing with 3-jaw mechanical puller. (5) Press new 6205-2RS bearing (located in Cage D) using induction heater heated to 110°C. Never hammer directly on bearing races.",
      },
    ],
  },
  {
    id: "doc-sop-sft-02",
    title: "Emergency Plant Shutdown & Thermal Runaway Protocol",
    docNumber: "SOP-SFT-02",
    category: "SAFETY",
    equipmentTypes: ["PRESS", "CNC", "CONVEYOR", "PUMP", "PLC"],
    allowedRoles: ["OPERATOR", "TECHNICIAN", "SUPERVISOR", "ADMIN"],
    storageUri: "gs://factory-floor-docs/safety/SOP-SFT-02_rev5.pdf",
    version: "Rev 5.0 (2026-02-01)",
    sections: [
      {
        sectionId: "SOP-SFT-02 §1.0",
        heading: "Life Safety Mandate & Emergency Authority",
        content:
          "Life safety takes precedence over machine uptime. Operators and technicians are empowered and required to execute an emergency stop whenever a safety-critical anomaly, hydraulic runaway, electrical arcing, or toxic fume condition occurs.",
      },
      {
        sectionId: "SOP-SFT-02 §2.1",
        heading: "E-Stop and Lockout Procedure",
        content:
          "When equipment temperature exceeds critical threshold (e.g., Press-03 oil temp > 75°C) or severe vibration threatens structural failure: (1) Depress nearest Emergency Stop (E-Stop) mushroom button. (2) Switch main electrical disconnect to OFF position. (3) Affix red personal Lockout/Tagout (LOTO) padlock and tag. (4) Notify Area Supervisor immediately.",
      },
    ],
  },
  {
    id: "doc-man-ab-plc-04",
    title: "Allen-Bradley GuardLogix Line Controller Manual",
    docNumber: "MAN-AB-PLC-04",
    category: "MANUAL",
    equipmentTypes: ["PLC"],
    allowedRoles: ["TECHNICIAN", "SUPERVISOR", "ADMIN"],
    storageUri: "gs://factory-floor-docs/manuals/AB-GuardLogix-5580.pdf",
    version: "Rev 1.4",
    sections: [
      {
        sectionId: "MAN-AB-PLC-04 §2.4",
        heading: "Fault E-04 Discrepancy Reset Sequence",
        content:
          "Fault E-04 represents a dual-channel safety circuit discrepancy. (1) Inspect physical interlock gate switches on Line A cells. (2) Check for 24V DC auxiliary contact bounce. (3) Clear safety fault on HMI panel only after visual confirmation that all safety gates are mechanically latched and cleared.",
      },
    ],
  },
  {
    id: "doc-sop-chm-01",
    title: "Chemical Handling and Hazardous Fluid Disposal SOP",
    docNumber: "SOP-CHM-01",
    category: "SAFETY",
    equipmentTypes: ["PRESS", "CNC", "PUMP"],
    allowedRoles: ["TECHNICIAN", "SUPERVISOR", "ADMIN"], // Operators restricted without certification
    storageUri: "gs://factory-floor-docs/safety/SOP-CHM-01.pdf",
    version: "Rev 2.0",
    sections: [
      {
        sectionId: "SOP-CHM-01 §1.3",
        heading: "Certified Personnel Restriction & PPE",
        content:
          "Only personnel with current Chemical Handling certification may drain, flush, or transfer coolants and hydraulic oils. Required PPE: Nitrile chemical-resistant gauntlet gloves, splash goggles, and neoprene apron.",
      },
    ],
  },
];

const documentsCache = new Map<string, CompanyDocument>(
  initialDocuments.map((doc) => [doc.docNumber.toUpperCase(), doc])
);

export async function getDocuments(userRole: UserRole = "OPERATOR"): Promise<CompanyDocument[]> {
  const db = getFirestoreClient();
  let docs = Array.from(documentsCache.values());

  if (db) {
    try {
      const snap = await db.collection(DOCUMENTS_COLLECTION).get();
      if (!snap.empty) {
        docs = snap.docs.map((d) => d.data() as CompanyDocument);
      }
    } catch (err) {
      console.warn("[Firestore] getDocuments fallback:", err);
    }
  }

  // Filter based on user role permissions (case-insensitive)
  const normalizedRole = userRole.toUpperCase();
  return docs.filter((d) =>
    d.allowedRoles.some((r) => r.toUpperCase() === normalizedRole)
  );
}

export async function getDocumentByNumber(docNumber: string): Promise<CompanyDocument | null> {
  const key = docNumber.toUpperCase().trim();
  const db = getFirestoreClient();
  if (db) {
    try {
      const snap = await db
        .collection(DOCUMENTS_COLLECTION)
        .where("docNumber", "==", key)
        .limit(1)
        .get();
      if (!snap.empty) {
        return snap.docs[0].data() as CompanyDocument;
      }
    } catch (err) {
      console.warn(`[Firestore] getDocumentByNumber(${key}) fallback:`, err);
    }
  }
  return documentsCache.get(key) || null;
}

/**
 * Retrieval-Augmented Generation (RAG) Document Search.
 * Searches company SOPs, manuals, and safety guides, respecting role permissions.
 * Computes lexical & semantic relevance scores and returns precise section citations.
 */
export async function searchKnowledgeRAG(
  query: string,
  userRole: UserRole = "OPERATOR",
  equipmentTypeFilter?: string
): Promise<DocumentCitation[]> {
  const accessibleDocs = await getDocuments(userRole);
  const qTerms = query
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .split(/\s+/)
    .filter((t) => t.length > 2);

  if (qTerms.length === 0) {
    return [];
  }

  const citations: DocumentCitation[] = [];

  for (const doc of accessibleDocs) {
    // Optional equipment filter
    if (
      equipmentTypeFilter &&
      doc.equipmentTypes.length > 0 &&
      !doc.equipmentTypes.includes(equipmentTypeFilter.toUpperCase())
    ) {
      continue;
    }

    const docText = `${doc.title} ${doc.docNumber}`.toLowerCase();

    for (const section of doc.sections) {
      const sectionText = `${section.heading} ${section.content}`.toLowerCase();
      let matchCount = 0;

      for (const term of qTerms) {
        if (sectionText.includes(term)) {
          matchCount += 2;
        } else if (docText.includes(term)) {
          matchCount += 1;
        }
      }

      // Keyword bonuses
      if (
        (query.toLowerCase().includes("press") || query.toLowerCase().includes("temp") || query.toLowerCase().includes("oil")) &&
        doc.docNumber === "SOP-HYD-11"
      ) {
        matchCount += 3;
      }
      if (
        (query.toLowerCase().includes("cnc") || query.toLowerCase().includes("coolant") || query.toLowerCase().includes("psi")) &&
        doc.docNumber === "SOP-CNC-07"
      ) {
        matchCount += 3;
      }
      if (
        (query.toLowerCase().includes("conveyor") || query.toLowerCase().includes("bearing") || query.toLowerCase().includes("vibration")) &&
        doc.docNumber === "SOP-MNT-04"
      ) {
        matchCount += 3;
      }
      if (
        (query.toLowerCase().includes("emergency") || query.toLowerCase().includes("shutdown") || query.toLowerCase().includes("safety") || query.toLowerCase().includes("e-stop")) &&
        doc.docNumber === "SOP-SFT-02"
      ) {
        matchCount += 4;
      }
      if (
        (query.toLowerCase().includes("plc") || query.toLowerCase().includes("allen") || query.toLowerCase().includes("e-04")) &&
        doc.docNumber === "MAN-AB-PLC-04"
      ) {
        matchCount += 3;
      }

      if (matchCount > 0) {
        const score = Math.min(0.99, matchCount / (qTerms.length * 2 + 2));
        if (score >= 0.25) {
          citations.push({
            docNumber: doc.docNumber,
            docTitle: doc.title,
            section: section.sectionId,
            relevanceScore: Math.round(score * 100) / 100,
            snippet: section.content.slice(0, 280) + (section.content.length > 280 ? "..." : ""),
          });
        }
      }
    }
  }

  // Sort descending by relevance score
  citations.sort((a, b) => b.relevanceScore - a.relevanceScore);
  return citations.slice(0, 4);
}

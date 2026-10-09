"use client";

import { ArchitectHero } from "./components/ArchitectHero";
import { FeatureWorkflowSections } from "./components/FeatureWorkflowSections";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f4ebd7]">
      <ArchitectHero brandName="Manufy" />
      <FeatureWorkflowSections />
    </main>
  );
}

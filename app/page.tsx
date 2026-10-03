"use client";

import { ArchitectHero } from "./components/ArchitectHero";

export default function Home() {
  return (
    <main
      id="scroll-story-track"
      className="relative w-full min-h-[450vh] bg-[#f4ebd7] bg-drafting-grid text-[#292929] overflow-x-hidden selection:bg-[#124ead]/20 selection:text-[#124ead]"
    >
      {/* 
        Sticky Hero Viewport:
        Pinned full-screen while the user scrolls through the 450vh narrative.
        The HTML5 canvas sequence in the cinematic window smoothly scrubs
        through all 300 frames from the drafting blueprint to autonomous factory intelligence.
      */}
      <div className="sticky top-0 left-0 w-full h-screen overflow-hidden flex flex-col justify-between">
        <ArchitectHero brandName="[YOUR BRAND NAME]" />
      </div>
    </main>
  );
}

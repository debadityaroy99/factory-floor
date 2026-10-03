"use client";

import { ArchitectHero } from "./components/ArchitectHero";
import { ScrollSequenceCanvas } from "./components/ScrollSequenceCanvas";

export default function Home() {
  return (
    <main className="relative bg-[#0c0d12] text-[#292929] overflow-x-hidden">
      {/* 
        Scroll-Linked Cinematic Sequence Canvas:
        Full-screen sticky HTML5 canvas pinned across tall h-[450vh] scroll track.
        Maps 0% scroll -> frame 1 and 100% scroll -> frame 300.
      */}
      <ScrollSequenceCanvas totalFrames={300} frameDir="/frames" framePrefix="frame-">
        <ArchitectHero brandName="[YOUR BRAND NAME]" transparentBg={true} />
      </ScrollSequenceCanvas>
    </main>
  );
}

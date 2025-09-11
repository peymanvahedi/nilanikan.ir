// src/components/tour/HelpFab.tsx
"use client";

import { useTour } from "@/components/tour/TourProvider";

export default function HelpFab() {
  const { start, isOpen } = useTour();
  if (isOpen) return null;

  return (
    <button
      onClick={() => start()}
      aria-label="راهنما"
      className="guide-button"
    >
      <span className="text-2xl font-black">?</span>
    </button>
  );
}

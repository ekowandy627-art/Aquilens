"use client";

import { useEffect, useState } from "react";

export function useAutosaveIndicator(lastSavedAt: Date | null) {
  const [elapsedSeconds, setElapsedSeconds] = useState(lastSavedAt ? 1 : 0);

  useEffect(() => {
    if (!lastSavedAt) {
      return;
    }
    const interval = window.setInterval(() => {
      setElapsedSeconds((value) => value + 1);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [lastSavedAt]);

  if (!lastSavedAt) {
    return "Not saved yet";
  }
  const seconds = Math.max(1, elapsedSeconds);
  return `Last saved ${seconds}s ago`;
}

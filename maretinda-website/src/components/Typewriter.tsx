"use client";

import { useState, useEffect, useRef } from "react";

const words = ["Amplified.", "Unstoppable.", "Reimagined.", "Limitless.", "Future-Proof."];

export default function Typewriter() {
  const [displayed, setDisplayed] = useState("");
  const [idx, setIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [paused, setPaused] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (paused) return;

    const word = words[idx];

    if (!deleting && displayed === word) {
      setPaused(true);
      timeout.current = setTimeout(() => {
        setDeleting(true);
        setPaused(false);
      }, 2000);
      return;
    }

    if (deleting && displayed === "") {
      setDeleting(false);
      setIdx((i) => (i + 1) % words.length);
      return;
    }

    const speed = deleting ? 55 : 90;
    timeout.current = setTimeout(() => {
      setDisplayed(
        deleting
          ? word.slice(0, displayed.length - 1)
          : word.slice(0, displayed.length + 1)
      );
    }, speed);

    return () => { if (timeout.current) clearTimeout(timeout.current); };
  }, [displayed, idx, deleting, paused]);

  return (
    <span className="gradient-text-gold">
      {displayed}
      <span
        className="inline-block w-[3px] h-[0.8em] ml-1 align-middle rounded-sm"
        style={{
          background: "#FFC533",
          animation: "cursorBlink 1s step-end infinite",
          verticalAlign: "middle",
        }}
      />
    </span>
  );
}

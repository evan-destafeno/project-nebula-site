"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

type HintState = "hidden" | "visible" | "exiting";

function canScrollMore(threshold = 80) {
  return document.documentElement.scrollHeight > window.innerHeight + threshold;
}

function isNearBottom(threshold = 60) {
  return (
    window.innerHeight + window.scrollY >=
    document.documentElement.scrollHeight - threshold
  );
}

export function ScrollHint() {
  const [state, setState] = useState<HintState>("hidden");
  const stateRef = useRef<HintState>("hidden");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    // Reset on every navigation
    if (timerRef.current) clearTimeout(timerRef.current);
    stateRef.current = "hidden";
    setState("hidden");

    function set(s: HintState) {
      stateRef.current = s;
      setState(s);
    }

    function scheduleShow() {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (!canScrollMore()) return;
      timerRef.current = setTimeout(() => {
        if (stateRef.current === "hidden" && !isNearBottom()) set("visible");
      }, 1000);
    }

    function exit() {
      set("exiting");
      timerRef.current = setTimeout(() => {
        set("hidden");
        scheduleShow();
      }, 600);
    }

    function onScroll() {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (stateRef.current === "visible") {
        exit();
      } else if (stateRef.current === "hidden") {
        scheduleShow();
      }
    }

    scheduleShow();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [pathname]);

  if (state === "hidden") return null;

  return (
    <div className="scroll-hint-wrap" aria-hidden="true">
      <div className={`scroll-hint scroll-hint--${state}`}>
        <svg
          className="scroll-hint__arrow"
          viewBox="0 0 20 24"
          width="14"
          height="17"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M10 2 L10 18 M3 12 L10 20 L17 12"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

type HintState = "hidden" | "visible" | "exiting";

export function ClickHint() {
  const [state, setState] = useState<HintState>("hidden");
  const stateRef = useRef<HintState>("hidden");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    stateRef.current = "hidden";
    setState("hidden");

    if (pathname !== "/") return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    function set(s: HintState) {
      stateRef.current = s;
      setState(s);
    }

    function exit() {
      set("exiting");
      timerRef.current = setTimeout(() => set("hidden"), 600);
    }

    function onPointerDown() {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (stateRef.current === "visible") exit();
      // if still hidden, cancel the scheduled show — user already knows to click
    }

    timerRef.current = setTimeout(() => {
      if (stateRef.current === "hidden") set("visible");
    }, 3000);

    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [pathname]);

  if (state === "hidden") return null;

  return (
    <div className="scroll-hint-wrap" aria-hidden="true">
      <div className={`scroll-hint scroll-hint--${state}`}>
        {/* Classic arrow cursor pointing top-left */}
        <svg
          className="scroll-hint__arrow click-hint__icon"
          viewBox="0 0 13 15"
          width="13"
          height="15"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M2 1 L2 10.5 L5 8 L6.5 12.5 L8 12 L6.5 7.5 L10 7.5 Z" />
        </svg>
      </div>
    </div>
  );
}

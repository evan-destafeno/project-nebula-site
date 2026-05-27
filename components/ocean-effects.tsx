"use client";

import { useEffect, useRef } from "react";

/**
 * Ocean Effects — Project Nebula
 *
 * Four coupled primitives, three rAF loops:
 *   1. Cursor ball: bone-parchment disc, lagged via spring physics. Grows on
 *      hover over interactive elements, squishes on press.
 *   2. Click pulse: a single hairline ring riding the leading edge of the
 *      submersion reveal.
 *   3. Submersion: drives a clip-path circle on the always-rendered
 *      <UnderwaterBackground /> behind the page surface.
 *   4. Per-letter wave: writes inline `transform` on every .wavy-char each
 *      frame using a hybrid scheme — phase from screen position (so
 *      neighbors share a current) plus a small random jitter (so no two
 *      letters trace the same path). Two incommensurate sin waves summed
 *      per axis means the motion never repeats in human-attention time.
 *
 * Disabled entirely on coarse pointers and prefers-reduced-motion.
 */

const EXPAND_MS = 4000;
const HOLD_MS = 380;
const CONTRACT_MS = 4000;
const TOTAL_MS = EXPAND_MS + HOLD_MS + CONTRACT_MS;
const FAST_RECOVER_MS = 600;

const INTRO_HOLD_MS = 8000; // emergency fallback; letter sequence fires fireIntro at ~3.4 s
const INTRO_COLLAPSE_MS = 1600;

// Letter intro — "PROJECT NEBULA" floats up individually, then zooms to header
const LETTER_STAGGER_START_MS = 700;
const LETTER_STAGGER_GAP_MS = 80;
const LETTER_RISE_MS = 600;
const LETTER_HOLD_MS = 900;
const LETTER_ZOOM_MS = 500;
const INTRO_TEXT = "PROJECT NEBULA";
// P=0 R=1 O=2 J=3 E=4 C=5 T=6 ' '=7 N=8 E=9 B=10 U=11 L=12 A=13
// Interior letters rise first; word anchors (P, A) and the space settle last.
const LETTER_STAGGER_ORDER = [4, 9, 3, 10, 5, 8, 2, 11, 6, 1, 12, 0, 13, 7];

const SPRING = 0.18;
const CURSOR_SIZE = 14;

// Wave parameters. Two periods per axis, deliberately incommensurate so the
// summed signal doesn't loop within a human attention window. x/y/r share
// the per-letter phase but use distinct ωs and constant offsets so the axes
// don't move in lockstep (which would read as mechanical).
const OMEGA_Y1 = (2 * Math.PI) / 2.7;
const OMEGA_Y2 = (2 * Math.PI) / 1.9;
const OMEGA_X1 = (2 * Math.PI) / 3.1;
const OMEGA_X2 = (2 * Math.PI) / 2.3;
const OMEGA_R = (2 * Math.PI) / 2.2;
const AMP_Y1 = 4.5;
const AMP_Y2 = 4.5;
const AMP_X1 = 1.5;
const AMP_X2 = 1.5;
const AMP_R = 4; // degrees
const PHASE_Y2 = Math.PI / 3;
const PHASE_X1 = Math.PI / 2;
const PHASE_X2 = Math.PI;
const PHASE_R = Math.PI / 4;

// Spatial frequencies for the position-driven phase component. Chosen so a
// shift of ~350px across the page corresponds to roughly π of phase — the
// wave reads as propagating across the page over distances of that scale.
const SPATIAL_KX = 0.018;
const SPATIAL_KY = 0.014;

// Width of the feather band (px) applied only during the contract phase.
// Letters start fading as the cover circle approaches within this distance.
const FEATHER = 60;

// Soft-edge width (px) on the cover's radial gradient — the "losing vision"
// vignette. Larger = wider fade-out band at the advancing cover edge.
const COVER_FEATHER = 280;
const INTRO_FEATHER = 280;


export function OceanEffects() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const coverRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const root = document.documentElement;
    const fineQuery = window.matchMedia("(pointer: fine)");
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!fineQuery.matches || motionQuery.matches) {
      root.classList.add("intro-complete");
      return;
    }

    const cursor = cursorRef.current;
    const cover = coverRef.current;
    const ring = ringRef.current;
    if (!cursor || !cover || !ring) return;
    // Drive clip-path via direct inline style on the underwater layer instead
    // of cascading custom properties from <html>. Root-level CSS-var writes
    // invalidate styles on every descendant in Firefox; at 60Hz with hundreds
    // of .wavy-char descendants that's a guaranteed jank source.
    const underwater = document.querySelector<HTMLDivElement>(
      ".underwater-background",
    );

    const isHeroPage = window.location.pathname === "/";
    root.classList.add("ocean-enabled");
    if (!isHeroPage) {
      root.classList.add("intro-complete");
      if (underwater) underwater.style.clipPath = "circle(0px at 50% 50%)";
    } else {
      if (underwater) underwater.style.clipPath = "none";
      cover.style.opacity = "1";
      cover.style.maskImage = "radial-gradient(circle at 50% 50%, transparent 0px, transparent 100%)";
    }

    // ── Letter intro overlay (hero page only) ────────────────────────────
    let overlay: HTMLDivElement | undefined;
    let group: HTMLDivElement | undefined;
    const letterSpans: HTMLElement[] = [];
    const letterTimers: number[] = [];
    let zoomHandle = 0;
    let zoomFired = false;

    if (isHeroPage) {
      overlay = document.createElement("div");
      overlay.setAttribute("aria-hidden", "true");
      overlay.style.cssText =
        "position:fixed;inset:0;z-index:15;display:flex;" +
        "align-items:center;justify-content:center;pointer-events:none;";

      group = document.createElement("div");
      group.style.cssText =
        "font-family:var(--font-geist-sans),system-ui,sans-serif;" +
        "font-weight:700;" +
        "font-size:clamp(3rem,6vw,5rem);" +
        "letter-spacing:0.22em;" +
        "color:var(--ink-strong);" +
        "text-transform:uppercase;" +
        "display:flex;" +
        "align-items:baseline;" +
        "white-space:nowrap;" +
        "transform-origin:center center;" +
        "will-change:transform,opacity;";

      for (const char of INTRO_TEXT) {
        const s = document.createElement("span");
        s.textContent = char;
        s.style.cssText =
          "display:inline-block;opacity:0;" +
          "transform:translateY(60px);" +
          "will-change:transform,opacity;";
        group.appendChild(s);
        letterSpans.push(s);
      }

      overlay.appendChild(group);
      document.body.appendChild(overlay);

      LETTER_STAGGER_ORDER.forEach((charIdx, pos) => {
        const delay = LETTER_STAGGER_START_MS + pos * LETTER_STAGGER_GAP_MS;
        letterTimers.push(
          window.setTimeout(() => {
            const span = letterSpans[charIdx];
            span.style.transition =
              `transform ${LETTER_RISE_MS}ms cubic-bezier(0.16,1,0.3,1),` +
              `opacity ${LETTER_RISE_MS}ms cubic-bezier(0.16,1,0.3,1)`;
            span.style.opacity = "1";
            span.style.transform = "translateY(0)";
          }, delay),
        );
      });

      // All letters finish rising at:
      // LETTER_STAGGER_START_MS + (n-1)*GAP + RISE = 700 + 13*80 + 600 = 2340ms
      const allSettledMs =
        LETTER_STAGGER_START_MS +
        (LETTER_STAGGER_ORDER.length - 1) * LETTER_STAGGER_GAP_MS +
        LETTER_RISE_MS;

      zoomHandle = window.setTimeout(
        () => { startLetterZoom(false); },
        allSettledMs + LETTER_HOLD_MS, // 2340 + 900 = 3240ms
      );
    }

    // ── Per-letter wave (position-driven phase) ──────────────────────
    type Letter = { el: HTMLElement; cx: number; cy: number; phase: number };
    const letters: Letter[] = [];

    const measureLetters = () => {
      letters.length = 0;
      document.querySelectorAll<HTMLElement>(".wavy-char").forEach((el) => {
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2 + window.scrollX;
        const cy = r.top + r.height / 2 + window.scrollY;
        letters.push({
          el,
          cx,
          cy,
          phase: SPATIAL_KX * cx + SPATIAL_KY * cy,
        });
      });
    };
    measureLetters();

    // Recompute positions on resize; debounce via rAF so a continuous resize
    // doesn't thrash layout.
    let resizeRaf = 0;
    const onResize = () => {
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => {
        measureLetters();
        resizeRaf = 0;
      });
    };
    window.addEventListener("resize", onResize);

    let waveActive = false;
    let waveStart = 0;
    let waveRaf = 0;

    const tickWave = () => {
      if (!waveActive) {
        waveRaf = 0;
        return;
      }
      const elapsed = performance.now() - waveStart;
      let amp: number;
      if (elapsed < EXPAND_MS) {
        amp = 1;
      } else if (elapsed < EXPAND_MS + HOLD_MS) {
        amp = 1;
      } else if (elapsed < EXPAND_MS + HOLD_MS + contractMs) {
        const tt = (elapsed - EXPAND_MS - HOLD_MS) / contractMs;
        amp = 1 - tt;
      } else {
        // End of reveal: clear inline transforms and stop the loop.
        for (let i = 0; i < letters.length; i++) {
          letters[i].el.style.transform = "";
        }
        waveActive = false;
        waveRaf = 0;
        return;
      }

      const t = elapsed / 1000;
      const yT1 = OMEGA_Y1 * t;
      const yT2 = OMEGA_Y2 * t;
      const xT1 = OMEGA_X1 * t;
      const xT2 = OMEGA_X2 * t;
      const rT = OMEGA_R * t;

      // Expand: hard clip — letters snap into waving as the circle edge sweeps
      // over them. Contract: soft feather — letters fade out as the cover circle
      // advances from the origin over FEATHER px.
      const contracting = elapsed > EXPAND_MS + HOLD_MS;

      // Hot loop: classic for to keep V8/SpiderMonkey on the fast path.
      for (let i = 0; i < letters.length; i++) {
        const l = letters[i];
        const p = l.phase;
        const dist = Math.hypot(l.cx - pulseX, l.cy - pulseY);
        const mask = contracting
          ? Math.max(0, Math.min(1, (dist - coverRadius) / FEATHER))
          : dist <= pulseRadius ? 1 : 0;
        const localAmp = amp * mask;
        if (localAmp < 0.001) {
          if (l.el.style.transform) l.el.style.transform = "";
          continue;
        }
        const y =
          (Math.sin(yT1 + p) * AMP_Y1 +
            Math.sin(yT2 + p + PHASE_Y2) * AMP_Y2) *
          localAmp;
        const x =
          (Math.sin(xT1 + p + PHASE_X1) * AMP_X1 +
            Math.sin(xT2 + p + PHASE_X2) * AMP_X2) *
          localAmp;
        const r = Math.sin(rT + p + PHASE_R) * AMP_R * localAmp;
        l.el.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${r}deg)`;
      }

      waveRaf = requestAnimationFrame(tickWave);
    };

    // ── Intro state ──────────────────────────────────────────────────
    let introFired = !isHeroPage;
    let introStart = 0;
    let introX = window.innerWidth / 2;
    let introY = window.innerHeight / 2;
    let introRaf = 0;
    let introTimeout = 0;

    // ── Cursor spring ────────────────────────────────────────────────
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let posX = targetX;
    let posY = targetY;
    let primed = false;
    let cursorRaf = 0;
    let scaleTarget = 1;
    let scale = 1;
    let isHovering = false;

    const wakeCursor = () => {
      if (!cursorRaf) cursorRaf = requestAnimationFrame(tickCursor);
    };

    const tickCursor = () => {
      const dx = targetX - posX;
      const dy = targetY - posY;
      posX += dx * SPRING;
      posY += dy * SPRING;
      const sd = scaleTarget - scale;
      scale += sd * 0.26;
      cursor.style.transform =
        `translate3d(${posX - CURSOR_SIZE / 2}px, ${posY - CURSOR_SIZE / 2}px, 0) ` +
        `scale(${scale.toFixed(3)})`;
      const settled =
        Math.abs(dx) < 0.05 && Math.abs(dy) < 0.05 && Math.abs(sd) < 0.005;
      if (settled) {
        cursorRaf = 0;
        return;
      }
      cursorRaf = requestAnimationFrame(tickCursor);
    };

    const isInteractive = (el: EventTarget | null): boolean => {
      if (!(el instanceof Element)) return false;
      return !!el.closest(
        "a, button, [role='button'], [tabindex]:not([tabindex='-1']), input, textarea, select, summary, label",
      );
    };

    const onPointerMove = (e: PointerEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      if (!primed) {
        primed = true;
        posX = targetX;
        posY = targetY;
      }
      const hovering = isInteractive(e.target);
      if (hovering !== isHovering) {
        isHovering = hovering;
        scaleTarget = hovering ? 1.55 : 1;
      }
      wakeCursor();
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      scaleTarget = 0.55;
      wakeCursor();
      if (!introFired) { skipLetterIntro(); return; }
      // No click pulse or wave in site edit mode — clicks are text selection/editing actions
      if (document.body.hasAttribute("data-edit-mode")) return;
      if (introRaf) return;
      if (isHovering) {
        startFastRecovery(FAST_RECOVER_MS);
        return;
      }
      fire(e.clientX, e.clientY);
    };

    const onPointerUp = () => {
      scaleTarget = isHovering ? 1.55 : 1;
      wakeCursor();
    };

    const onPointerLeave = () => {
      cursor.style.opacity = "0";
      primed = false;
    };
    const onPointerEnter = () => {
      if (primed) cursor.style.opacity = "0.94";
    };

    cursor.style.opacity = "0.94";
    cursorRaf = requestAnimationFrame(tickCursor);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);
    document.addEventListener("pointerleave", onPointerLeave);
    document.addEventListener("pointerenter", onPointerEnter);

    // ── Letter intro helpers (function declarations — hoisted) ───────
    function startLetterZoom(skip: boolean) {
      if (zoomFired || !group || !overlay) return;
      zoomFired = true;
      clearTimeout(zoomHandle);

      const duration = skip ? 300 : LETTER_ZOOM_MS;
      const target = document.querySelector<HTMLElement>("[data-wordmark-text]");

      if (target) {
        const gRect = group.getBoundingClientRect();
        const wRect = target.getBoundingClientRect();
        const scale = wRect.width / gRect.width;
        const dx = (wRect.left + wRect.width / 2) - (gRect.left + gRect.width / 2);
        const dy = (wRect.top + wRect.height / 2) - (gRect.top + gRect.height / 2);
        group.style.transition =
          `transform ${duration}ms cubic-bezier(0.25,1,0.5,1),` +
          `opacity ${Math.round(duration * 0.7)}ms ease`;
        group.style.transform = `translate(${dx}px,${dy}px) scale(${scale})`;
        group.style.opacity = "0";
      } else {
        group.style.transition = `opacity ${duration}ms ease`;
        group.style.opacity = "0";
      }

      window.setTimeout(fireIntro, skip ? 150 : 200);
      window.setTimeout(() => { overlay!.remove(); }, duration + 120);
    }

    function skipLetterIntro() {
      letterTimers.forEach(clearTimeout);
      letterTimers.length = 0;
      clearTimeout(zoomHandle);
      for (const s of letterSpans) {
        s.style.transition = "none";
        s.style.opacity = "1";
        s.style.transform = "translateY(0)";
      }
      startLetterZoom(true);
    }

    // ── Intro collapse ───────────────────────────────────────────────
    function tickIntro() {
      const elapsed = performance.now() - introStart;
      const t = Math.min(elapsed / INTRO_COLLAPSE_MS, 1);
      // ease-in-out-quart: patient start, rushes to cursor, gentle close
      const eased = t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
      const diag = Math.hypot(window.innerWidth, window.innerHeight) * 1.42;
      const radius = diag * (1 - eased);
      const innerR = Math.max(0, radius - INTRO_FEATHER);
      if (underwater) {
        underwater.style.clipPath = "none";
        underwater.style.maskImage = `radial-gradient(circle at ${introX}px ${introY}px, black ${innerR}px, transparent ${radius}px)`;
      }
      if (t >= 1) {
        if (underwater) {
          underwater.style.clipPath = "circle(0px at 50% 50%)";
          underwater.style.maskImage = "";
        }
        introRaf = 0;
        return;
      }
      introRaf = requestAnimationFrame(tickIntro);
    }

    function fireIntro() {
      if (introFired) return;
      introFired = true;
      clearTimeout(introTimeout);
      overlay?.remove();
      introX = targetX;
      introY = targetY;
      introStart = performance.now();
      root.classList.add("intro-complete");
      introRaf = requestAnimationFrame(tickIntro);
    }

    if (isHeroPage) introTimeout = window.setTimeout(fireIntro, INTRO_HOLD_MS);

    // ── Pulse / submersion state machine ─────────────────────────────
    let pulseStart = 0;
    let pulseX = 0;  // document coords — used by tickWave for letter distance
    let pulseY = 0;
    let pulseVX = 0; // viewport coords at fire time — used by fixed-layer clip-path/cover/ring
    let pulseVY = 0;
    let pulseRadius = 0;
    let coverRadius = 0;
    let pulseRaf = 0;
    let active = false;
    let contractMs = CONTRACT_MS;

    const tickPulse = () => {
      const elapsed = performance.now() - pulseStart;

      if (elapsed >= EXPAND_MS + HOLD_MS + contractMs) {
        contractMs = CONTRACT_MS;
        if (underwater) underwater.style.clipPath = "circle(0px at 50% 50%)";
        cover.style.maskImage = "radial-gradient(circle at 50% 50%, transparent 0px, transparent 100%)";
        if (!isHeroPage) cover.style.opacity = "0";
        root.classList.remove("ocean-submerged");
        ring.style.opacity = "0";
        ring.style.transform = "translate3d(-200px, -200px, 0)";
        active = false;
        return;
      }

      const diag =
        Math.hypot(window.innerWidth, window.innerHeight) * 1.42;

      let radius: number;
      let ringOpacity: number;

      if (elapsed < EXPAND_MS) {
        const t = elapsed / EXPAND_MS;
        radius = t * diag;
        coverRadius = 0;
        ringOpacity = 1 - t * 0.85;
      } else if (elapsed < EXPAND_MS + HOLD_MS) {
        radius = diag;
        coverRadius = 0;
        ringOpacity = 0;
      } else {
        const t = (elapsed - EXPAND_MS - HOLD_MS) / contractMs;
        radius = diag;
        coverRadius = t * diag;
        ringOpacity = 0;
      }

      pulseRadius = radius;
      if (underwater) {
        underwater.style.clipPath = `circle(${radius}px at ${pulseVX}px ${pulseVY}px)`;
      }
      if (elapsed >= EXPAND_MS + HOLD_MS) {
        // Contract phase: bring cover up on non-hero pages and grow the mask from center.
        if (!isHeroPage) cover.style.opacity = "1";
        const innerR = Math.max(0, coverRadius - COVER_FEATHER);
        cover.style.maskImage = `radial-gradient(circle at ${pulseVX}px ${pulseVY}px, black ${innerR}px, transparent ${coverRadius}px)`;
      }

      const ringScale = radius / 50;
      ring.style.transform =
        `translate3d(${pulseVX - 50}px, ${pulseVY - 50}px, 0) ` +
        `scale(${Math.max(ringScale, 0.001)})`;
      ring.style.opacity = String(ringOpacity);

      pulseRaf = requestAnimationFrame(tickPulse);
    };

    const fire = (x: number, y: number) => {
      if (active) return;
      measureLetters();
      const now = performance.now();
      pulseStart = now;
      pulseX = x + window.scrollX;  // document coords for wave letter distances
      pulseY = y + window.scrollY;
      pulseVX = x;  // viewport coords for fixed-layer elements; immune to scroll drift
      pulseVY = y;
      coverRadius = 0;
      cover.style.maskImage = `radial-gradient(circle at ${x}px ${y}px, transparent 0px, transparent 100%)`;
      root.classList.add("ocean-submerged");
      if (!active) {
        active = true;
        pulseRaf = requestAnimationFrame(tickPulse);
      }
      // Start (or restart) the per-letter wave on the same timeline.
      waveStart = now;
      waveActive = true;
      if (!waveRaf) {
        waveRaf = requestAnimationFrame(tickWave);
      }
    };

    const startFastRecovery = (ms: number) => {
      if (!active) return;
      contractMs = ms;
      const now = performance.now();
      pulseStart = now - EXPAND_MS - HOLD_MS;
      waveStart = now - EXPAND_MS - HOLD_MS;
      if (!pulseRaf) pulseRaf = requestAnimationFrame(tickPulse);
      if (!waveRaf) { waveActive = true; waveRaf = requestAnimationFrame(tickWave); }
    };


    const onMotionChange = () => {
      if (motionQuery.matches) {
        root.classList.remove("ocean-enabled");
        root.classList.remove("ocean-submerged");
        cursor.style.opacity = "0";
        if (!introFired) skipLetterIntro();
      } else {
        root.classList.add("ocean-enabled");
      }
    };
    motionQuery.addEventListener("change", onMotionChange);

    return () => {
      root.classList.remove("ocean-enabled");
      root.classList.remove("ocean-submerged");
      root.classList.remove("intro-complete");
      if (underwater) {
        underwater.style.clipPath = "";
        underwater.style.maskImage = "";
      }
      cover.style.opacity = "0";
      cover.style.maskImage = "";
      overlay?.remove();
      letterTimers.forEach(clearTimeout);
      clearTimeout(zoomHandle);
      clearTimeout(introTimeout);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      document.removeEventListener("pointerleave", onPointerLeave);
      document.removeEventListener("pointerenter", onPointerEnter);
      window.removeEventListener("resize", onResize);
      motionQuery.removeEventListener("change", onMotionChange);
      cancelAnimationFrame(cursorRaf);
      cancelAnimationFrame(pulseRaf);
      cancelAnimationFrame(waveRaf);
      cancelAnimationFrame(introRaf);
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      // Clear any inline transforms left on letters.
      for (let i = 0; i < letters.length; i++) {
        letters[i].el.style.transform = "";
      }
    };
  }, []);

  return (
    <>
      {/* Paper cover — second outward pulse, hides underwater from center out */}
      <div
        ref={coverRef}
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 2,
          background: "var(--paper-deep)",
          pointerEvents: "none",
          opacity: 0,
          contain: "strict",
          transform: "translateZ(0)",
          willChange: "mask-image, opacity",
        }}
      />

      {/* Cursor ball */}
      <div
        ref={cursorRef}
        aria-hidden="true"
        className="ocean-cursor"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: CURSOR_SIZE,
          height: CURSOR_SIZE,
          borderRadius: "50%",
          background: "var(--ink-strong)",
          pointerEvents: "none",
          zIndex: 60,
          opacity: 0,
          willChange: "transform, opacity",
          transition:
            "opacity 220ms var(--ease-quart), background-color 180ms var(--ease-quart)",
          transform: "translate3d(-100px, -100px, 0)",
        }}
      />

      {/* Hairline ring (leading edge of the submersion) */}
      <svg
        ref={ringRef}
        aria-hidden="true"
        viewBox="-50 -50 100 100"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: 100,
          height: 100,
          pointerEvents: "none",
          zIndex: 55,
          opacity: 0,
          willChange: "transform, opacity",
          transformOrigin: "50% 50%",
          transform: "translate3d(-200px, -200px, 0)",
          overflow: "visible",
        }}
      >
        <circle
          cx={0}
          cy={0}
          r={49.5}
          fill="none"
          stroke="var(--ink-strong)"
          strokeWidth={1.25}
          vectorEffect="non-scaling-stroke"
          opacity={0.85}
        />
      </svg>
    </>
  );
}

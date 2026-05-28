import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/wordmark";
import { WavyText } from "@/components/wavy-text";
import { SubAlphaPlate } from "@/components/sub-epsilon-plate";
import { PatchesProvider } from "@/components/patches-provider";
import { getPageContent } from "@/lib/page-content";

export const metadata: Metadata = {
  title: "Sub-Epsilon",
  description:
    "Full technical specification for Sub-Epsilon — weight, cost, autonomy stack, and electronics. The lightest, cheapest entry in the RoboSub 2026 bracket.",
};

const NAV_LINKS = [
  { href: "/epsilon", label: "The Sub" },
  { href: "/crew", label: "Crew" },
  { href: "/log", label: "Log" },
  { href: "/crew#sponsors", label: "Sponsors" },
] as const;

const COLOPHON = [
  "Sub-Epsilon",
  "ROS 2 + YOLOv11",
  "8 m rated",
  "Garage-built",
] as const;

const STAGES = [
  {
    label: "Requirements",
    desc: "Defined mission profile against the 2026 task list. Weight and cost ceilings were set before any part was ordered.",
  },
  {
    label: "Frame Design",
    desc: "PVC tube frame with 3D-printed joiners. Thruster positions iterated in simulation before committing to cuts.",
  },
  {
    label: "Electronics",
    desc: "Custom PCB frames inside a sealed acrylic capsule. Every board was designed in-house to fit the tube geometry.",
  },
  {
    label: "Software",
    desc: "ROS 2 Jazzy on paired Raspberry Pi 5 boards. Computer vision pipeline built around YOLOv11 for gate and target detection.",
  },
  {
    label: "Water Trials",
    desc: "Pool sessions of two to three hours. Each ends with a full hardware inspection and log review before the next.",
  },
] as const;

const ls = (delay: number, dur: number, y?: number): CSSProperties =>
  ({
    "--load-delay": `${delay}ms`,
    "--load-dur": `${dur}ms`,
    ...(y !== undefined && { "--load-y": `${y}px` }),
  } as CSSProperties);

export default async function EpsilonPage() {
  const patches = await getPageContent("epsilon");
  return (
    <PatchesProvider patches={patches}>
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>

      <div className="flex min-h-dvh flex-col">
        {/* ── Header ────────────────────────────────────────────────────── */}
        <header
          role="banner"
          className="flex items-center justify-between gap-6 px-6 pt-6 sm:px-10 load-up"
          style={ls(0, 400, 6)}
        >
          <Wordmark />
          <nav aria-label="primary" className="hidden md:block">
            <ul className="flex items-center gap-8">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group/nav relative text-[0.8125rem] text-ink-muted transition-colors duration-200 hover:text-ink-strong"
                  >
                    <WavyText>{link.label}</WavyText>
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute -bottom-1 left-0 right-0 h-px origin-left scale-x-0 bg-accent-base transition-transform duration-300 [transition-timing-function:var(--ease-quart)] group-hover/nav:scale-x-100"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </header>

        <div
          role="separator"
          className="hairline mt-6 load-rule"
          style={{ "--load-delay": "80ms" } as CSSProperties}
        />

        {/* ── Main ──────────────────────────────────────────────────────── */}
        <main id="main" className="flex flex-1 flex-col">

          {/* ── HERO: full-viewport, two-column ─────────────────────────── */}
          <section
            aria-label="Sub-Epsilon overview"
            className="grid grid-cols-1 lg:grid-cols-[1fr_1px_1fr] min-h-[calc(100dvh-73px)]"
          >
            {/* Left column: text stack */}
            <div className="flex flex-col justify-between px-6 py-10 sm:px-10 sm:py-14">
              <div>
                <p
                  className="eyebrow mb-8 text-accent-bright load-up"
                  style={ls(100, 400)}
                >
                  <WavyText patchKey="epsilon.hero.eyebrow">Vehicle Specification · RoboSub 2026</WavyText>
                </p>
                <h1
                  className="display mb-6 load-up"
                  style={ls(160, 700)}
                >
                  <WavyText patchKey="epsilon.hero.headline.1">Built without</WavyText>
                  <br />
                  <WavyText patchKey="epsilon.hero.headline.2">a lab.</WavyText>
                </h1>
                <p
                  className="kicker max-w-[46ch] load-up"
                  style={ls(280, 600)}
                >
                  <WavyText patchKey="epsilon.hero.description">
                    Sub-Epsilon is a fully autonomous underwater vehicle,
                    garage-built by a team of high schoolers competing in an
                    international university bracket with no institutional
                    backing.
                  </WavyText>
                </p>
              </div>

              {/* Spec strip — anchored to bottom of left column */}
              <div className="load-up" style={ls(380, 500)}>
                <div className="hairline mb-6" />
                <dl className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-4">
                  {(
                    [
                      { label: "Weight", value: "2.1 kg" },
                      { label: "Depth", value: "8 m" },
                      { label: "Thrusters", value: "5×" },
                      { label: "Build cost", value: "~$850" },
                    ] as const
                  ).map(({ label, value }, i) => (
                    <div key={label}>
                      <dt className="eyebrow text-ink-faint">
                        <WavyText patchKey={`epsilon.spec.${i}.label`}>{label}</WavyText>
                      </dt>
                      <dd
                        className="mt-1 font-mono text-[0.8125rem] uppercase tracking-[0.10em] text-ink-muted"
                        data-tabular
                      >
                        <WavyText patchKey={`epsilon.spec.${i}.value`}>{value}</WavyText>
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            {/* Vertical hairline (desktop only) */}
            <div
              className="hidden bg-rule lg:block load-rule-y"
              style={{ "--load-delay": "200ms", "--load-dur": "600ms" } as CSSProperties}
              aria-hidden="true"
            />

            {/* Right column: plate */}
            <div
              className="flex items-center justify-center border-t border-rule px-8 py-10 lg:border-t-0 lg:px-14 lg:py-16 lg:h-full load-up"
              style={ls(460, 700, 16)}
            >
              <SubAlphaPlate
                className="w-full max-w-[420px]"
                imageKey="epsilon.sub-photo"
                imageSrc={patches["epsilon.sub-photo"]}
              />
            </div>
          </section>

          {/* ── CREDENTIALS: weight + cost, side by side ─────────────────── */}
          <section aria-label="Weight and build cost" className="border-t border-rule">
            <div className="grid grid-cols-1 sm:grid-cols-2">

              {/* Weight */}
              <div
                className="flex flex-col justify-between px-6 py-10 sm:px-10 sm:border-r sm:border-rule load-up"
                style={ls(0, 500, 8)}
              >
                <div>
                  <p className="eyebrow text-ink-faint mb-6">
                    <WavyText patchKey="epsilon.weight.label">Weight</WavyText>
                  </p>
                  <div className="flex items-end gap-3 mb-8" data-tabular>
                    <span
                      className="font-mono font-bold leading-none tracking-[-0.03em] text-ink-strong"
                      style={{ fontSize: "clamp(2rem, 3.5vw, 3rem)" }}
                    >
                      <WavyText patchKey="epsilon.weight.number">2.1</WavyText>
                    </span>
                    <span className="mb-1 text-[1.125rem] font-mono text-ink-muted uppercase tracking-[0.08em]">
                      <WavyText patchKey="epsilon.weight.unit">kg</WavyText>
                    </span>
                  </div>
                </div>
                <div>
                  <div className="mb-6 space-y-2" aria-hidden="true">
                    <div>
                      <div className="h-1 bg-accent-base mb-1.5" style={{ width: "14%" }} />
                      <span className="eyebrow text-ink-faint">Sub-Epsilon · 2.1 kg</span>
                    </div>
                    <div>
                      <div className="h-px bg-rule mb-1.5" style={{ width: "72%" }} />
                      <span className="eyebrow text-ink-faint">Field avg · ~8.4 kg</span>
                    </div>
                  </div>
                  <p className="text-[1.0625rem] leading-relaxed text-ink-muted max-w-[38ch]">
                    <WavyText patchKey="epsilon.weight.description">
                      Lightest entry in the 2026 RoboSub bracket by a wide
                      margin. Most university vehicles weigh four to eight times
                      as much.
                    </WavyText>
                  </p>
                </div>
              </div>

              {/* Cost */}
              <div
                className="flex flex-col justify-between border-t border-rule px-6 py-10 sm:border-t-0 sm:px-10 load-up"
                style={ls(80, 500, 8)}
              >
                <div>
                  <p className="eyebrow text-ink-faint mb-6">
                    <WavyText patchKey="epsilon.cost.label">Build Cost</WavyText>
                  </p>
                  <div className="flex items-end gap-1 mb-8" data-tabular>
                    <span
                      className="font-mono font-bold leading-none tracking-[-0.03em] text-ink-strong"
                      style={{ fontSize: "clamp(2rem, 3.5vw, 3rem)" }}
                    >
                      <WavyText patchKey="epsilon.cost.number">$850</WavyText>
                    </span>
                  </div>
                </div>
                <div>
                  <div className="mb-6 space-y-2" aria-hidden="true">
                    <div>
                      <div className="h-1 bg-accent-base mb-1.5" style={{ width: "7%" }} />
                      <span className="eyebrow text-ink-faint">Sub-Epsilon · $850</span>
                    </div>
                    <div>
                      <div className="h-px bg-rule mb-1.5" style={{ width: "72%" }} />
                      <span className="eyebrow text-ink-faint">Field avg · ~$12,000</span>
                    </div>
                  </div>
                  <p className="text-[1.0625rem] leading-relaxed text-ink-muted max-w-[38ch]">
                    <WavyText patchKey="epsilon.cost.description">
                      Less than a single component on many university builds.
                      Every off-the-shelf carrier board was replaced with a
                      custom PCB wherever the geometry allowed.
                    </WavyText>
                  </p>
                </div>
              </div>

            </div>
          </section>

          {/* ── DESIGN PROCESS: horizontal stage strip ────────────────────── */}
          <section aria-label="Design process" className="border-t border-rule">
            <div className="px-6 py-10 sm:px-10">
              <p
                className="eyebrow text-ink-faint mb-8 load-up"
                style={ls(0, 400)}
              >
                <WavyText patchKey="epsilon.process.label">Design Process</WavyText>
              </p>
              <div className="grid grid-cols-1 divide-y divide-rule lg:grid-cols-5 lg:divide-y-0 lg:divide-x">
                {STAGES.map((stage, i) => (
                  <div
                    key={i}
                    className={`py-6 load-up ${i === 0 ? "lg:pr-6" : "lg:px-6"}`}
                    style={ls(i * 55, 500, 8)}
                  >
                    <p className="font-mono text-[2.5rem] font-bold leading-none text-ink-faint mb-4" aria-hidden="true">
                      {String(i + 1).padStart(2, "0")}
                    </p>
                    <h3 className="mb-2 text-[0.9375rem] font-bold text-ink-strong">
                      <WavyText patchKey={`epsilon.process.${i}.label`}>{stage.label}</WavyText>
                    </h3>
                    <p className="text-[0.875rem] leading-relaxed text-ink-muted">
                      <WavyText patchKey={`epsilon.process.${i}.desc`}>{stage.desc}</WavyText>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── SEALED CAPSULE: specs + schematic ────────────────────────── */}
          <section aria-label="Electronics capsule" className="border-t border-rule">
            <div className="grid grid-cols-1 lg:grid-cols-[5fr_1px_7fr]">

              {/* Specs */}
              <div
                className="px-6 py-10 sm:px-10 load-up"
                style={ls(0, 500, 8)}
              >
                <p className="eyebrow text-ink-faint mb-4">
                  <WavyText patchKey="epsilon.capsule.label">Sealed Capsule</WavyText>
                </p>
                <h2 className="mb-4 text-[1.875rem] font-bold leading-tight tracking-[-0.03em] text-ink-strong">
                  <WavyText patchKey="epsilon.capsule.headline">Custom PCB frames, no carrier boards.</WavyText>
                </h2>
                <p className="mb-8 max-w-[42ch] text-[1.0625rem] leading-relaxed text-ink-muted">
                  <WavyText patchKey="epsilon.capsule.description">
                    Electronics live in a sealed acrylic tube with aluminum end
                    caps and dual O-ring seals at each end. All PCBs were
                    designed to fit the capsule geometry, eliminating the wasted
                    volume of off-the-shelf carrier boards.
                  </WavyText>
                </p>
                <dl className="space-y-3 border-t border-rule pt-6">
                  {(
                    [
                      { label: "Tube material", value: "Clear acrylic" },
                      { label: "End caps", value: "316 aluminum" },
                      { label: "Seal method", value: "Dual O-ring per cap" },
                      { label: "PCBs", value: "Custom frames, in-house" },
                      { label: "Depth rating", value: "8 m tested" },
                    ] as const
                  ).map(({ label, value }, i) => (
                    <div key={label} className="flex items-baseline gap-4">
                      <dt className="eyebrow min-w-[9rem] text-ink-faint">
                        <WavyText patchKey={`epsilon.capsule.spec.${i}.label`}>{label}</WavyText>
                      </dt>
                      <dd className="text-[0.875rem] text-ink-muted">
                        <WavyText patchKey={`epsilon.capsule.spec.${i}.value`}>{value}</WavyText>
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* Vertical divider */}
              <div className="hidden bg-rule lg:block" aria-hidden="true" />

              {/* Schematic */}
              <div
                className="border-t border-rule px-6 py-10 sm:px-10 lg:border-t-0 lg:py-14 load-up"
                style={ls(180, 600, 12)}
              >
                <figure>
                  <div
                    className="relative w-full bg-paper-base border border-rule"
                    role="img"
                    aria-label="Longitudinal cross-section of the Sub-Epsilon electronics capsule, showing acrylic tube, aluminum end caps, O-ring seals, and custom PCB stack"
                  >
                    <div className="absolute top-3 left-3 colophon">
                      <span className="text-ink-muted"><WavyText patchKey="epsilon.capsule.diagram.label">Capsule</WavyText></span>
                      <span className="mx-1.5 text-ink-faint">/</span>
                      <span className="text-ink-faint"><WavyText patchKey="epsilon.capsule.diagram.sublabel">cross-section</WavyText></span>
                    </div>
                    <div className="absolute top-3 right-3 colophon text-ink-faint">
                      <WavyText patchKey="epsilon.capsule.diagram.meta">sealed · 8 m</WavyText>
                    </div>

                    <svg
                      viewBox="0 0 560 250"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-full text-ink-muted"
                      aria-hidden="true"
                    >
                      {/* ── Acrylic tube walls ──────────────────────────── */}
                      <line x1="90" y1="70" x2="470" y2="70" strokeWidth="1.4" />
                      <line x1="90" y1="160" x2="470" y2="160" strokeWidth="1.4" />

                      {/* ── Left end cap ────────────────────────────────── */}
                      <rect x="54" y="57" width="37" height="116" strokeWidth="1.4" />
                      {/* Hatching — aluminum indicator */}
                      {[68, 78, 88, 98].map((y) => (
                        <line key={`lh-${y}`} x1="56" y1={y} x2="89" y2={y}
                          strokeWidth="0.5" opacity="0.25" />
                      ))}
                      {[132, 142, 152, 162].map((y) => (
                        <line key={`lb-${y}`} x1="56" y1={y} x2="89" y2={y}
                          strokeWidth="0.5" opacity="0.25" />
                      ))}

                      {/* ── Right end cap ───────────────────────────────── */}
                      <rect x="469" y="57" width="37" height="116" strokeWidth="1.4" />
                      {[68, 78, 88, 98].map((y) => (
                        <line key={`rh-${y}`} x1="471" y1={y} x2="504" y2={y}
                          strokeWidth="0.5" opacity="0.25" />
                      ))}
                      {[132, 142, 152, 162].map((y) => (
                        <line key={`rb-${y}`} x1="471" y1={y} x2="504" y2={y}
                          strokeWidth="0.5" opacity="0.25" />
                      ))}

                      {/* ── O-ring seals ────────────────────────────────── */}
                      <circle cx="90" cy="73" r="4" strokeWidth="1" fill="currentColor" />
                      <circle cx="90" cy="157" r="4" strokeWidth="1" fill="currentColor" />
                      <circle cx="470" cy="73" r="4" strokeWidth="1" fill="currentColor" />
                      <circle cx="470" cy="157" r="4" strokeWidth="1" fill="currentColor" />

                      {/* ── PCB mounting rails (dashed) ──────────────────── */}
                      <line x1="110" y1="85" x2="450" y2="85"
                        strokeWidth="0.6" strokeDasharray="3 4" opacity="0.35" />
                      <line x1="110" y1="145" x2="450" y2="145"
                        strokeWidth="0.6" strokeDasharray="3 4" opacity="0.35" />

                      {/* ── PCB stack (4 boards, edge-on) ───────────────── */}
                      {[130, 205, 280, 355].map((x) => (
                        <g key={x}>
                          <rect x={x} y={85} width={30} height={60}
                            strokeWidth="1.1" opacity="0.75" />
                          {/* Board connector nub */}
                          <rect x={x + 7} y={81} width={10} height={5}
                            strokeWidth="0.7" opacity="0.5" />
                          {/* Trace lines — give it life */}
                          <line x1={x + 5} y1={100} x2={x + 25} y2={100}
                            strokeWidth="0.4" opacity="0.3" />
                          <line x1={x + 5} y1={110} x2={x + 18} y2={110}
                            strokeWidth="0.4" opacity="0.3" />
                          <line x1={x + 5} y1={120} x2={x + 22} y2={120}
                            strokeWidth="0.4" opacity="0.3" />
                        </g>
                      ))}

                      {/* ── Cable penetrator (right cap) ────────────────── */}
                      <circle cx="487" cy="115" r="5.5" strokeWidth="1.1" />
                      <line x1="492" y1="115" x2="506" y2="115" strokeWidth="0.8" />

                      {/* ── Dimension callout ────────────────────────────── */}
                      <g opacity="0.32" strokeWidth="0.6">
                        <line x1="90" y1="200" x2="470" y2="200" />
                        <line x1="90" y1="194" x2="90" y2="206" />
                        <line x1="470" y1="194" x2="470" y2="206" />
                      </g>
                      <text
                        x="280" y="218"
                        textAnchor="middle"
                        className="fill-ink-faint"
                        style={{
                          fontFamily: "var(--font-geist-mono)",
                          fontSize: "9px",
                          letterSpacing: "0.15em",
                          textTransform: "uppercase",
                        }}
                        aria-hidden="true"
                      >
                        280 mm
                      </text>

                      {/* ── Annotations ─────────────────────────────────── */}
                      {/* Acrylic tube — above, center */}
                      <line x1="280" y1="70" x2="280" y2="47"
                        strokeWidth="0.55" opacity="0.45" />
                      <circle cx="280" cy="70" r="2" fill="currentColor" opacity="0.45" />
                      <text x="280" y="41" textAnchor="middle" className="fill-ink-faint"
                        style={{ fontFamily: "var(--font-geist-mono)", fontSize: "8px", letterSpacing: "0.13em", textTransform: "uppercase" }}
                        aria-hidden="true">
                        Acrylic tube
                      </text>

                      {/* O-ring seal — lower-left */}
                      <line x1="90" y1="157" x2="68" y2="185"
                        strokeWidth="0.55" opacity="0.45" />
                      <text x="68" y="197" textAnchor="middle" className="fill-ink-faint"
                        style={{ fontFamily: "var(--font-geist-mono)", fontSize: "8px", letterSpacing: "0.13em", textTransform: "uppercase" }}
                        aria-hidden="true">
                        O-ring
                      </text>

                      {/* Custom PCB frames — below, center-left */}
                      <line x1="242" y1="145" x2="242" y2="185"
                        strokeWidth="0.55" opacity="0.45" />
                      <circle cx="242" cy="145" r="2" fill="currentColor" opacity="0.45" />
                      <text x="242" y="197" textAnchor="middle" className="fill-ink-faint"
                        style={{ fontFamily: "var(--font-geist-mono)", fontSize: "8px", letterSpacing: "0.13em", textTransform: "uppercase" }}
                        aria-hidden="true">
                        PCB frames
                      </text>

                      {/* End cap — upper-right */}
                      <line x1="487" y1="57" x2="505" y2="42"
                        strokeWidth="0.55" opacity="0.45" />
                      <text x="554" y="38" textAnchor="end" className="fill-ink-faint"
                        style={{ fontFamily: "var(--font-geist-mono)", fontSize: "8px", letterSpacing: "0.13em", textTransform: "uppercase" }}
                        aria-hidden="true">
                        316-Al cap
                      </text>
                    </svg>
                  </div>
                  <figcaption className="font-italic-text mt-3 text-[0.875rem] leading-snug text-ink-muted">
                    <span className="text-ink">
                      <WavyText patchKey="epsilon.capsule.figcaption.title">Sub-Epsilon</WavyText>
                    </span>
                    <span className="mx-1.5 text-ink-faint">·</span>
                    <WavyText patchKey="epsilon.capsule.figcaption.desc">
                      electronics capsule, longitudinal cross-section, working
                      drawing.
                    </WavyText>
                  </figcaption>
                </figure>
              </div>
            </div>
          </section>

          {/* ── COMPUTE: Pi5 overview + field notes ──────────────────────── */}
          <section aria-label="Compute platform" className="border-t border-rule">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1px_1fr]">

              {/* Left: Pi5 architecture */}
              <div
                className="px-6 py-10 sm:px-10 load-up"
                style={ls(0, 500, 8)}
              >
                <p className="eyebrow text-ink-faint mb-4">
                  <WavyText patchKey="epsilon.compute.label">Compute Platform</WavyText>
                </p>
                <h2 className="mb-4 text-[1.875rem] font-bold leading-tight tracking-[-0.03em] text-ink-strong">
                  <WavyText patchKey="epsilon.compute.headline">Two Raspberry Pi 5s, each with a defined job.</WavyText>
                </h2>
                <p className="mb-5 max-w-[44ch] text-[1.0625rem] leading-relaxed text-ink-muted">
                  <WavyText patchKey="epsilon.compute.body.1">
                    One Pi 5 handles the computer vision pipeline exclusively,
                    running YOLOv11 inference against the camera feed for object
                    detection and gate identification. The second handles
                    navigation, state machine execution, and thruster control.
                  </WavyText>
                </p>
                <p className="max-w-[44ch] text-[1.0625rem] leading-relaxed text-ink-muted">
                  <WavyText patchKey="epsilon.compute.body.2">
                    Splitting the workload keeps both boards within thermal
                    limits inside the sealed capsule and keeps the vision
                    pipeline from competing with navigation for CPU time. Both
                    boards communicate over an internal network via ROS 2 topics
                    and services. The split was not the original plan.
                  </WavyText>
                </p>
              </div>

              {/* Vertical divider */}
              <div className="hidden bg-rule lg:block" aria-hidden="true" />

              {/* Right: Pi5 experience */}
              <div
                className="border-t border-rule px-6 py-10 sm:px-10 lg:border-t-0 load-up"
                style={ls(120, 500, 8)}
              >
                <p className="eyebrow text-ink-faint mb-4">
                  <WavyText patchKey="epsilon.fieldnotes.label">Field Notes</WavyText>
                </p>
                <h2 className="mb-6 text-[1.875rem] font-bold leading-tight tracking-[-0.03em] text-ink-strong">
                  <WavyText patchKey="epsilon.fieldnotes.headline">We burned through several Pi 5s.</WavyText>
                </h2>
                <div className="space-y-7">
                  {(
                    [
                      {
                        n: "01",
                        title: "Power regulation fault.",
                        body: "An unstable supply line delivered voltage spikes that killed two boards before the fault was isolated. Each board took the capsule apart and back together.",
                      },
                      {
                        n: "02",
                        title: "Thermal runaway, pool session.",
                        body: "The third died during a pool run. Ventilation inside the capsule is minimal; we had underestimated the steady-state load under sustained inference.",
                      },
                      {
                        n: "03",
                        title: "Protocol established.",
                        body: "Every board swap is now a full waterproofing recertification. The capsule pressure-tests before any pool session following an internal change. Three stable sessions since.",
                      },
                    ] as const
                  ).map(({ n, title, body }, i) => (
                    <div key={n} className="grid grid-cols-[2rem_1fr] gap-3">
                      <span className="eyebrow text-ink-faint pt-[3px]">{n}</span>
                      <div>
                        <p className="mb-1.5 text-[0.9375rem] font-bold text-ink-strong">
                          <WavyText patchKey={`epsilon.fieldnotes.${i}.title`}>{title}</WavyText>
                        </p>
                        <p className="text-[0.9375rem] leading-relaxed text-ink-muted">
                          <WavyText patchKey={`epsilon.fieldnotes.${i}.body`}>{body}</WavyText>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── AUTONOMY: ROS2 + navigation, side by side ────────────────── */}
          <section aria-label="Software and autonomy" className="border-t border-rule">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1px_1fr]">

              {/* ROS2 */}
              <div
                className="px-6 py-10 sm:px-10 load-up"
                style={ls(0, 500, 8)}
              >
                <p className="eyebrow text-ink-faint mb-4">
                  <WavyText patchKey="epsilon.ros.label">ROS 2 Implementation</WavyText>
                </p>
                <h2 className="mb-6 text-[1.875rem] font-bold leading-tight tracking-[-0.03em] text-ink-strong">
                  <WavyText patchKey="epsilon.ros.headline">Jazzy on bare metal, no simulation crutch.</WavyText>
                </h2>
                <p className="mb-8 max-w-[44ch] text-[1.0625rem] leading-relaxed text-ink-muted">
                  <WavyText patchKey="epsilon.ros.description">
                    The stack runs ROS 2 Jazzy directly on Raspberry Pi OS Lite,
                    no Docker, no simulation overlay. Every node was written from
                    scratch and validated against real hardware.
                  </WavyText>
                </p>

                {/* Node tree */}
                <div
                  className="rounded-[3px] border border-rule bg-paper-sunken p-5"
                  role="img"
                  aria-label="ROS 2 node graph showing vision, IMU, depth, navigation, and thruster nodes"
                >
                  <p className="font-mono text-[0.75rem] leading-[2] text-ink-strong">
                    <WavyText patchKey="epsilon.ros.tree.0">/nebula</WavyText>
                  </p>
                  <p className="font-mono text-[0.75rem] leading-[2] text-ink-faint pl-4">
                    <WavyText patchKey="epsilon.ros.tree.1">{"├─ /vision_node"}</WavyText>
                  </p>
                  <p className="font-mono text-[0.75rem] leading-[2] text-ink-faint pl-12">
                    <WavyText patchKey="epsilon.ros.tree.2">{"└─ YOLOv11 · gate / target detection"}</WavyText>
                  </p>
                  <p className="font-mono text-[0.75rem] leading-[2] text-ink-faint pl-4">
                    <WavyText patchKey="epsilon.ros.tree.3">{"├─ /imu_node"}</WavyText>
                  </p>
                  <p className="font-mono text-[0.75rem] leading-[2] text-ink-faint pl-12">
                    <WavyText patchKey="epsilon.ros.tree.4">{"└─ orientation · roll / pitch / yaw"}</WavyText>
                  </p>
                  <p className="font-mono text-[0.75rem] leading-[2] text-ink-faint pl-4">
                    <WavyText patchKey="epsilon.ros.tree.5">{"├─ /depth_node"}</WavyText>
                  </p>
                  <p className="font-mono text-[0.75rem] leading-[2] text-ink-faint pl-12">
                    <WavyText patchKey="epsilon.ros.tree.6">{"└─ pressure sensor · depth hold"}</WavyText>
                  </p>
                  <p className="font-mono text-[0.75rem] leading-[2] text-ink-faint pl-4">
                    <WavyText patchKey="epsilon.ros.tree.7">{"├─ /nav_node"}</WavyText>
                  </p>
                  <p className="font-mono text-[0.75rem] leading-[2] text-ink-faint pl-12">
                    <WavyText patchKey="epsilon.ros.tree.8">{"├─ PID controllers · 3-axis"}</WavyText>
                  </p>
                  <p className="font-mono text-[0.75rem] leading-[2] text-ink-faint pl-12">
                    <WavyText patchKey="epsilon.ros.tree.9">{"└─ mission state machine"}</WavyText>
                  </p>
                  <p className="font-mono text-[0.75rem] leading-[2] text-ink-faint pl-4">
                    <WavyText patchKey="epsilon.ros.tree.10">{"└─ /thruster_node"}</WavyText>
                  </p>
                  <p className="font-mono text-[0.75rem] leading-[2] text-ink-faint pl-12">
                    <WavyText patchKey="epsilon.ros.tree.11">{"└─ 5× ESC · PWM command"}</WavyText>
                  </p>
                </div>
              </div>

              {/* Vertical divider */}
              <div className="hidden bg-rule lg:block" aria-hidden="true" />

              {/* Autonomous navigation */}
              <div
                className="border-t border-rule px-6 py-10 sm:px-10 lg:border-t-0 load-up"
                style={ls(120, 500, 8)}
              >
                <p className="eyebrow text-ink-faint mb-4">
                  <WavyText patchKey="epsilon.nav.label">Autonomous Navigation</WavyText>
                </p>
                <h2 className="mb-6 text-[1.875rem] font-bold leading-tight tracking-[-0.03em] text-ink-strong">
                  <WavyText patchKey="epsilon.nav.headline">State machine execution, sensor fusion.</WavyText>
                </h2>
                <p className="mb-5 max-w-[44ch] text-[1.0625rem] leading-relaxed text-ink-muted">
                  <WavyText patchKey="epsilon.nav.body.1">
                    Sub-Epsilon navigates using a hierarchical state machine that
                    sequences mission tasks against the RoboSub task list. Each
                    task is a defined state with entry conditions, execution
                    logic, and explicit exit criteria.
                  </WavyText>
                </p>
                <p className="mb-10 max-w-[44ch] text-[1.0625rem] leading-relaxed text-ink-muted">
                  <WavyText patchKey="epsilon.nav.body.2">
                    Depth hold and heading hold run as continuous background PID
                    loops. Detection results from the vision node are consumed
                    as task preconditions: the sub will not transition states on
                    detection alone, but gates on confidence threshold and
                    positional alignment.
                  </WavyText>
                </p>
                <dl className="space-y-3 border-t border-rule pt-6">
                  {(
                    [
                      { label: "Depth control", value: "PID on pressure sensor" },
                      { label: "Heading", value: "PID on IMU yaw" },
                      { label: "Vision", value: "YOLOv11, confidence-gated" },
                      { label: "Mission", value: "Hierarchical state machine" },
                      { label: "Localisation", value: "Dead reckoning + vision" },
                    ] as const
                  ).map(({ label, value }, i) => (
                    <div key={label} className="flex items-baseline gap-4">
                      <dt className="eyebrow min-w-[9rem] text-ink-faint">
                        <WavyText patchKey={`epsilon.nav.spec.${i}.label`}>{label}</WavyText>
                      </dt>
                      <dd className="text-[0.875rem] text-ink-muted">
                        <WavyText patchKey={`epsilon.nav.spec.${i}.value`}>{value}</WavyText>
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </section>

        </main>

        {/* ── Separator ─────────────────────────────────────────────────── */}
        <div
          role="separator"
          className="hairline load-rule"
          style={{ "--load-delay": "520ms" } as CSSProperties}
        />

        {/* ── Footer ────────────────────────────────────────────────────── */}
        <footer role="contentinfo" className="px-6 py-5 sm:px-10">
          <ul
            role="list"
            className="colophon flex flex-wrap items-center gap-x-3 gap-y-1.5"
          >
            {COLOPHON.map((item, idx) => (
              <li key={item} className="flex items-center gap-3">
                {idx > 0 && (
                  <span aria-hidden="true" className="text-ink-faint">
                    ·
                  </span>
                )}
                <span
                  className={
                    idx === COLOPHON.length - 1 ? "text-ink" : "text-ink-muted"
                  }
                >
                  <WavyText patchKey={`epsilon.footer.${idx}`}>{item}</WavyText>
                </span>
              </li>
            ))}
            <li className="ms-auto flex items-center gap-2 text-ink-faint">
              <span
                aria-hidden="true"
                className="inline-block h-1.5 w-1.5 rounded-full bg-mission"
              />
              <WavyText patchKey="epsilon.footer.status">Mission Ready</WavyText>
            </li>
          </ul>
        </footer>
      </div>
    </>
    </PatchesProvider>
  );
}

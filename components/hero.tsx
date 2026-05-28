import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Wordmark } from "@/components/wordmark";
import { SubAlphaPlate } from "@/components/sub-epsilon-plate";
import { WavyText } from "@/components/wavy-text";

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

const ls = (delay: number, dur: number, y?: number): CSSProperties =>
  ({
    "--load-delay": `${delay}ms`,
    "--load-dur": `${dur}ms`,
    ...(y !== undefined && { "--load-y": `${y}px` }),
  } as CSSProperties);

export function Hero() {
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>

      <div className="flex min-h-dvh flex-col">
        {/* ── Top band ─────────────────────────────────────────────────── */}
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
                      className="pointer-events-none absolute -bottom-1 left-0 right-0 h-px scale-x-0 origin-left bg-accent-base transition-transform duration-300 [transition-timing-function:var(--ease-quart)] group-hover/nav:scale-x-100"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </header>

        <div role="separator" className="hairline mt-6 load-rule" style={{ "--load-delay": "80ms" } as CSSProperties} />

        {/* ── Center field ─────────────────────────────────────────────── */}
        <main
          id="main"
          className="flex flex-1 flex-col justify-center px-6 py-10 sm:px-10 sm:py-14"
        >
          <div className="mx-auto grid w-full max-w-[1240px] grid-cols-[minmax(0,1fr)] items-center gap-x-16 gap-y-14 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            {/* Type column */}
            <div className="flex min-w-0 flex-col gap-6">
              <h1 className="display load-up" style={ls(160, 600)}>
                <WavyText patchKey="hero.headline.main">
                  {"We’re high schoolers building autonomous submarines, "}
                </WavyText>
                <span className="font-italic font-normal text-accent-bright">
                  <WavyText patchKey="hero.headline.accent">in a garage.</WavyText>
                </span>
              </h1>

              <p className="kicker text-ink load-up" style={ls(280, 500, 8)}>
                <span className="block">
                  <WavyText patchKey="hero.kicker.1">Non-profit, student-run, no school behind us.</WavyText>
                </span>
                <span className="block">
                  <WavyText patchKey="hero.kicker.2">And the only team in our bracket without one.</WavyText>
                </span>
              </p>

              <p className="lede load-up" style={ls(400, 500, 8)}>
                <span className="block"><WavyText patchKey="hero.lede.1">Project Nebula is a 100% student-built submarine, designed</WavyText></span>
                <span className="block"><WavyText patchKey="hero.lede.2">and machined in a home garage, competing in Robosub 2026</WavyText></span>
                <span className="block"><WavyText patchKey="hero.lede.3">against universities with full labs and faculty advisors.</WavyText></span>
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-x-7 gap-y-3 load-up" style={ls(500, 400, 8)}>
                <Link
                  href="/epsilon"
                  className="group/cta inline-flex items-center gap-2.5 rounded-md bg-accent-base px-5 py-3.5 text-[0.875rem] font-medium text-ink-strong transition-colors duration-200 hover:bg-accent-bright active:translate-y-px"
                >
                  <WavyText patchKey="hero.cta.primary">Meet Sub-Epsilon</WavyText>
                  <ArrowRight
                    className="h-3.5 w-3.5 transition-transform duration-300 [transition-timing-function:var(--ease-quart)] group-hover/cta:translate-x-0.5"
                    aria-hidden="true"
                  />
                </Link>
                <Link
                  href="/log"
                  className="group/sec inline-flex items-center gap-2 text-[0.875rem] text-ink transition-colors duration-200 hover:text-accent-bright"
                >
                  <WavyText>Latest update</WavyText>
                  <ArrowRight
                    className="h-3.5 w-3.5 transition-transform duration-300 [transition-timing-function:var(--ease-quart)] group-hover/sec:translate-x-1"
                    aria-hidden="true"
                  />
                </Link>
              </div>
            </div>

            {/* Plate column */}
            <aside
              aria-label="Sub-Epsilon figure"
              className="flex min-w-0 justify-start lg:justify-end lg:pt-2 load-up"
              style={ls(160, 700, 8)}
            >
              <SubAlphaPlate />
            </aside>
          </div>
        </main>

        {/* ── Bottom band ──────────────────────────────────────────────── */}
        <div role="separator" className="hairline load-rule" style={{ "--load-delay": "580ms" } as CSSProperties} />

        <footer
          role="contentinfo"
          className="px-6 py-5 sm:px-10"
        >
          <ul
            role="list"
            className="colophon flex flex-wrap items-center gap-x-3 gap-y-1.5"
          >
            {COLOPHON.map((item, idx) => (
              <li key={item} className="flex items-center gap-3 load-up" style={ls(660 + idx * 60, 350, 6)}>
                {idx > 0 && (
                  <span aria-hidden="true" className="text-ink-faint">
                    ·
                  </span>
                )}
                <span
                  className={
                    idx === COLOPHON.length - 1
                      ? "text-ink"
                      : "text-ink-muted"
                  }
                >
                  <WavyText>{item}</WavyText>
                </span>
              </li>
            ))}
            <li className="ms-auto flex items-center gap-2 text-ink-faint load-up" style={ls(900, 350, 6)}>
              <span
                aria-hidden="true"
                className="inline-block h-1.5 w-1.5 rounded-full bg-mission load-dot"
                style={{ "--load-delay": "900ms", "--load-dur": "400ms" } as CSSProperties}
              />
              <WavyText>Mission Ready</WavyText>
            </li>
          </ul>
        </footer>
      </div>
    </>
  );
}

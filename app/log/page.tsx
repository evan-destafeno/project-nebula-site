import type { CSSProperties } from "react"
import type { Metadata } from "next"
import { Suspense } from "react"
import { WavyText } from "@/components/wavy-text"
import { SiteHeader } from "@/components/site-header"
import { LogFeed } from "@/components/log/log-feed"
import { getLogEntries, LOG_PAGE_SIZE } from "@/lib/log"

export const metadata: Metadata = {
  title: "Log",
  description:
    "A running record of what's actually being built. Pool sessions, hardware failures, software milestones, and field notes from the garage.",
}

const COLOPHON = [
  "Sub-Epsilon",
  "ROS 2 + YOLOv11",
  "8 m rated",
  "Garage-built",
] as const

const ls = (delay: number, dur: number, y?: number): CSSProperties =>
  ({
    "--load-delay": `${delay}ms`,
    "--load-dur": `${dur}ms`,
    ...(y !== undefined && { "--load-y": `${y}px` }),
  } as CSSProperties)

async function LogFeedServer() {
  const { entries, hasMore, total } = await getLogEntries({ limit: LOG_PAGE_SIZE })
  return (
    <>
      <div
        className="mb-12 grid grid-cols-[9rem_1fr] gap-x-8 load-up"
        style={ls(120, 400, 6)}
      >
        <div />
        <div>
          <p className="eyebrow text-ink-faint mb-3">
            <WavyText>Build Log</WavyText>
          </p>
          <p className="text-[1.0625rem] leading-[1.65] text-ink-muted max-w-[58ch]">
            <WavyText>
              {`Pool sessions, hardware failures, software milestones. What we built, what broke, and what we learned. ${total} entries.`}
            </WavyText>
          </p>
        </div>
      </div>

      <div
        role="separator"
        className="hairline mb-0 load-rule"
        style={{ "--load-delay": "160ms" } as CSSProperties}
      />

      <div className="load-up" style={ls(200, 400, 8)}>
        <LogFeed
          initialEntries={entries}
          initialHasMore={hasMore}
          initialOffset={LOG_PAGE_SIZE}
        />
      </div>
    </>
  )
}

export default function LogPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="skip-link">Skip to content</a>
      <SiteHeader />

        {/* ── Main ─────────────────────────────────────────────────────── */}
        <main id="main" className="flex flex-1 flex-col px-6 py-10 sm:px-10 sm:py-14">
          <div className="mx-auto w-full max-w-[1240px]">
            <Suspense>
              <LogFeedServer />
            </Suspense>
          </div>
        </main>

        {/* ── Separator ────────────────────────────────────────────────── */}
        <div
          role="separator"
          className="hairline load-rule"
          style={{ "--load-delay": "400ms" } as CSSProperties}
        />

        {/* ── Footer ───────────────────────────────────────────────────── */}
        <footer role="contentinfo" className="px-6 py-5 sm:px-10">
          <ul role="list" className="colophon flex flex-wrap items-center gap-x-3 gap-y-1.5">
            {COLOPHON.map((item, idx) => (
              <li key={item} className="flex items-center gap-3">
                {idx > 0 && (
                  <span aria-hidden="true" className="text-ink-faint">·</span>
                )}
                <span className={idx === COLOPHON.length - 1 ? "text-ink" : "text-ink-muted"}>
                  <WavyText>{item}</WavyText>
                </span>
              </li>
            ))}
            <li className="ms-auto flex items-center gap-2 text-ink-faint">
              <span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full bg-mission" />
              <WavyText>Mission Ready</WavyText>
            </li>
          </ul>
        </footer>
    </div>
  )
}

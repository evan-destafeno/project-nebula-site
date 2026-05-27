"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { IMAGE_SIZES } from "@/lib/log-types"
import type { LogEntry, EntryType, CoverImage as CoverImageType } from "@/lib/log-types"

// Dispatch entries collapse at EXACTLY this many pixels from the top of the body,
// regardless of text length or rewrapping. Changing the copy above the fold does
// not shift where the cut-off lands — it is always at this pixel boundary.
const DISPATCH_COLLAPSE_HEIGHT_PX = 400

// Insert a soft hyphen (­) every `every` characters inside long runs of
// non-whitespace so the browser can break them with a visible hyphen.
// `hyphens: auto` (hyphens-auto Tailwind class) must be set on the element for
// soft hyphens to render a visible "-" at the break point.
function withSoftHyphens(text: string, every = 20): string {
  return text.replace(/\S+/g, (word) => {
    if (word.length <= every) return word
    let out = ""
    for (let i = 0; i < word.length; i++) {
      out += word[i]
      if ((i + 1) % every === 0 && i + 1 < word.length) out += "­"
    }
    return out
  })
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-")
  const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"]
  return `${d} ${months[parseInt(m) - 1]} ${y.slice(2)}`
}

function BodyText({ body, className }: { body: string; className?: string }) {
  // Split on blank lines; handle both \n\n and Windows \r\n\r\n.
  const paragraphs = body.split(/\r?\n\r?\n/).filter(Boolean)
  return (
    <div className={cn("space-y-4", className)}>
      {paragraphs.map((p, i) => (
        <p key={i} className="text-[1.0rem] leading-[1.65] text-ink-muted text-wrap-pretty hyphens-auto break-words">
          {withSoftHyphens(p.replace(/\r?\n/g, " "))}
        </p>
      ))}
    </div>
  )
}

function DateLabel({ date }: { date: string }) {
  return (
    <time dateTime={date} className="eyebrow text-ink-faint shrink-0 pt-px">
      {formatDate(date)}
    </time>
  )
}

// Col 1.5: the cover image column, inserted between date (col 1) and content (col 2).
//
// self-start: the image does NOT stretch vertically. Its height is fixed to the
// standard dimension for its orientation. The row height is always set by col 2
// (the content), which the admin must guarantee is >= the image height.
// object-cover: crops to fill the box exactly, handling source images that aren't
// pixel-perfect matches to the standard dimensions.
function CoverImageColumn({ image }: { image: CoverImageType }) {
  const { width, height } = IMAGE_SIZES[image.orientation]
  const [failed, setFailed] = useState(false)

  return (
    <div
      className="self-start shrink-0 rounded-[3px] bg-paper-base overflow-hidden"
      style={{ width, height }}
    >
      {failed ? (
        // Placeholder: shown when the image src is missing or fails to load.
        // Holds the column space and signals what size image belongs here.
        // No error icon — just the expected dimensions in mono, which is more
        // useful than a broken-image glyph in an engineering context.
        <div className="flex h-full w-full items-center justify-center border border-rule">
          <span className="eyebrow text-ink-faint select-none" aria-label={`Image unavailable — expected size: ${width} by ${height} pixels`}>
            {width}×{height}
          </span>
        </div>
      ) : (
        <Image
          src={image.src}
          alt="" // cover photos are decorative; all meaning lives in the text
          aria-hidden="true"
          width={width}
          height={height}
          className="h-full w-full object-cover object-center"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  )
}

// Pixel-based collapse: the body is clamped to DISPATCH_COLLAPSE_HEIGHT_PX using
// CSS max-height + overflow:hidden, NOT by slicing the string. This means the
// visible cut-off is always at the same screen position regardless of what text
// sits above it. The button appears only when the natural height actually overflows.
function ExpandableBody({ body }: { body: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [overflows, setOverflows] = useState(false)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    // scrollHeight = natural content height (unaffected by max-height CSS).
    // clientHeight = constrained height. If they differ, there is hidden content.
    setOverflows(el.scrollHeight > DISPATCH_COLLAPSE_HEIGHT_PX)
  }, []) // content is static after mount; single check is sufficient

  return (
    <div>
      <div
        ref={containerRef}
        style={{
          maxHeight: expanded ? undefined : `${DISPATCH_COLLAPSE_HEIGHT_PX}px`,
          overflow: expanded ? undefined : "hidden",
        }}
      >
        <BodyText body={body} />
      </div>
      {overflows && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="eyebrow text-ink-faint mt-5 hover:text-ink transition-colors duration-150 cursor-pointer"
        >
          {expanded ? "Collapse" : "Continue reading"}
        </button>
      )}
    </div>
  )
}

// ── Entry components ────────────────────────────────────────────────────────

function NoteBody({ body }: { body: string }) {
  const paragraphs = body.split(/\r?\n\r?\n/).filter(Boolean)
  return (
    <div className="space-y-3">
      {paragraphs.map((p, i) => (
        <p key={i} className="text-[0.9375rem] leading-[1.6] text-ink-muted hyphens-auto break-words">
          {withSoftHyphens(p.replace(/\r?\n/g, " "))}
        </p>
      ))}
    </div>
  )
}

function NoteEntry({ entry }: { entry: Extract<LogEntry, { type: "note" }> }) {
  // Notes are always 2-col; no image support at level 1
  return (
    <div className="grid grid-cols-[9rem_1fr] gap-x-8 py-2.5">
      <DateLabel date={entry.date} />
      <NoteBody body={entry.body} />
    </div>
  )
}

function UpdateEntry({ entry }: { entry: Extract<LogEntry, { type: "update" }> }) {
  // 3-col grid when image present; 2-col when not.
  // Both grid strings must appear literally for Tailwind v4 to include them.
  const hasImage = !!entry.image
  return (
    <div className={cn(
      "grid gap-x-8 py-7",
      hasImage ? "grid-cols-[9rem_240px_1fr]" : "grid-cols-[9rem_1fr]"
    )}>
      <div className="pt-0.5">
        <DateLabel date={entry.date} />
      </div>
      {hasImage && <CoverImageColumn image={entry.image!} />}
      <div>
        <p className="eyebrow text-ink-faint mb-2">{entry.category} Update</p>
        <h3 className="text-[1.1875rem] font-semibold tracking-[-0.02em] text-ink-strong mb-3 leading-snug">
          {entry.heading}
        </h3>
        <BodyText body={entry.body} />
      </div>
    </div>
  )
}

function MilestoneEntry({ entry }: { entry: Extract<LogEntry, { type: "milestone" }> }) {
  const hasImage = !!entry.image
  return (
    <div className="py-10">
      {/* hairlines span the full row width, outside the inner grid */}
      <div role="separator" className="hairline mb-9" />
      <div className={cn(
        "grid gap-x-8",
        hasImage ? "grid-cols-[9rem_240px_1fr]" : "grid-cols-[9rem_1fr]"
      )}>
        <div className="pt-1">
          <DateLabel date={entry.date} />
        </div>
        {hasImage && <CoverImageColumn image={entry.image!} />}
        <div>
          <h2 className="text-[1.75rem] font-bold tracking-[-0.03em] text-ink-strong mb-5 leading-[1.1]">
            Milestone: {entry.heading}
          </h2>
          <BodyText body={entry.body} />
        </div>
      </div>
      <div role="separator" className="hairline mt-9" />
    </div>
  )
}

function DispatchEntry({ entry }: { entry: Extract<LogEntry, { type: "dispatch" }> }) {
  const hasImage = !!entry.image
  return (
    <div className="py-12">
      <div role="separator" className="hairline mb-10" />
      <div className={cn(
        "grid gap-x-8",
        hasImage ? "grid-cols-[9rem_240px_1fr]" : "grid-cols-[9rem_1fr]"
      )}>
        <div className="pt-1.5">
          <DateLabel date={entry.date} />
        </div>
        {hasImage && <CoverImageColumn image={entry.image!} />}
        <div>
          <h2 className="text-[2rem] font-bold tracking-[-0.03em] text-ink-strong mb-6 leading-[1.05]">
            Dispatch: {entry.heading}
          </h2>
          {/* ExpandableBody uses pixel-based clamping — see DISPATCH_COLLAPSE_HEIGHT_PX */}
          <ExpandableBody body={entry.body} />
        </div>
      </div>
    </div>
  )
}

// ── Public export ────────────────────────────────────────────────────────────

type Props = {
  entry: LogEntry
  showDate: boolean
}

export function LogEntryItem({ entry, showDate }: Props) {
  switch (entry.type) {
    case "note":
      if (!showDate) {
        // Same-date follow-on note: keep grid alignment, suppress redundant date
        return (
          <div className="grid grid-cols-[9rem_1fr] gap-x-8 py-2.5">
            <div />
            <NoteBody body={entry.body} />
          </div>
        )
      }
      return <NoteEntry entry={entry} />
    case "update":
      return <UpdateEntry entry={entry} />
    case "milestone":
      return <MilestoneEntry entry={entry} />
    case "dispatch":
      return <DispatchEntry entry={entry} />
  }
}

export function entrySpacingClass(type: EntryType): string {
  return cn(type === "note" && "divide-y-0")
}

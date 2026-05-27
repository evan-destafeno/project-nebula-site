"use client"

import {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
  useTransition,
  type ChangeEvent,
} from "react"
import { cn } from "@/lib/utils"
import { IMAGE_SIZES, type ImageOrientation } from "@/lib/log-types"
import { createPost, logout, getSameDayEntries, type SameDayEntry } from "@/app/admin/actions"

// ── Constants ─────────────────────────────────────────────────────────────────

type Level = "note" | "update" | "milestone" | "dispatch"

const LEVELS: { value: Level; label: string }[] = [
  { value: "note",      label: "Note" },
  { value: "update",    label: "Update" },
  { value: "milestone", label: "Milestone" },
  { value: "dispatch",  label: "Dispatch" },
]

const CATEGORIES = [
  "HARDWARE",
  "SOFTWARE",
  "NAVIGATION",
  "MECHANICAL",
  "ELECTRICAL",
  "TESTING",
]

// Matches the public page constant — used to detect whether the preview body overflows
const DISPATCH_COLLAPSE_HEIGHT_PX = 400

// ── Canvas image resize ───────────────────────────────────────────────────────

// Center-crop the source image to targetW × targetH using Canvas.
// Returns a JPEG blob at 92% quality, at 2× resolution for retina.
async function resizeImage(
  file: File,
  orientation: ImageOrientation
): Promise<{ blob: Blob; dataUrl: string }> {
  const display = IMAGE_SIZES[orientation]
  // Store at 2× for retina — matches the public page Image component which
  // displays at display.width × display.height but requests 2× via srcset.
  const targetW = display.width * 2
  const targetH = display.height * 2

  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      const srcAspect = img.naturalWidth / img.naturalHeight
      const dstAspect = targetW / targetH

      let sx: number, sy: number, sw: number, sh: number
      if (srcAspect > dstAspect) {
        // Source is wider — crop sides
        sh = img.naturalHeight
        sw = img.naturalHeight * dstAspect
        sx = (img.naturalWidth - sw) / 2
        sy = 0
      } else {
        // Source is taller — crop top/bottom
        sw = img.naturalWidth
        sh = img.naturalWidth / dstAspect
        sx = 0
        sy = (img.naturalHeight - sh) / 2
      }

      const canvas = document.createElement("canvas")
      canvas.width = targetW
      canvas.height = targetH
      const ctx = canvas.getContext("2d")!
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetW, targetH)

      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error("canvas toBlob failed")); return }
          const reader = new FileReader()
          reader.onload = () => resolve({ blob, dataUrl: reader.result as string })
          reader.onerror = reject
          reader.readAsDataURL(blob)
        },
        "image/jpeg",
        0.92
      )
    }

    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error("Image load failed")) }
    img.src = objectUrl
  })
}

// ── Preview components ────────────────────────────────────────────────────────

// Mirrors NoteBody from log-entry.tsx — keep in sync if that component changes.
function PreviewNoteBody({ body }: { body: string }) {
  const paragraphs = body.split(/\r?\n\r?\n/).filter(Boolean)
  if (paragraphs.length === 0) {
    return (
      <p className="text-[0.9375rem] leading-[1.6] text-ink-faint italic">
        Body text will appear here…
      </p>
    )
  }
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

// Mirrors BodyText from log-entry.tsx — keep in sync if that component changes.
function PreviewBodyText({ body }: { body: string }) {
  const paragraphs = body.split(/\r?\n\r?\n/).filter(Boolean)
  return (
    <div className="space-y-4">
      {paragraphs.map((p, i) => (
        <p key={i} className="text-[1.0rem] leading-[1.65] text-ink-muted text-wrap-pretty hyphens-auto break-words">
          {withSoftHyphens(p.replace(/\r?\n/g, " ")) || <span className="text-ink-faint italic">Empty paragraph</span>}
        </p>
      ))}
    </div>
  )
}

// Same soft-hyphen insertion as log-entry.tsx — must stay in sync.
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

// Dispatch bodies collapse at 400px — same threshold as the public page.
// Measures scrollHeight after every render so the indicator stays in sync
// as the author types (one frame behind is acceptable for a live preview).
function DispatchPreviewBody({ body }: { body: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [overflows, setOverflows] = useState(false)

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return
    setOverflows(el.scrollHeight > DISPATCH_COLLAPSE_HEIGHT_PX)
  })

  return (
    <div>
      <div
        ref={containerRef}
        style={{ maxHeight: `${DISPATCH_COLLAPSE_HEIGHT_PX}px`, overflow: "hidden" }}
      >
        <PreviewBodyText body={body} />
      </div>
      {overflows && (
        <p className="eyebrow text-ink-faint mt-5">
          Continue reading (public page shows expand button)
        </p>
      )}
    </div>
  )
}

// Renders the entry at the same grid layout as the public log page so the
// image height validation measurement is accurate.
function LivePreview({
  level,
  date,
  heading,
  category,
  body,
  imageDataUrl,
  imageOrientation,
  col2Ref,
  col15Ref,
}: {
  level: Level
  date: string
  heading: string
  category: string
  body: string
  imageDataUrl: string | null
  imageOrientation: ImageOrientation
  col2Ref: React.RefObject<HTMLDivElement | null>
  col15Ref: React.RefObject<HTMLDivElement | null>
}) {
  const hasImage = !!imageDataUrl
  const imgSize = IMAGE_SIZES[imageOrientation]

  const formattedDate = (() => {
    if (!date) return "Date TBD"
    const [y, m, d] = date.split("-")
    const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"]
    const mi = parseInt(m) - 1
    return isNaN(mi) ? date : `${d} ${months[mi]} ${y.slice(2)}`
  })()

  const gridClass = cn(
    "grid gap-x-8",
    hasImage ? "grid-cols-[9rem_240px_1fr]" : "grid-cols-[9rem_1fr]"
  )

  const imageColumn = hasImage ? (
    <div
      ref={col15Ref}
      data-log-col15
      className="self-start shrink-0 rounded-[3px] bg-paper-base overflow-hidden"
      style={{ width: imgSize.width, height: imgSize.height }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageDataUrl!}
        alt=""
        aria-hidden="true"
        className="h-full w-full object-cover object-center"
      />
    </div>
  ) : null

  const dateEl = (
    <time dateTime={date} className="eyebrow text-ink-faint shrink-0 pt-px block">
      {formattedDate}
    </time>
  )

  if (level === "note") {
    return (
      <div className="grid grid-cols-[9rem_1fr] gap-x-8 py-2.5">
        <div className="pt-0.5">{dateEl}</div>
        <div ref={col2Ref} data-log-col2>
          <PreviewNoteBody body={body} />
        </div>
      </div>
    )
  }

  if (level === "update") {
    return (
      <div className={cn(gridClass, "py-7")}>
        <div className="pt-0.5">{dateEl}</div>
        {imageColumn}
        <div ref={col2Ref} data-log-col2>
          <p className="eyebrow text-ink-faint mb-2">{category || "CATEGORY"} Update</p>
          <h3 className="text-[1.1875rem] font-semibold tracking-[-0.02em] text-ink-strong mb-3 leading-snug">
            {heading || <span className="text-ink-faint italic">Heading…</span>}
          </h3>
          <PreviewBodyText body={body} />
        </div>
      </div>
    )
  }

  if (level === "milestone") {
    return (
      <div className="py-10">
        <div role="separator" className="hairline mb-9" />
        <div className={gridClass}>
          <div className="pt-1">{dateEl}</div>
          {imageColumn}
          <div ref={col2Ref} data-log-col2>
            <h2 className="text-[1.75rem] font-bold tracking-[-0.03em] text-ink-strong mb-5 leading-[1.1]">
              Milestone: {heading || <span className="text-ink-faint italic">Heading…</span>}
            </h2>
            <PreviewBodyText body={body} />
          </div>
        </div>
        <div role="separator" className="hairline mt-9" />
      </div>
    )
  }

  // dispatch
  return (
    <div className="py-12">
      <div role="separator" className="hairline mb-10" />
      <div className={gridClass}>
        <div className="pt-1.5">{dateEl}</div>
        {imageColumn}
        <div ref={col2Ref} data-log-col2>
          <h2 className="text-[2rem] font-bold tracking-[-0.03em] text-ink-strong mb-6 leading-[1.05]">
            Dispatch: {heading || <span className="text-ink-faint italic">Heading…</span>}
          </h2>
          <DispatchPreviewBody body={body} />
        </div>
      </div>
    </div>
  )
}

// ── Form field components ─────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="eyebrow text-ink-faint block mb-2">{children}</label>
}

function TextInput({
  value,
  onChange,
  placeholder,
  required,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  required?: boolean
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      className="w-full bg-paper-base border border-rule rounded-[3px] px-3 py-2.5 text-[0.9375rem] text-ink placeholder:text-ink-faint focus:outline-none focus:ring-1 focus:ring-accent-base"
    />
  )
}

function TextArea({
  value,
  onChange,
  placeholder,
  rows = 8,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full bg-paper-base border border-rule rounded-[3px] px-3 py-2.5 text-[0.9375rem] text-ink placeholder:text-ink-faint focus:outline-none focus:ring-1 focus:ring-accent-base resize-y font-mono text-sm leading-relaxed"
    />
  )
}

// ── Position picker sub-components ───────────────────────────────────────────

function entryLabel(e: SameDayEntry): string {
  if (e.type === "note") return `Note — "${e.bodyPreview}"`
  if (e.type === "update") return `${e.category} Update — ${e.heading}`
  if (e.type === "milestone") return `Milestone: ${e.heading}`
  if (e.type === "dispatch") return `Dispatch: ${e.heading}`
  return e.slug
}

function PositionSlot({ active, onClick, label }: {
  active: boolean
  onClick: () => void
  label?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2 px-2 py-1 rounded-[3px] transition-colors duration-100 cursor-pointer group",
        active ? "bg-accent-wash" : "hover:bg-paper-base"
      )}
    >
      <span className={cn(
        "h-px flex-1 transition-colors duration-100",
        active ? "bg-accent-bright" : "bg-rule group-hover:bg-ink-faint"
      )} />
      <span className={cn(
        "eyebrow text-[0.6rem] transition-colors duration-100 shrink-0",
        active ? "text-accent-bright" : "text-ink-faint group-hover:text-ink-muted"
      )}>
        {active ? "↑ New post here" : label ?? "Insert here"}
      </span>
      <span className={cn(
        "h-px flex-1 transition-colors duration-100",
        active ? "bg-accent-bright" : "bg-rule group-hover:bg-ink-faint"
      )} />
    </button>
  )
}

function ExistingEntryChip({ entry }: { entry: SameDayEntry }) {
  return (
    <div className="px-2 py-1.5">
      <p className="eyebrow text-ink-faint text-[0.6rem] truncate">{entryLabel(entry)}</p>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function PostForm() {
  // Form state — values persist across level changes
  const [level, setLevel] = useState<Level>("update")
  const [date, setDate] = useState("")
  const [heading, setHeading] = useState("")
  const [category, setCategory] = useState(CATEGORIES[0])
  const [body, setBody] = useState("")

  // Image state
  const [imageEnabled, setImageEnabled] = useState(false)
  const [imageOrientation, setImageOrientation] = useState<ImageOrientation>("horizontal")
  const [imageBlob, setImageBlob] = useState<Blob | null>(null)
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)
  const [imageProcessing, setImageProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Same-day ordering
  const [sameDayEntries, setSameDayEntries] = useState<SameDayEntry[]>([])
  const [insertPosition, setInsertPosition] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0) // bump to re-fetch after posting

  useEffect(() => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setSameDayEntries([])
      return
    }
    let cancelled = false
    getSameDayEntries(date).then((entries) => {
      if (cancelled) return
      setSameDayEntries(entries)
      setInsertPosition(entries.length) // default: after all existing entries
    }).catch(() => {})
    return () => { cancelled = true }
  }, [date, refreshKey])

  // Submission state
  const [isPending, startTransition] = useTransition()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)

  // Height validation — measure preview columns
  const col2Ref = useRef<HTMLDivElement | null>(null)
  const col15Ref = useRef<HTMLDivElement | null>(null)

  // Level change: disable image if switching to note
  const handleLevelChange = (next: Level) => {
    setLevel(next)
    if (next === "note") setImageEnabled(false)
  }

  // Process image when file or orientation changes
  const processImage = useCallback(
    async (file: File, orientation: ImageOrientation) => {
      setImageProcessing(true)
      setImageError(null)
      try {
        const { blob, dataUrl } = await resizeImage(file, orientation)
        setImageBlob(blob)
        setImageDataUrl(dataUrl)
      } catch (err) {
        setImageError("Could not process image. Try a different file.")
        setImageBlob(null)
        setImageDataUrl(null)
      } finally {
        setImageProcessing(false)
      }
    },
    []
  )

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await processImage(file, imageOrientation)
  }

  const handleOrientationChange = async (next: ImageOrientation) => {
    setImageOrientation(next)
    const file = fileInputRef.current?.files?.[0]
    if (file) await processImage(file, next)
  }

  // Validate col heights before submitting — returns error string or null
  const validateImageHeight = (): string | null => {
    if (!imageEnabled || !imageDataUrl) return null
    const col2 = col2Ref.current
    const col15 = col15Ref.current
    if (!col2 || !col15) return null
    const contentH = col2.getBoundingClientRect().height
    const imageH = col15.getBoundingClientRect().height
    if (imageH > contentH) {
      const orient = imageOrientation === "vertical" ? "vertical (360px)" : "horizontal (160px)"
      return `Content is too short for a ${orient} image. Write more body text or switch to horizontal.`
    }
    return null
  }

  const buildFormData = (): FormData => {
    const fd = new FormData()
    fd.append("type", level)
    fd.append("date", date)
    fd.append("body", body)
    fd.append("position", String(insertPosition))
    if (heading) fd.append("heading", heading)
    if (level === "update") fd.append("category", category)
    if (imageEnabled && imageBlob) {
      fd.append("image", new File([imageBlob], "image.jpg", { type: "image/jpeg" }))
      fd.append("imageOrientation", imageOrientation)
    }
    return fd
  }

  const resetImageState = () => {
    setImageBlob(null)
    setImageDataUrl(null)
    setImageError(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleSubmit = (mode: "stay" | "done") => {
    setSubmitError(null)
    setFlash(null)

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setSubmitError("Select a valid date before posting.")
      return
    }

    const heightErr = validateImageHeight()
    if (heightErr) { setSubmitError(heightErr); return }

    startTransition(async () => {
      try {
        const fd = buildFormData()
        const result = await createPost({ error: null, success: false }, fd)

        if (result.error) {
          setSubmitError(result.error)
          return
        }

        if (mode === "stay") {
          // Clear content fields, keep date and level so the next post is quick
          setHeading("")
          setBody("")
          setImageEnabled(false)
          resetImageState()
          setRefreshKey((k) => k + 1) // re-fetch same-day entries (now includes the new post)
          setFlash("Posted.")
          setTimeout(() => setFlash(null), 3000)
        } else {
          // Clear cookie and return to /log
          await logout()
        }
      } catch (err) {
        setSubmitError("Unexpected error — post may not have saved. Check the console.")
        console.error("[handleSubmit]", err)
      }
    })
  }

  const supportsImage = level !== "note"

  return (
    <div className="flex flex-1 divide-x divide-rule overflow-hidden">

        {/* ── Left: form ──────────────────────────────────────────────── */}
        <div className="w-[480px] shrink-0 flex flex-col px-8 py-8 gap-6 overflow-y-auto">

          {/* Date — native picker enforces YYYY-MM-DD format */}
          <div>
            <FieldLabel>Date</FieldLabel>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full bg-paper-base border border-rule rounded-[3px] px-3 py-2.5 text-[0.9375rem] text-ink focus:outline-none focus:ring-1 focus:ring-accent-base [color-scheme:dark]"
            />
            <p className="eyebrow text-ink-faint mt-1.5 text-[0.625rem]">
              Required. Backdating is fine.
            </p>
          </div>

          {/* Position picker — only when other posts exist on this date */}
          {sameDayEntries.length > 0 && (
            <div>
              <FieldLabel>Position on {date}</FieldLabel>
              <div className="space-y-px">
                {/* Slot: before the first existing entry */}
                <PositionSlot
                  active={insertPosition === 0}
                  onClick={() => setInsertPosition(0)}
                  label="Top"
                />
                {sameDayEntries.map((e, idx) => (
                  <div key={e.slug}>
                    <ExistingEntryChip entry={e} />
                    <PositionSlot
                      active={insertPosition === idx + 1}
                      onClick={() => setInsertPosition(idx + 1)}
                      label={idx === sameDayEntries.length - 1 ? "Bottom (default)" : undefined}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Level pill */}
          <div>
            <FieldLabel>Level</FieldLabel>
            <div className="flex rounded-[4px] border border-rule overflow-hidden">
              {LEVELS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleLevelChange(value)}
                  className={cn(
                    "flex-1 py-2 text-center eyebrow transition-colors duration-150 cursor-pointer",
                    level === value
                      ? "bg-accent-base text-ink-strong"
                      : "text-ink-faint hover:text-ink hover:bg-paper-base"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Category — update only */}
          {level === "update" && (
            <div>
              <FieldLabel>Category</FieldLabel>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-paper-base border border-rule rounded-[3px] px-3 py-2.5 text-[0.9375rem] text-ink focus:outline-none focus:ring-1 focus:ring-accent-base cursor-pointer"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}

          {/* Heading — update, milestone, dispatch */}
          {level !== "note" && (
            <div>
              <FieldLabel>Heading</FieldLabel>
              <TextInput
                value={heading}
                onChange={setHeading}
                placeholder={
                  level === "update" ? "IMU Calibration Complete" :
                  level === "milestone" ? "Thruster Array Commissioned" :
                  "Pool Trial 3: Field Notes"
                }
                required
              />
            </div>
          )}

          {/* Body */}
          <div>
            <FieldLabel>Body</FieldLabel>
            <TextArea
              value={body}
              onChange={setBody}
              placeholder={
                level === "note"
                  ? "One to three sentences."
                  : "Paragraphs separated by blank lines.\n\nSecond paragraph here."
              }
              rows={level === "dispatch" ? 14 : 8}
            />
            <p className="eyebrow text-ink-faint mt-1.5 text-[0.625rem]">
              Separate paragraphs with a blank line. No markdown.
            </p>
          </div>

          {/* Image — level 2+ only */}
          {supportsImage && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <FieldLabel>Cover image</FieldLabel>
                <button
                  type="button"
                  onClick={() => {
                    setImageEnabled((v) => !v)
                    if (imageEnabled) resetImageState()
                  }}
                  className={cn(
                    "eyebrow transition-colors duration-150 cursor-pointer",
                    imageEnabled ? "text-accent-bright hover:text-ink" : "text-ink-faint hover:text-ink"
                  )}
                >
                  {imageEnabled ? "Remove" : "Add image"}
                </button>
              </div>

              {imageEnabled && (
                <div className="space-y-3">
                  {/* Orientation picker */}
                  <div className="flex rounded-[4px] border border-rule overflow-hidden">
                    {(["horizontal", "vertical"] as ImageOrientation[]).map((o) => {
                      const size = IMAGE_SIZES[o]
                      return (
                        <button
                          key={o}
                          type="button"
                          onClick={() => handleOrientationChange(o)}
                          className={cn(
                            "flex-1 py-2 text-center eyebrow transition-colors duration-150 cursor-pointer",
                            imageOrientation === o
                              ? "bg-paper-base text-ink"
                              : "text-ink-faint hover:text-ink"
                          )}
                        >
                          {o === "horizontal" ? "Horizontal" : "Vertical"}
                          <span className="block text-ink-faint text-[0.55rem] mt-0.5">
                            {size.width}×{size.height}
                          </span>
                        </button>
                      )
                    })}
                  </div>

                  {/* File input */}
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="w-full text-[0.875rem] text-ink-muted file:mr-3 file:py-1.5 file:px-3 file:rounded-[3px] file:border file:border-rule file:bg-paper-base file:text-ink-muted file:text-[0.8125rem] file:cursor-pointer hover:file:text-ink"
                    />
                    <p className="eyebrow text-ink-faint mt-1.5 text-[0.625rem]">
                      Will be cropped and resized to {IMAGE_SIZES[imageOrientation].width * 2}×{IMAGE_SIZES[imageOrientation].height * 2}px (2× retina).
                    </p>
                  </div>

                  {imageProcessing && (
                    <p className="eyebrow text-ink-faint">Processing image…</p>
                  )}
                  {imageError && (
                    <p className="eyebrow text-[oklch(0.65_0.20_28)]">{imageError}</p>
                  )}
                  {imageDataUrl && !imageProcessing && (
                    <p className="eyebrow text-mission">
                      Image ready — {IMAGE_SIZES[imageOrientation].width}×{IMAGE_SIZES[imageOrientation].height}px displayed
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Error / flash */}
          {submitError && (
            <p className="eyebrow text-[oklch(0.65_0.20_28)]">{submitError}</p>
          )}
          {flash && (
            <p className="eyebrow text-mission">{flash}</p>
          )}

          {/* Submit buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => handleSubmit("stay")}
              disabled={isPending || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !body}
              className="flex-1 bg-accent-base text-ink-strong rounded-[4px] px-4 py-2.5 text-[0.875rem] font-medium hover:bg-accent-bright transition-colors duration-150 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              {isPending ? "Posting…" : "Post and stay"}
            </button>
            <button
              type="button"
              onClick={() => handleSubmit("done")}
              disabled={isPending || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !body}
              className="flex-1 border border-rule text-ink-muted rounded-[4px] px-4 py-2.5 text-[0.875rem] hover:text-ink hover:border-ink-faint transition-colors duration-150 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              {isPending ? "Posting…" : "Post and done"}
            </button>
          </div>
        </div>

        {/* ── Right: live preview ──────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-10 py-8">
          <p className="eyebrow text-ink-faint mb-6">Preview</p>
          <div className="max-w-[900px]">
            <LivePreview
              level={level}
              date={date}
              heading={heading}
              category={category}
              body={body}
              imageDataUrl={imageEnabled ? imageDataUrl : null}
              imageOrientation={imageOrientation}
              col2Ref={col2Ref}
              col15Ref={col15Ref}
            />
          </div>
        </div>
      </div>
  )
}

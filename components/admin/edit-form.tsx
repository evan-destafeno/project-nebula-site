"use client"

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useLayoutEffect,
  useTransition,
  type ChangeEvent,
} from "react"
import { cn } from "@/lib/utils"
import { IMAGE_SIZES, type ImageOrientation } from "@/lib/log-types"
import {
  getAllPosts,
  updatePost,
  deletePost,
  type PostListItem,
} from "@/app/admin/actions"

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORIES = [
  "HARDWARE",
  "SOFTWARE",
  "NAVIGATION",
  "MECHANICAL",
  "ELECTRICAL",
  "TESTING",
]

const DISPATCH_COLLAPSE_HEIGHT_PX = 400

// ── Pure utilities (mirrored from post-form / log-entry — keep in sync) ───────

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

async function resizeImage(
  file: File,
  orientation: ImageOrientation
): Promise<{ blob: Blob; dataUrl: string }> {
  const display = IMAGE_SIZES[orientation]
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
        sh = img.naturalHeight; sw = img.naturalHeight * dstAspect
        sx = (img.naturalWidth - sw) / 2; sy = 0
      } else {
        sw = img.naturalWidth; sh = img.naturalWidth / dstAspect
        sx = 0; sy = (img.naturalHeight - sh) / 2
      }
      const canvas = document.createElement("canvas")
      canvas.width = targetW; canvas.height = targetH
      canvas.getContext("2d")!.drawImage(img, sx, sy, sw, sh, 0, 0, targetW, targetH)
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

// ── Preview components (mirrored from post-form) ──────────────────────────────

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

function PreviewNoteBody({ body }: { body: string }) {
  const paragraphs = body.split(/\r?\n\r?\n/).filter(Boolean)
  if (paragraphs.length === 0) {
    return <p className="text-[0.9375rem] leading-[1.6] text-ink-faint italic">Body text will appear here…</p>
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
      <div ref={containerRef} style={{ maxHeight: `${DISPATCH_COLLAPSE_HEIGHT_PX}px`, overflow: "hidden" }}>
        <PreviewBodyText body={body} />
      </div>
      {overflows && (
        <p className="eyebrow text-ink-faint mt-5">Continue reading (public page shows expand button)</p>
      )}
    </div>
  )
}

// Mirrors LivePreview in post-form.tsx — keep in sync.
function EditPreview({
  post,
  heading,
  category,
  body,
  previewImageSrc,
  imageOrientation,
  col2Ref,
  col15Ref,
}: {
  post: PostListItem
  heading: string
  category: string
  body: string
  previewImageSrc: string | null
  imageOrientation: ImageOrientation
  col2Ref: React.RefObject<HTMLDivElement | null>
  col15Ref: React.RefObject<HTMLDivElement | null>
}) {
  const hasImage = !!previewImageSrc
  const imgSize = IMAGE_SIZES[imageOrientation]

  const gridClass = cn(
    "grid gap-x-8",
    hasImage ? "grid-cols-[9rem_240px_1fr]" : "grid-cols-[9rem_1fr]"
  )

  const dateEl = (
    <time dateTime={post.date} className="eyebrow text-ink-faint shrink-0 pt-px block">
      {formatDate(post.date)}
    </time>
  )

  const imageColumn = hasImage ? (
    <div
      ref={col15Ref}
      data-log-col15
      className="self-start shrink-0 rounded-[3px] bg-paper-base overflow-hidden"
      style={{ width: imgSize.width, height: imgSize.height }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={previewImageSrc!} alt="" aria-hidden="true" className="h-full w-full object-cover object-center" />
    </div>
  ) : null

  if (post.type === "note") {
    return (
      <div className="grid grid-cols-[9rem_1fr] gap-x-8 py-2.5">
        <div className="pt-0.5">{dateEl}</div>
        <div ref={col2Ref} data-log-col2>
          <PreviewNoteBody body={body} />
        </div>
      </div>
    )
  }

  if (post.type === "update") {
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

  if (post.type === "milestone") {
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

// ── List helpers ──────────────────────────────────────────────────────────────

function typeLabel(post: PostListItem): string {
  if (post.type === "update") return `${post.category ?? "?"} Update`
  if (post.type === "milestone") return "Milestone"
  if (post.type === "dispatch") return "Dispatch"
  return "Note"
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="eyebrow text-ink-faint block mb-2">{children}</label>
}

// ── Edit form (shown when a list item is expanded) ────────────────────────────

function EditPostForm({
  post,
  onDeleted,
  onUpdated,
}: {
  post: PostListItem
  onDeleted: () => void
  onUpdated: (updated: PostListItem) => void
}) {
  const isNote = post.type === "note"
  const supportsImage = !isNote

  const [heading, setHeading] = useState(post.heading ?? "")
  const [category, setCategory] = useState(post.category ?? CATEGORIES[0])
  const [body, setBody] = useState(post.body)

  // Image action: "keep" existing, "replace" with new upload, or "remove"
  type ImageAction = "keep" | "replace" | "remove"
  const [imageAction, setImageAction] = useState<ImageAction>("keep")
  const [imageOrientation, setImageOrientation] = useState<ImageOrientation>(
    (post.image?.orientation as ImageOrientation) ?? "horizontal"
  )
  const [imageBlob, setImageBlob] = useState<Blob | null>(null)
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)
  const [imageProcessing, setImageProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const col2Ref = useRef<HTMLDivElement | null>(null)
  const col15Ref = useRef<HTMLDivElement | null>(null)

  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Clear replacement blob when switching away from "replace"
  useEffect(() => {
    if (imageAction !== "replace") {
      setImageBlob(null)
      setImageDataUrl(null)
      setImageError(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }, [imageAction])

  const processImage = useCallback(async (file: File, orientation: ImageOrientation) => {
    setImageProcessing(true)
    setImageError(null)
    try {
      const { blob, dataUrl } = await resizeImage(file, orientation)
      setImageBlob(blob)
      setImageDataUrl(dataUrl)
    } catch {
      setImageError("Could not process image.")
      setImageBlob(null)
      setImageDataUrl(null)
    } finally {
      setImageProcessing(false)
    }
  }, [])

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

  // Resolve what the preview should display for the image column
  const previewImageSrc: string | null = (() => {
    if (!supportsImage) return null
    if (imageAction === "remove") return null
    if (imageAction === "replace") return imageDataUrl
    return post.image?.src ?? null // "keep"
  })()

  const previewOrientation: ImageOrientation =
    imageAction === "replace" ? imageOrientation :
    (post.image?.orientation as ImageOrientation) ?? "horizontal"

  const validateImageHeight = (): string | null => {
    if (!previewImageSrc) return null
    const col2 = col2Ref.current
    const col15 = col15Ref.current
    if (!col2 || !col15) return null
    const contentH = col2.getBoundingClientRect().height
    const imageH = col15.getBoundingClientRect().height
    if (imageH > contentH) {
      const orient = previewOrientation === "vertical" ? "vertical (360px)" : "horizontal (160px)"
      return `Content too short for a ${orient} image. Write more body text or switch to horizontal.`
    }
    return null
  }

  const handleUpdate = () => {
    setError(null)
    setFlash(null)

    const heightErr = validateImageHeight()
    if (heightErr) { setError(heightErr); return }

    startTransition(async () => {
      try {
        const fd = new FormData()
        fd.append("body", body)
        if (heading) fd.append("heading", heading)
        if (post.type === "update") fd.append("category", category)
        if (imageAction === "remove") {
          fd.append("removeImage", "true")
        } else if (imageAction === "replace" && imageBlob) {
          fd.append("image", new File([imageBlob], "image.jpg", { type: "image/jpeg" }))
          fd.append("imageOrientation", imageOrientation)
        }

        const result = await updatePost(post.slug, fd)
        if (result.error) { setError(result.error); return }
        if (result.post) onUpdated(result.post)
        setFlash("Updated.")
        setTimeout(() => setFlash(null), 3000)
      } catch (err) {
        setError("Unexpected error — post may not have been updated.")
        console.error("[EditPostForm update]", err)
      }
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      try {
        const result = await deletePost(post.slug)
        if (result.error) { setDeleteError(result.error); return }
        onDeleted()
      } catch (err) {
        setDeleteError("Unexpected error — post may not have been deleted.")
        console.error("[EditPostForm delete]", err)
      }
    })
  }

  return (
    <div className="flex divide-x divide-rule border-t border-rule">
      {/* ── Left: form ──────────────────────────────────────────────────── */}
      <div className="w-[480px] shrink-0 flex flex-col px-8 py-6 gap-5 overflow-y-auto">

        {/* Type + date (read-only) */}
        <div className="flex items-center gap-3">
          <span className="eyebrow text-ink-faint border border-rule rounded-[3px] px-2 py-1">
            {typeLabel(post)}
          </span>
          <span className="eyebrow text-ink-faint">{formatDate(post.date)}</span>
        </div>

        {/* Category (update only) */}
        {post.type === "update" && (
          <div>
            <FieldLabel>Category</FieldLabel>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-paper-base border border-rule rounded-[3px] px-3 py-2.5 text-[0.9375rem] text-ink focus:outline-none focus:ring-1 focus:ring-accent-base cursor-pointer"
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}

        {/* Heading (non-note) */}
        {!isNote && (
          <div>
            <FieldLabel>Heading</FieldLabel>
            <input
              type="text"
              value={heading}
              onChange={(e) => setHeading(e.target.value)}
              className="w-full bg-paper-base border border-rule rounded-[3px] px-3 py-2.5 text-[0.9375rem] text-ink placeholder:text-ink-faint focus:outline-none focus:ring-1 focus:ring-accent-base"
            />
          </div>
        )}

        {/* Body */}
        <div>
          <FieldLabel>Body</FieldLabel>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={post.type === "dispatch" ? 12 : 7}
            className="w-full bg-paper-base border border-rule rounded-[3px] px-3 py-2.5 text-[0.9375rem] text-ink focus:outline-none focus:ring-1 focus:ring-accent-base resize-y font-mono text-sm leading-relaxed"
          />
          <p className="eyebrow text-ink-faint mt-1.5 text-[0.625rem]">Blank line = new paragraph.</p>
        </div>

        {/* Image (level 2+ only) */}
        {supportsImage && (
          <div>
            <FieldLabel>Image</FieldLabel>
            <div className="flex rounded-[4px] border border-rule overflow-hidden mb-3">
              {post.image ? (
                (["keep", "replace", "remove"] as const).map((action) => (
                  <button
                    key={action}
                    type="button"
                    onClick={() => setImageAction(action)}
                    className={cn(
                      "flex-1 py-2 text-center eyebrow capitalize transition-colors duration-150 cursor-pointer",
                      imageAction === action ? "bg-paper-base text-ink" : "text-ink-faint hover:text-ink"
                    )}
                  >
                    {action}
                  </button>
                ))
              ) : (
                <button
                  type="button"
                  onClick={() => setImageAction(imageAction === "replace" ? "keep" : "replace")}
                  className={cn(
                    "flex-1 py-2 text-center eyebrow transition-colors duration-150 cursor-pointer",
                    imageAction === "replace" ? "bg-paper-base text-ink" : "text-ink-faint hover:text-ink"
                  )}
                >
                  {imageAction === "replace" ? "Cancel image" : "Add image"}
                </button>
              )}
            </div>

            {imageAction === "replace" && (
              <div className="space-y-3">
                <div className="flex rounded-[4px] border border-rule overflow-hidden">
                  {(["horizontal", "vertical"] as ImageOrientation[]).map((o) => (
                    <button
                      key={o}
                      type="button"
                      onClick={() => handleOrientationChange(o)}
                      className={cn(
                        "flex-1 py-2 text-center eyebrow transition-colors duration-150 cursor-pointer",
                        imageOrientation === o ? "bg-paper-base text-ink" : "text-ink-faint hover:text-ink"
                      )}
                    >
                      {o === "horizontal" ? "Horizontal" : "Vertical"}
                      <span className="block text-ink-faint text-[0.55rem] mt-0.5">
                        {IMAGE_SIZES[o].width}×{IMAGE_SIZES[o].height}
                      </span>
                    </button>
                  ))}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full text-[0.875rem] text-ink-muted file:mr-3 file:py-1.5 file:px-3 file:rounded-[3px] file:border file:border-rule file:bg-paper-base file:text-ink-muted file:text-[0.8125rem] file:cursor-pointer hover:file:text-ink"
                />
                {imageProcessing && <p className="eyebrow text-ink-faint">Processing…</p>}
                {imageError && <p className="eyebrow text-[oklch(0.65_0.20_28)]">{imageError}</p>}
                {imageDataUrl && !imageProcessing && (
                  <p className="eyebrow text-mission">
                    Image ready — {IMAGE_SIZES[imageOrientation].width}×{IMAGE_SIZES[imageOrientation].height}px displayed
                  </p>
                )}
              </div>
            )}

            {imageAction === "remove" && post.image && (
              <p className="eyebrow text-[oklch(0.65_0.20_28)] text-[0.625rem]">
                Image file will be deleted on update.
              </p>
            )}
          </div>
        )}

        {/* Error / flash */}
        {error && <p className="eyebrow text-[oklch(0.65_0.20_28)]">{error}</p>}
        {flash && <p className="eyebrow text-mission">{flash}</p>}

        {/* Action row */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleUpdate}
            disabled={isPending || !body}
            className="flex-1 bg-accent-base text-ink-strong rounded-[4px] px-4 py-2.5 text-[0.875rem] font-medium hover:bg-accent-bright transition-colors duration-150 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          >
            {isPending ? "Saving…" : "Update"}
          </button>

          {confirmDelete ? (
            <>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="flex-1 bg-[oklch(0.30_0.10_28)] text-[oklch(0.80_0.08_28)] rounded-[4px] px-4 py-2.5 text-[0.875rem] hover:bg-[oklch(0.35_0.14_28)] transition-colors duration-150 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              >
                Confirm delete
              </button>
              <button
                type="button"
                onClick={() => { setConfirmDelete(false); setDeleteError(null) }}
                className="px-3 eyebrow text-ink-faint hover:text-ink transition-colors duration-150 cursor-pointer"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              disabled={isPending}
              className="border border-rule text-ink-faint rounded-[4px] px-4 py-2.5 text-[0.875rem] hover:text-ink hover:border-ink-faint transition-colors duration-150 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              Delete
            </button>
          )}
        </div>
        {deleteError && <p className="eyebrow text-[oklch(0.65_0.20_28)]">{deleteError}</p>}
      </div>

      {/* ── Right: preview ───────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-10 py-6">
        <p className="eyebrow text-ink-faint mb-6">Preview</p>
        <div className="max-w-[900px]">
          <EditPreview
            post={post}
            heading={heading}
            category={category}
            body={body}
            previewImageSrc={previewImageSrc}
            imageOrientation={previewOrientation}
            col2Ref={col2Ref}
            col15Ref={col15Ref}
          />
        </div>
      </div>
    </div>
  )
}

// ── List item ─────────────────────────────────────────────────────────────────

function EditListItem({
  post,
  expanded,
  onToggle,
  onDeleted,
  onUpdated,
}: {
  post: PostListItem
  expanded: boolean
  onToggle: () => void
  onDeleted: () => void
  onUpdated: (updated: PostListItem) => void
}) {
  const title = post.heading ?? `"${post.bodyPreview}"`

  return (
    <div className="border-b border-rule">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-6 px-8 py-3.5 text-left hover:bg-paper-base transition-colors duration-100 cursor-pointer group"
      >
        <time className="eyebrow text-ink-faint shrink-0 w-20">
          {formatDate(post.date)}
        </time>
        <span className="eyebrow text-ink-faint shrink-0 w-36 truncate">
          {typeLabel(post)}
        </span>
        <span className="flex-1 text-[0.875rem] text-ink-muted truncate min-w-0">
          {title}
        </span>
        <span className="eyebrow text-ink-faint shrink-0 text-[0.6rem] group-hover:text-ink transition-colors duration-100">
          {expanded ? "▲" : "▼"}
        </span>
      </button>

      {expanded && (
        <EditPostForm
          post={post}
          onDeleted={onDeleted}
          onUpdated={onUpdated}
        />
      )}
    </div>
  )
}

// ── Section root ──────────────────────────────────────────────────────────────

export function EditSection() {
  const [posts, setPosts] = useState<PostListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedSlugs, setExpandedSlugs] = useState<Set<string>>(new Set())

  useEffect(() => {
    setLoading(true)
    getAllPosts()
      .then((p) => { setPosts(p); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const toggle = (slug: string) => {
    setExpandedSlugs((prev) => {
      const next = new Set(prev)
      if (next.has(slug)) next.delete(slug)
      else next.add(slug)
      return next
    })
  }

  const onDeleted = (slug: string) => {
    setPosts((prev) => prev.filter((p) => p.slug !== slug))
    setExpandedSlugs((prev) => { const next = new Set(prev); next.delete(slug); return next })
  }

  const onUpdated = (slug: string, updated: PostListItem) => {
    setPosts((prev) => prev.map((p) => p.slug === slug ? updated : p))
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <span className="eyebrow text-ink-faint">Loading…</span>
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <span className="eyebrow text-ink-faint">No posts yet.</span>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Column headers */}
      <div className="flex items-center gap-6 px-8 py-2.5 border-b border-rule">
        <span className="eyebrow text-ink-faint w-20 shrink-0">Date</span>
        <span className="eyebrow text-ink-faint w-36 shrink-0">Type</span>
        <span className="eyebrow text-ink-faint flex-1">Title / Preview</span>
      </div>

      {posts.map((post) => (
        <EditListItem
          key={post.slug}
          post={post}
          expanded={expandedSlugs.has(post.slug)}
          onToggle={() => toggle(post.slug)}
          onDeleted={() => onDeleted(post.slug)}
          onUpdated={(updated) => onUpdated(post.slug, updated)}
        />
      ))}
    </div>
  )
}

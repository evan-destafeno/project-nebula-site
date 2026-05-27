"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { savePageContent, exitEditMode } from "@/app/admin/actions"

// ── DOM walk ──────────────────────────────────────────────────────────────────
//
// Collects every element that has at least one direct text-node child with
// non-whitespace content. aria-hidden subtrees (wavy-char spans), the edit UI
// overlay, and non-display tags (script, style, etc.) are skipped entirely.
//
// The resulting ordered array is the ONLY source of element indices. The same
// algorithm runs in ContentPatcher so indices are stable across edit/view modes.
// CRITICAL: the script tag injected by DynamicLayoutAddons (content patches)
// lives in <body> and has JSON text content — SKIP_TAGS prevents it from
// entering the array and shifting all subsequent indices.

const SKIP_TAGS = new Set([
  "SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE", "META", "LINK", "HEAD",
])

function getEditableElements(root: Element): HTMLElement[] {
  const results: HTMLElement[] = []

  function walk(el: Element) {
    if (SKIP_TAGS.has(el.tagName)) return
    if (el.hasAttribute("data-edit-ui")) return
    if (el.getAttribute("aria-hidden") === "true") return

    let hasDirectText = false
    for (let i = 0; i < el.childNodes.length; i++) {
      const n = el.childNodes[i]
      if (n.nodeType === Node.TEXT_NODE && (n.textContent ?? "").trim()) {
        hasDirectText = true
        break
      }
    }

    if (hasDirectText) {
      results.push(el as HTMLElement)
      return // treat element as a unit — don't descend further
    }

    for (let i = 0; i < el.children.length; i++) {
      walk(el.children[i])
    }
  }

  walk(root)
  return results
}

// ── WavyText visual rebuild ───────────────────────────────────────────────────
//
// After patching the sr-only span's text, rebuild the sibling aria-hidden span
// so the wave animation picks up the new characters on its next tick.
// Mirrors WavyText's render structure exactly.

function rebuildWavyVisual(visual: Element, text: string) {
  visual.innerHTML = ""
  const segments = text.split(/(\s+)/)
  for (const seg of segments) {
    if (!seg) continue
    const span = document.createElement("span")
    if (/^\s+$/.test(seg)) {
      span.textContent = seg
    } else {
      span.style.whiteSpace = "nowrap"
      for (const ch of Array.from(seg)) {
        const c = document.createElement("span")
        c.className = "wavy-char"
        c.textContent = ch
        span.appendChild(c)
      }
    }
    visual.appendChild(span)
  }
}

// ── Edit mode activation / deactivation ──────────────────────────────────────

function activateEditMode(
  elements: HTMLElement[],
  changesRef: React.RefObject<Record<number, string>>
) {
  elements.forEach((el, idx) => {
    const isSrOnly = el.classList.contains("sr-only")

    // sr-only spans (WavyText accessibility layer) need visibility overrides
    // so the user can see and interact with the text directly.
    if (isSrOnly) {
      el.classList.add("edit-target")
      // Hide the sibling aria-hidden visual span while editing
      const visual = el.nextElementSibling
      if (visual?.getAttribute("aria-hidden") === "true") {
        ;(visual as HTMLElement).style.display = "none"
      }
    }

    el.setAttribute("contenteditable", "true")
    el.setAttribute("data-edit-idx", String(idx))
    el.setAttribute("spellcheck", "false")

    el.addEventListener("input", () => {
      changesRef.current![idx] = el.textContent ?? ""
    })

    el.addEventListener("focus", () => {
      el.style.outline = "1px solid oklch(0.55 0.18 280 / 0.6)"
      el.style.outlineOffset = "2px"
    })

    el.addEventListener("blur", () => {
      el.style.outline = ""
      el.style.outlineOffset = ""
    })
  })
}

function deactivateEditMode(elements: HTMLElement[]) {
  elements.forEach((el) => {
    el.removeAttribute("contenteditable")
    el.removeAttribute("data-edit-idx")
    el.removeAttribute("spellcheck")
    el.style.outline = ""
    el.style.outlineOffset = ""
    el.style.backgroundColor = ""

    if (el.classList.contains("sr-only")) {
      el.classList.remove("edit-target")
      // Restore the sibling visual span
      const visual = el.nextElementSibling
      if (visual?.getAttribute("aria-hidden") === "true") {
        // Rebuild so wavy-chars reflect any changes made
        rebuildWavyVisual(visual, el.textContent ?? "")
        ;(visual as HTMLElement).style.display = ""
      }
    }
  })
}

// ── Shared button styles ──────────────────────────────────────────────────────

const btnPrimary = (disabled: boolean): React.CSSProperties => ({
  background: "var(--accent-base, oklch(0.55 0.18 280))",
  color: "var(--ink-strong, #fff)",
  border: "none",
  borderRadius: 4,
  padding: "5px 12px",
  fontSize: "0.75rem",
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
  cursor: disabled ? "not-allowed" : "pointer",
  fontFamily: "var(--font-geist-sans, system-ui)",
  opacity: disabled ? 0.4 : 1,
})

const btnSecondary = (disabled: boolean): React.CSSProperties => ({
  background: "transparent",
  color: "var(--ink-faint, #666)",
  border: "1px solid var(--rule, rgba(255,255,255,0.1))",
  borderRadius: 4,
  padding: "5px 12px",
  fontSize: "0.75rem",
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
  cursor: disabled ? "not-allowed" : "pointer",
  fontFamily: "var(--font-geist-sans, system-ui)",
  opacity: disabled ? 0.4 : 1,
})

const btnGhost = (disabled: boolean): React.CSSProperties => ({
  background: "transparent",
  color: "var(--ink-faint, #666)",
  border: "none",
  padding: "5px 8px",
  fontSize: "0.75rem",
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
  cursor: disabled ? "not-allowed" : "pointer",
  fontFamily: "var(--font-geist-sans, system-ui)",
  opacity: disabled ? 0.4 : 1,
})

// ── Bar states ────────────────────────────────────────────────────────────────

type BarState = "idle" | "confirm" | "saving" | "saved" | "error"

// ── Component ─────────────────────────────────────────────────────────────────

export function EditModeClient({ targetPath }: { targetPath: string }) {
  const [barState, setBarState] = useState<BarState>("idle")
  const [barError, setBarError] = useState<string | null>(null)
  const [password, setPassword] = useState("")
  const [isPending, startTransition] = useTransition()
  const changesRef = useRef<Record<number, string>>({})
  const elementsRef = useRef<HTMLElement[]>([])
  const passwordInputRef = useRef<HTMLInputElement>(null)

  // All bar buttons are disabled whenever any async operation is in flight
  const disabled = isPending || barState === "saving"

  useEffect(() => {
    const body = document.body
    body.setAttribute("data-edit-mode", "true")

    // Inject styles for gear cursor, edit highlights, and sr-only visibility
    const styleEl = document.createElement("style")
    styleEl.setAttribute("data-edit-ui", "true")
    styleEl.textContent = `
      [data-edit-mode] { cursor: url('/cursor-gear.svg') 12 12, auto !important; }
      [data-edit-mode] .ocean-cursor { display: none !important; }
      [data-edit-mode] [contenteditable] { cursor: text !important; }
      [data-edit-mode] [contenteditable]:hover { background-color: oklch(0.4 0.06 280 / 0.08); }
      [data-edit-mode] span.sr-only.edit-target {
        position: static !important;
        width: auto !important;
        height: auto !important;
        padding: 0 !important;
        margin: 0 !important;
        overflow: visible !important;
        clip: auto !important;
        clip-path: none !important;
        white-space: normal !important;
        border: 0 !important;
      }
    `
    document.head.appendChild(styleEl)

    // Suppress clicks on links and buttons so navigation/actions don't fire
    // while the user is clicking to edit text. Capture phase so we intercept
    // before any element's own handler. Clicks within the edit UI bar are
    // always allowed through.
    const suppressClicks = (e: MouseEvent) => {
      const target = e.target as Element | null
      if (!target) return
      if (target.closest("[data-edit-ui]")) return // edit bar always works
      const interactive = target.closest("a, button, [role='button'], label, summary")
      if (!interactive) return
      e.preventDefault()
      e.stopPropagation()
    }
    document.addEventListener("click", suppressClicks, true)

    // Defer DOM walk slightly so the page is fully painted
    const timer = setTimeout(() => {
      const els = getEditableElements(body)
      elementsRef.current = els
      activateEditMode(els, changesRef)
    }, 100)

    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (Object.keys(changesRef.current!).length > 0) {
        e.preventDefault()
        e.returnValue = ""
      }
    }
    window.addEventListener("beforeunload", beforeUnload)

    return () => {
      clearTimeout(timer)
      body.removeAttribute("data-edit-mode")
      styleEl.remove()
      deactivateEditMode(elementsRef.current)
      window.removeEventListener("beforeunload", beforeUnload)
      document.removeEventListener("click", suppressClicks, true)
    }
  }, [])

  // Focus password input when confirm state opens
  useEffect(() => {
    if (barState === "confirm") {
      setTimeout(() => passwordInputRef.current?.focus(), 50)
    }
  }, [barState])

  const handleSave = () => {
    const patches = changesRef.current!
    if (!Object.keys(patches).length) {
      setBarError("No changes to save.")
      setBarState("error")
      return
    }
    setPassword("")
    setBarError(null)
    setBarState("confirm")
  }

  const handleConfirm = () => {
    const patches = changesRef.current!
    setBarState("saving")
    startTransition(async () => {
      try {
        const result = await savePageContent(targetPath, patches, password)
        if (result.error) {
          setBarError(result.error)
          setBarState("error")
        } else {
          changesRef.current = {}
          setBarState("saved")
          setTimeout(() => setBarState("idle"), 2500)
        }
      } catch {
        setBarError("Unexpected error.")
        setBarState("error")
      }
    })
  }

  const handleExit = () => {
    startTransition(async () => {
      deactivateEditMode(elementsRef.current)
      await exitEditMode()
    })
  }

  const pageLabel = targetPath === "/" ? "Home" : targetPath.replace(/^\//, "")

  return (
    // Floating bar — bottom center, styled like the site's hint overlays
    <div
      data-edit-ui="true"
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 18px",
        background: "var(--paper-raised, #1a1a1a)",
        border: "1px solid var(--rule, rgba(255,255,255,0.1))",
        borderRadius: 6,
        boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
        fontFamily: "var(--font-geist-sans, system-ui)",
        fontSize: "0.75rem",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        pointerEvents: "all",
        cursor: "default",
        userSelect: "none",
        whiteSpace: "nowrap",
      }}
    >
      {barState === "idle" && (
        <>
          <span style={{ color: "var(--ink-faint, #666)", marginRight: 4 }}>
            Editing /{pageLabel === "Home" ? "" : pageLabel}
          </span>
          <button onClick={handleSave} disabled={disabled} style={btnPrimary(disabled)}>
            Save changes
          </button>
          <button onClick={handleExit} disabled={disabled} style={btnSecondary(disabled)}>
            {isPending ? "Exiting…" : "Exit"}
          </button>
        </>
      )}

      {barState === "confirm" && (
        <>
          <span style={{ color: "var(--ink-faint, #666)" }}>Password</span>
          <input
            ref={passwordInputRef}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && password && !disabled) handleConfirm() }}
            placeholder="enter password"
            disabled={disabled}
            style={{
              background: "var(--paper-base, #111)",
              color: "var(--ink, #eee)",
              border: "1px solid var(--rule, rgba(255,255,255,0.15))",
              borderRadius: 4,
              padding: "4px 10px",
              fontSize: "0.8125rem",
              fontFamily: "var(--font-geist-mono, monospace)",
              letterSpacing: "0.02em",
              textTransform: "none",
              outline: "none",
              width: 180,
              cursor: disabled ? "not-allowed" : "text",
              opacity: disabled ? 0.4 : 1,
            }}
          />
          <button
            onClick={handleConfirm}
            disabled={disabled || !password}
            style={btnPrimary(disabled || !password)}
          >
            Confirm save
          </button>
          <button
            onClick={() => { setBarState("idle"); setPassword("") }}
            disabled={disabled}
            style={btnSecondary(disabled)}
          >
            Cancel
          </button>
        </>
      )}

      {barState === "saving" && (
        <span style={{ color: "var(--ink-faint, #666)" }}>Saving…</span>
      )}

      {barState === "saved" && (
        <>
          <span style={{ color: "oklch(0.72 0.17 155)" }}>Saved.</span>
          <button onClick={handleExit} disabled={disabled} style={btnSecondary(disabled)}>
            {isPending ? "Exiting…" : "Exit"}
          </button>
        </>
      )}

      {barState === "error" && (
        <>
          <span style={{ color: "oklch(0.65 0.20 28)" }}>{barError}</span>
          {barError === "No changes to save." ? (
            <button
              onClick={() => { setBarState("idle"); setBarError(null) }}
              disabled={disabled}
              style={btnSecondary(disabled)}
            >
              Dismiss
            </button>
          ) : (
            <>
              <button
                onClick={() => { setBarState("confirm"); setBarError(null) }}
                disabled={disabled}
                style={btnSecondary(disabled)}
              >
                Try again
              </button>
              <button
                onClick={() => setBarState("idle")}
                disabled={disabled}
                style={btnGhost(disabled)}
              >
                Cancel
              </button>
            </>
          )}
        </>
      )}
    </div>
  )
}

"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

// ── DOM walk (identical to edit-mode-client.tsx — must stay in sync) ──────────
//
// SKIP_TAGS excludes the <script id="__page_patches__"> element that lives in
// <body>. Without this, its JSON text content would be collected and shift all
// subsequent indices relative to what edit mode recorded. Both files must keep
// SKIP_TAGS in sync so the index → element mapping is identical.

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
      return
    }

    for (let i = 0; i < el.children.length; i++) {
      walk(el.children[i])
    }
  }

  walk(root)
  return results
}

// Mirrors WavyText's render structure so the wave animation picks up new chars.
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

// ── Component ─────────────────────────────────────────────────────────────────
//
// Reads patches injected by the server layout from the __page_patches__ script
// tag and applies them to the DOM. Runs on every page load so saved edits are
// visible to all visitors without a rebuild.

export function ContentPatcher() {
  const pathname = usePathname()

  useEffect(() => {
    const script = document.getElementById("__page_patches__")
    if (!script || !script.textContent?.trim()) return

    let patches: Record<string, string>
    try {
      patches = JSON.parse(script.textContent)
    } catch {
      return
    }

    const entries = Object.entries(patches)
    if (!entries.length) return

    const elements = getEditableElements(document.body)

    for (const [indexStr, text] of entries) {
      const idx = parseInt(indexStr, 10)
      if (!Number.isFinite(idx)) continue
      const el = elements[idx]
      if (!el) continue

      el.textContent = text

      // For WavyText sr-only spans: also rebuild the sibling visual span
      // so wave-char characters reflect the new content.
      if (el.classList.contains("sr-only")) {
        const visual = el.nextElementSibling
        if (visual?.getAttribute("aria-hidden") === "true") {
          rebuildWavyVisual(visual, text)
        }
      }
    }
  }, [pathname])

  return null
}

"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

// ↑↑↓↓←→←→BA + Enter/Space navigates to /admin (hidden login)
const SEQUENCE = [
  "ArrowUp", "ArrowUp",
  "ArrowDown", "ArrowDown",
  "ArrowLeft", "ArrowRight",
  "ArrowLeft", "ArrowRight",
  "b", "a",
]

export function KonamiGate() {
  const router = useRouter()

  useEffect(() => {
    let pos = 0

    function onKey(e: KeyboardEvent) {
      if (pos < SEQUENCE.length) {
        pos = e.key === SEQUENCE[pos] ? pos + 1 : (e.key === SEQUENCE[0] ? 1 : 0)
      } else {
        // Sequence complete — wait for the trigger key
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          // Store the current page so the admin exit button can return here
          sessionStorage.setItem("admin_from_path", window.location.pathname)
          router.push("/admin?k=1")
          pos = 0
        } else {
          pos = e.key === SEQUENCE[0] ? 1 : 0
        }
      }
    }

    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [router])

  return null
}

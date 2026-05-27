"use client"

import { useState, useEffect, useTransition } from "react"
import { logoutTo } from "@/app/admin/actions"
import { PostForm } from "@/components/admin/post-form"
import { EditSection } from "@/components/admin/edit-section"
import { EditSiteSection } from "@/components/admin/edit-site-section"
import { PicturesSection } from "@/components/admin/pictures-section"

type Section = "new" | "edit" | "site" | "pictures"

const TABS: { key: Section; label: string }[] = [
  { key: "new", label: "New post" },
  { key: "edit", label: "Edit posts" },
  { key: "site", label: "Edit site" },
  { key: "pictures", label: "Pictures" },
]

export function AdminShell() {
  const [section, setSection] = useState<Section>("new")
  // Path the user was on when they typed the Konami code — stored by KonamiGate
  const [fromPath, setFromPath] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    const stored = sessionStorage.getItem("admin_from_path")
    if (stored) {
      setFromPath(stored)
      // Default to "Edit site" for any page that isn't the log
      if (!stored.startsWith("/log")) {
        setSection("site")
      }
    }
  }, [])

  const handleExit = () => {
    startTransition(async () => {
      await logoutTo(fromPath ?? "/log")
    })
  }

  return (
    <div className="min-h-dvh flex flex-col">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-rule shrink-0">
        <div className="flex gap-1">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              disabled={isPending}
              onClick={() => setSection(key)}
              className={
                section === key
                  ? "eyebrow text-ink px-3 py-1.5 rounded-[3px] bg-paper-base cursor-pointer disabled:opacity-40"
                  : "eyebrow text-ink-faint px-3 py-1.5 rounded-[3px] hover:text-ink hover:bg-paper-base transition-colors duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              }
            >
              {label}
            </button>
          ))}
        </div>

        {/* Simple exit button — returns to whichever page triggered the Konami */}
        <button
          type="button"
          disabled={isPending}
          onClick={handleExit}
          className="eyebrow text-ink-faint hover:text-ink transition-colors duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isPending ? "Leaving…" : "Exit"}
        </button>
      </div>

      {/* ── Content ────────────────────────────────────────────────────── */}
      {section === "new" && <PostForm />}
      {section === "edit" && <EditSection />}
      {section === "site" && (
        <EditSiteSection fromPath={fromPath} disabled={isPending} />
      )}
      {section === "pictures" && <PicturesSection />}
    </div>
  )
}

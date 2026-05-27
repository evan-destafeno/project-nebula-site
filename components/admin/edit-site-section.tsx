"use client"

import { useTransition } from "react"
import { cn } from "@/lib/utils"
import { startEditMode } from "@/app/admin/actions"

// Pages available for site edit mode. /log is intentionally excluded.
const EDITABLE_PAGES = [
  { label: "Home", pathname: "/", description: "Landing page" },
  { label: "Sub-Epsilon", pathname: "/epsilon", description: "Technical specification" },
  { label: "Crew", pathname: "/crew", description: "Team roster" },
] as const

export function EditSiteSection({
  fromPath,
  disabled,
}: {
  // Path the user came from — used to highlight the relevant page card.
  fromPath?: string | null
  disabled?: boolean
}) {
  const [isPending, startTransition] = useTransition()
  const isDisabled = disabled || isPending

  const handleSelect = (pathname: string) => {
    startTransition(async () => {
      await startEditMode(pathname)
    })
  }

  return (
    <div className="flex-1 flex flex-col px-10 py-10">
      <p className="eyebrow text-ink-faint mb-2">Choose a page to edit</p>
      <p className="text-[0.875rem] text-ink-faint mb-8 leading-relaxed">
        You will be navigated to the page with edit mode active. Click any text
        to edit it in place. Use the floating bar at the bottom to save or exit.
      </p>

      <div className="flex flex-col gap-3 max-w-sm">
        {EDITABLE_PAGES.map((page) => {
          const isFrom = fromPath === page.pathname
          return (
            <button
              key={page.pathname}
              type="button"
              disabled={isDisabled}
              onClick={() => handleSelect(page.pathname)}
              className={cn(
                "flex items-center justify-between px-5 py-4 border rounded-[4px] text-left transition-colors duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed group",
                // Highlight the page the user came from
                isFrom
                  ? "border-accent-base bg-paper-base"
                  : "border-rule hover:bg-paper-base hover:border-ink-faint"
              )}
            >
              <div>
                <span className={cn(
                  "text-[0.9375rem] font-medium block",
                  isFrom ? "text-ink" : "text-ink"
                )}>
                  {page.label}
                  {isFrom && (
                    <span className="eyebrow text-accent-base ml-2 text-[0.6rem]">current page</span>
                  )}
                </span>
                <span className="eyebrow text-ink-faint text-[0.625rem]">
                  {page.description}
                </span>
              </div>
              <span className={cn(
                "eyebrow text-[0.6rem] transition-colors duration-150",
                isFrom ? "text-accent-base" : "text-ink-faint group-hover:text-ink"
              )}>
                {isPending ? "…" : "→"}
              </span>
            </button>
          )
        })}
      </div>

      <p className="eyebrow text-ink-faint mt-8 text-[0.625rem]">
        /log is not available for site edit mode.
      </p>
    </div>
  )
}

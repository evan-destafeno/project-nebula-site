"use client"

import { useState, useTransition } from "react"
import { loadMoreEntries } from "@/app/log/actions"
import { LogEntryItem } from "./log-entry"
import type { LogEntry } from "@/lib/log-types"

type Props = {
  initialEntries: LogEntry[]
  initialHasMore: boolean
  initialOffset: number
}

export function LogFeed({ initialEntries, initialHasMore, initialOffset }: Props) {
  const [extraEntries, setExtraEntries] = useState<LogEntry[]>([])
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [offset, setOffset] = useState(initialOffset)
  const [isPending, startTransition] = useTransition()

  const entries = [...initialEntries, ...extraEntries]

  function loadMore() {
    startTransition(async () => {
      const result = await loadMoreEntries(offset)
      setExtraEntries((prev) => [...prev, ...result.entries])
      setHasMore(result.hasMore)
      setOffset((prev) => prev + result.entries.length)
    })
  }

  return (
    <div>
      <div>
        {entries.map((entry, i) => {
          const prevEntry = entries[i - 1]
          const showDate = i === 0 || prevEntry.date !== entry.date
          return (
            <LogEntryItem
              key={entry.slug}
              entry={entry}
              showDate={showDate}
            />
          )
        })}
      </div>

      <div className="grid grid-cols-[9rem_1fr] gap-x-8 py-8">
        <div />
        {hasMore ? (
          <button
            onClick={loadMore}
            disabled={isPending}
            className="eyebrow text-ink-faint hover:text-ink transition-colors duration-150 text-left cursor-pointer disabled:opacity-50"
          >
            {isPending ? "Loading…" : "Load older entries"}
          </button>
        ) : (
          <p className="eyebrow text-ink-faint opacity-40">End of log</p>
        )}
      </div>
    </div>
  )
}

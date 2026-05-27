import fs from "fs/promises"
import path from "path"
import type { LogEntry } from "./log-types"

export const LOG_PAGE_SIZE = 20

const CONTENT_DIR = path.join(process.cwd(), "content/log")

async function readAllEntries(): Promise<LogEntry[]> {
  const files = await fs.readdir(CONTENT_DIR)
  const jsonFiles = files.filter((f) => f.endsWith(".json"))

  const entries = await Promise.all(
    jsonFiles.map(async (file) => {
      const raw = await fs.readFile(path.join(CONTENT_DIR, file), "utf-8")
      const data = JSON.parse(raw)
      return { ...data, slug: file.replace(".json", "") } as LogEntry
    })
  )

  // Sort: date DESC → order ASC (undefined = Infinity, appears last within a day) → slug ASC
  return entries.sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date)
    const aOrd = a.order ?? Infinity
    const bOrd = b.order ?? Infinity
    if (aOrd !== bOrd) return aOrd - bOrd
    return a.slug.localeCompare(b.slug)
  })
}

export async function getLogEntries(options?: {
  limit?: number
  offset?: number
}): Promise<{ entries: LogEntry[]; hasMore: boolean; total: number }> {
  const all = await readAllEntries()
  const offset = options?.offset ?? 0
  const limit = options?.limit ?? LOG_PAGE_SIZE

  return {
    entries: all.slice(offset, offset + limit),
    hasMore: offset + limit < all.length,
    total: all.length,
  }
}

// Returns entries for a specific date in display order (order ASC, slug ASC).
// Used by the admin position picker to show existing same-day posts.
export async function getEntriesForDate(date: string): Promise<LogEntry[]> {
  const all = await readAllEntries()
  return all.filter((e) => e.date === date)
}

// Returns all entries in display order. Used by the admin edit section.
export async function getAllEntries(): Promise<LogEntry[]> {
  return readAllEntries()
}

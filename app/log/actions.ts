"use server"

import { getLogEntries, LOG_PAGE_SIZE } from "@/lib/log"

export async function loadMoreEntries(offset: number) {
  return getLogEntries({ offset, limit: LOG_PAGE_SIZE })
}

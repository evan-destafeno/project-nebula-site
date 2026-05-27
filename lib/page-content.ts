import fs from "fs/promises"
import path from "path"

const PAGES_DIR = path.join(process.cwd(), "content/pages")

// Keyed by element index (stringified integer) → new text content.
// Index is determined by the same DOM walk used in EditModeClient and ContentPatcher.
export type PagePatches = Record<string, string>

export async function getPageContent(slug: string): Promise<PagePatches> {
  try {
    const raw = await fs.readFile(path.join(PAGES_DIR, `${slug}.json`), "utf-8")
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

export async function setPageContent(slug: string, patches: PagePatches): Promise<void> {
  await fs.mkdir(PAGES_DIR, { recursive: true })
  await fs.writeFile(
    path.join(PAGES_DIR, `${slug}.json`),
    JSON.stringify(patches, null, 2),
    "utf-8"
  )
}

// "/" → "home", "/epsilon" → "epsilon", "/crew" → "crew"
export function pathnameToSlug(pathname: string): string {
  const clean = pathname.replace(/^\/|\/$/g, "")
  return clean || "home"
}

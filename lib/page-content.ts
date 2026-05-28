import fs from "fs/promises"
import path from "path"
import { unstable_cache } from "next/cache"

const PAGES_DIR = path.join(process.cwd(), "content/pages")

export type PagePatches = Record<string, string>

export const PAGE_CONTENT_TAG = "page-content"

async function readFromDisk(slug: string): Promise<PagePatches> {
  try {
    const raw = await fs.readFile(path.join(PAGES_DIR, `${slug}.json`), "utf-8")
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

// Cached version for page rendering — treated as static by Next.js PPR.
// Bust with revalidateTag(PAGE_CONTENT_TAG) after any write.
export const getPageContent = unstable_cache(readFromDisk, ["page-content"], {
  tags: [PAGE_CONTENT_TAG],
})

// Direct disk read for admin writes — always fresh, bypasses cache.
export const readPageContentDirect = readFromDisk

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
  const slug = clean || "home"
  // Reject any slug that would escape the content directory
  if (slug.includes("..") || slug.includes("/") || slug.includes("\\")) {
    throw new Error("Invalid pathname")
  }
  return slug
}

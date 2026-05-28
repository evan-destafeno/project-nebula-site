"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { revalidatePath, revalidateTag } from "next/cache"
import fs from "fs/promises"
import path from "path"
import {
  createToken,
  verifyToken,
  COOKIE_NAME,
  createEditModeToken,
  verifyEditModeToken,
  EDIT_MODE_COOKIE,
  EDIT_PATH_COOKIE,
} from "@/lib/admin-auth"
import { getEntriesForDate, getAllEntries } from "@/lib/log"
import { readPageContentDirect, setPageContent, pathnameToSlug, PAGE_CONTENT_TAG, type PagePatches } from "@/lib/page-content"

// ── Auth ─────────────────────────────────────────────────────────────────────

export async function login(
  _prevState: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const username = formData.get("username")?.toString().trim()
  const password = formData.get("password")?.toString()

  if (
    !username ||
    !password ||
    username !== process.env.ADMIN_USERNAME ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    await new Promise((r) => setTimeout(r, 500))
    return { error: "Invalid credentials." }
  }

  const token = await createToken()
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    // No maxAge — session cookie, clears on tab/browser close
  })

  redirect("/admin/new")
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
  redirect("/log")
}

// Clears the session and redirects to a caller-supplied destination.
// Destination is validated server-side to prevent open-redirect attacks.
export async function logoutTo(destination: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
  // Only allow relative paths; reject protocol-relative URLs (//evil.com)
  const safe =
    typeof destination === "string" &&
    destination.startsWith("/") &&
    !destination.startsWith("//")
      ? destination
      : "/log"
  redirect(safe)
}

// ── Same-day query (used by the position picker in the admin form) ────────────

export type SameDayEntry = {
  slug: string
  type: string
  heading?: string
  category?: string
  bodyPreview: string
}

export async function getSameDayEntries(date: string): Promise<SameDayEntry[]> {
  await requireAuth()
  const entries = await getEntriesForDate(date)
  return entries.map((e) => ({
    slug: e.slug,
    type: e.type,
    heading: "heading" in e ? e.heading : undefined,
    category: "category" in e ? e.category : undefined,
    bodyPreview: e.body.replace(/\r?\n/g, " ").slice(0, 72),
  }))
}

// ── Post creation ─────────────────────────────────────────────────────────────

async function requireAuth(): Promise<void> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token || !(await verifyToken(token))) {
    redirect("/admin")
  }
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 50)
}

const CONTENT_DIR = path.join(process.cwd(), "content/log")

export type CreatePostResult = { error: string | null; success: boolean }

export async function createPost(
  _prevState: CreatePostResult,
  formData: FormData
): Promise<CreatePostResult> {
  await requireAuth()

  const type = formData.get("type")?.toString()
  const date = formData.get("date")?.toString()
  // Normalize Windows line endings before storing so split("\n\n") works everywhere.
  const body = formData.get("body")?.toString().replace(/\r\n/g, "\n").trim()
  const heading = formData.get("heading")?.toString().replace(/\r\n/g, "\n").trim()
  const category = formData.get("category")?.toString()?.trim()

  if (!type || !date || !body) {
    return { error: "Date and body are required.", success: false }
  }

  // Strict YYYY-MM-DD validation — prevents malformed filenames and broken date rendering.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { error: "Date must be in YYYY-MM-DD format.", success: false }
  }
  const [, mm, dd] = date.split("-").map(Number)
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) {
    return { error: "Date has an invalid month or day.", success: false }
  }

  if ((type === "update" || type === "milestone" || type === "dispatch") && !heading) {
    return { error: "Heading is required for this entry type.", success: false }
  }
  if (type === "update" && !category) {
    return { error: "Category is required for updates.", success: false }
  }

  try {
    // Notes have no heading — derive slug from the body instead so same-day
    // notes don't collide. Other types always have a heading.
    const slugBase = heading ? slugify(heading) : slugify(body.slice(0, 40))

    // Ensure the filename is unique — increment a counter if the file exists.
    let slug = `${date}-${slugBase}`
    {
      let n = 2
      while (true) {
        try {
          await fs.access(path.join(CONTENT_DIR, `${slug}.json`))
          slug = `${date}-${slugBase}-${n++}` // file exists — try next
        } catch {
          break // file does not exist — safe to use
        }
      }
    }

    // Handle image upload (already resized on the client via Canvas)
    let image: { src: string; orientation: string } | undefined
    const imageFile = formData.get("image") as File | null
    const imageOrientation = formData.get("imageOrientation")?.toString()

    if (imageFile && imageFile.size > 0 && imageOrientation) {
      const orientChar = imageOrientation === "vertical" ? "v" : "h"
      const filename = `${slug}-${orientChar}.jpg`
      const destPath = path.join(process.cwd(), "public/log", filename)
      await fs.mkdir(path.dirname(destPath), { recursive: true })
      await fs.writeFile(destPath, Buffer.from(await imageFile.arrayBuffer()))
      image = { src: `/log/${filename}`, orientation: imageOrientation }
    }

    // ── Ordering: assign `order` fields to all entries on this date ────────────
    // Read existing same-day entries (already sorted by their current order).
    const existing = await getEntriesForDate(date)
    const insertAt = Math.max(
      0,
      Math.min(
        parseInt(formData.get("position")?.toString() ?? String(existing.length), 10),
        existing.length
      )
    )

    // Build the desired slug order with the new entry inserted at the chosen position.
    const orderedSlugs = existing.map((e) => e.slug)
    orderedSlugs.splice(insertAt, 0, slug)

    // Rewrite `order` in every existing file that needs it to change.
    for (let i = 0; i < orderedSlugs.length; i++) {
      const s = orderedSlugs[i]
      if (s === slug) continue // new entry — written below
      const filePath = path.join(CONTENT_DIR, `${s}.json`)
      const raw = await fs.readFile(filePath, "utf-8")
      const data = JSON.parse(raw)
      if (data.order !== i) {
        data.order = i
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8")
      }
    }

    // Build and write the new entry.
    const entry: Record<string, unknown> = {
      date,
      type,
      body,
      order: orderedSlugs.indexOf(slug),
    }
    if (heading) entry.heading = heading
    if (category && type === "update") entry.category = category
    if (image) entry.image = image

    const filePath = path.join(CONTENT_DIR, `${slug}.json`)
    await fs.writeFile(filePath, JSON.stringify(entry, null, 2), "utf-8")

    // Bust the route cache so the log page immediately reflects the new entry.
    revalidatePath("/log")

    return { error: null, success: true }
  } catch (err) {
    console.error("[createPost]", err)
    return { error: "Server error — post was not saved. Check the console.", success: false }
  }
}

// ── All posts list (for admin edit section) ───────────────────────────────────

export type PostListItem = {
  slug: string
  type: string
  date: string
  heading?: string
  category?: string
  body: string
  bodyPreview: string
  image?: { src: string; orientation: string }
}

export async function getAllPosts(): Promise<PostListItem[]> {
  await requireAuth()
  const entries = await getAllEntries()
  return entries.map((e) => ({
    slug: e.slug,
    type: e.type,
    date: e.date,
    heading: "heading" in e ? e.heading : undefined,
    category: "category" in e ? e.category : undefined,
    body: e.body,
    bodyPreview: e.body.replace(/\r?\n/g, " ").slice(0, 72),
    image: "image" in e ? (e.image as { src: string; orientation: string } | undefined) : undefined,
  }))
}

// ── Post update ───────────────────────────────────────────────────────────────

export type UpdatePostResult = {
  error: string | null
  success: boolean
  post?: PostListItem
}

export async function updatePost(slug: string, formData: FormData): Promise<UpdatePostResult> {
  await requireAuth()

  if (!/^[\w-]+$/.test(slug)) return { error: "Invalid slug.", success: false }
  const filePath = path.join(CONTENT_DIR, `${slug}.json`)

  try {
    const raw = await fs.readFile(filePath, "utf-8")
    const existing = JSON.parse(raw)

    const body = formData.get("body")?.toString().replace(/\r\n/g, "\n").trim()
    const heading = formData.get("heading")?.toString().replace(/\r\n/g, "\n").trim()
    const category = formData.get("category")?.toString()?.trim()

    if (!body) return { error: "Body is required.", success: false }
    if (
      (existing.type === "update" || existing.type === "milestone" || existing.type === "dispatch") &&
      !heading
    ) {
      return { error: "Heading is required.", success: false }
    }
    if (existing.type === "update" && !category) {
      return { error: "Category is required.", success: false }
    }

    // Image: keep existing, replace with new upload, or remove
    const removeImage = formData.get("removeImage") === "true"
    const imageFile = formData.get("image") as File | null
    const imageOrientation = formData.get("imageOrientation")?.toString()

    let image: { src: string; orientation: string } | undefined = existing.image

    if (removeImage) {
      if (existing.image?.src) {
        await fs.unlink(path.join(process.cwd(), "public", existing.image.src)).catch(() => {})
      }
      image = undefined
    } else if (imageFile && imageFile.size > 0 && imageOrientation) {
      if (existing.image?.src) {
        await fs.unlink(path.join(process.cwd(), "public", existing.image.src)).catch(() => {})
      }
      const orientChar = imageOrientation === "vertical" ? "v" : "h"
      const filename = `${slug}-${orientChar}.jpg`
      const destPath = path.join(process.cwd(), "public/log", filename)
      await fs.mkdir(path.dirname(destPath), { recursive: true })
      await fs.writeFile(destPath, Buffer.from(await imageFile.arrayBuffer()))
      image = { src: `/log/${filename}`, orientation: imageOrientation as string }
    }

    const updated: Record<string, unknown> = {
      date: existing.date,
      type: existing.type,
      body,
      ...(existing.order !== undefined ? { order: existing.order } : {}),
    }
    if (heading) updated.heading = heading
    if (category && existing.type === "update") updated.category = category
    if (image) updated.image = image

    await fs.writeFile(filePath, JSON.stringify(updated, null, 2), "utf-8")
    revalidatePath("/log")

    const post: PostListItem = {
      slug,
      type: existing.type,
      date: existing.date,
      heading: heading || undefined,
      category: category && existing.type === "update" ? category : undefined,
      body,
      bodyPreview: body.replace(/\r?\n/g, " ").slice(0, 72),
      image,
    }
    return { error: null, success: true, post }
  } catch (err) {
    console.error("[updatePost]", err)
    return { error: "Server error — post was not updated.", success: false }
  }
}

// ── Post delete ───────────────────────────────────────────────────────────────

// ── Site edit mode ────────────────────────────────────────────────────────────

// Sets the edit-mode cookies and navigates to the target page.
// The root layout reads these cookies server-side and renders EditModeClient.
export async function startEditMode(pathname: string): Promise<void> {
  await requireAuth()
  const token = await createEditModeToken()
  const cookieStore = await cookies()
  const opts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
  }
  cookieStore.set(EDIT_MODE_COOKIE, token, opts)
  cookieStore.set(EDIT_PATH_COOKIE, pathname, opts)
  redirect(pathname)
}

// Clears edit-mode cookies and returns to the admin panel.
export async function exitEditMode(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(EDIT_MODE_COOKIE)
  cookieStore.delete(EDIT_PATH_COOKIE)
  redirect("/admin/new")
}

export type SavePageResult = { error: string | null; success: boolean }

// Persists content patches for a page.
// Password is validated server-side only — it never reaches the client bundle.
export async function savePageContent(
  pathname: string,
  patches: PagePatches,
  password: string
): Promise<SavePageResult> {
  const cookieStore = await cookies()
  const token = cookieStore.get(EDIT_MODE_COOKIE)?.value
  if (!token || !(await verifyEditModeToken(token))) {
    return { error: "Edit session expired. Please re-enter edit mode.", success: false }
  }
  // Checked server-side only — never exposed to the client bundle
  if (!process.env.SAVE_PASSWORD || password !== process.env.SAVE_PASSWORD) {
    return { error: "Incorrect password.", success: false }
  }
  try {
    const slug = pathnameToSlug(pathname)
    const existing = await readPageContentDirect(slug)
    await setPageContent(slug, { ...existing, ...patches })
    revalidateTag(PAGE_CONTENT_TAG, "max")
    revalidatePath(pathname)
    return { error: null, success: true }
  } catch (err) {
    console.error("[savePageContent]", err)
    return { error: "Server error — changes were not saved.", success: false }
  }
}

// ── Page content read (for layout injection) ──────────────────────────────────

// Called server-side from the root layout to embed patches inline in HTML.
// No auth required — patches are public-facing content overrides.
export async function readPageContent(pathname: string): Promise<PagePatches> {
  return readPageContentDirect(pathnameToSlug(pathname))
}

// ── Page image upload ─────────────────────────────────────────────────────────

export type UploadImageResult = { error: string | null; success: boolean; src?: string }

export async function uploadPageImage(
  pathname: string,
  imageKey: string,
  password: string,
  formData: FormData
): Promise<UploadImageResult> {
  const cookieStore = await cookies()
  const token = cookieStore.get(EDIT_MODE_COOKIE)?.value
  if (!token || !(await verifyEditModeToken(token))) {
    return { error: "Edit session expired. Please re-enter edit mode.", success: false }
  }
  if (!process.env.SAVE_PASSWORD || password !== process.env.SAVE_PASSWORD) {
    return { error: "Incorrect password.", success: false }
  }
  if (!/^[a-z][a-z0-9-]*(\.[a-z][a-z0-9-]*)*$/.test(imageKey)) {
    return { error: "Invalid image key.", success: false }
  }

  const imageFile = formData.get("image") as File | null
  if (!imageFile || imageFile.size === 0) {
    return { error: "No image provided.", success: false }
  }

  const mimeToExt: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  }
  const ext = mimeToExt[imageFile.type] ?? "jpg"

  try {
    const slug = pathnameToSlug(pathname)
    const existing = await readPageContentDirect(slug)

    // Delete previously uploaded image for this key (only files we wrote under public/images/)
    const oldSrc = existing[imageKey]
    if (oldSrc && typeof oldSrc === "string") {
      const oldPath = oldSrc.split("?")[0]
      if (oldPath.startsWith("/images/")) {
        await fs.unlink(path.join(process.cwd(), "public", oldPath)).catch(() => {})
      }
    }

    const safeName = imageKey.replace(/[^a-z0-9-]/g, "-")
    const filename = `${safeName}-${Date.now()}.${ext}`
    const destDir = path.join(process.cwd(), "public/images", slug)
    await fs.mkdir(destDir, { recursive: true })
    await fs.writeFile(destDir + "/" + filename, Buffer.from(await imageFile.arrayBuffer()))

    const src = `/images/${slug}/${filename}`
    await setPageContent(slug, { ...existing, [imageKey]: src })
    revalidateTag(PAGE_CONTENT_TAG, "max")
    revalidatePath(pathname)

    return { error: null, success: true, src }
  } catch (err) {
    console.error("[uploadPageImage]", err)
    return { error: "Server error — image was not saved.", success: false }
  }
}

// ── Post delete ───────────────────────────────────────────────────────────────

export async function deletePost(slug: string): Promise<{ error: string | null; success: boolean }> {
  await requireAuth()

  if (!/^[\w-]+$/.test(slug)) return { error: "Invalid slug.", success: false }
  const filePath = path.join(CONTENT_DIR, `${slug}.json`)

  try {
    const raw = await fs.readFile(filePath, "utf-8")
    const data = JSON.parse(raw)

    if (data.image?.src) {
      await fs.unlink(path.join(process.cwd(), "public", data.image.src)).catch(() => {})
    }

    await fs.unlink(filePath)
    revalidatePath("/log")

    return { error: null, success: true }
  } catch (err) {
    console.error("[deletePost]", err)
    return { error: "Server error — post was not deleted.", success: false }
  }
}

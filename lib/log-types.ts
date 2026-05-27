// Standard display sizes for the cover image column (col 1.5).
// Both orientations share the same column width (240px) so the grid template is always
// `[9rem_240px_1fr]` when an image is present — only the rendered height differs.
// Store source image files at 2× resolution (480×320 / 480×720) for retina screens.
//
// CONSTRAINT: col 2 (content) rendered height MUST be >= col 1.5 (image) rendered height.
// If the content is too short to exceed the image height, the entry is INVALID.
// The admin must validate this before persisting. See LOG-ADMIN-SPEC.md.
export const IMAGE_SIZES = {
  horizontal: { width: 240, height: 160 }, // 3:2 — pool shots, hardware spreads
  vertical:   { width: 240, height: 360 }, // 2:3 — component close-ups, team shots
} as const

export type ImageOrientation = keyof typeof IMAGE_SIZES

// The image column sits between the date (col 1) and the entry content (col 2).
// src: path relative to /public, e.g. "/log/2026-05-19-thruster-array.jpg"
export type CoverImage = {
  src: string
  orientation: ImageOrientation
}

// `order` controls display sequence among entries that share the same date.
// Lower values appear first (top of that day's entries). Assigned by the admin
// when multiple posts exist for the same date. Absent = sorted last by slug.
type WithOrder = { order?: number }

// Notes (level 1) never have cover images — they're too compact.
export type NoteEntry = WithOrder & {
  slug: string
  date: string
  type: "note"
  body: string
}

// Level 2+: cover image optional
export type UpdateEntry = WithOrder & {
  slug: string
  date: string
  type: "update"
  category: string
  heading: string
  body: string
  image?: CoverImage
}

export type MilestoneEntry = WithOrder & {
  slug: string
  date: string
  type: "milestone"
  heading: string
  body: string
  image?: CoverImage
}

export type DispatchEntry = WithOrder & {
  slug: string
  date: string
  type: "dispatch"
  heading: string
  body: string
  image?: CoverImage
}

export type LogEntry = NoteEntry | UpdateEntry | MilestoneEntry | DispatchEntry

export type EntryType = LogEntry["type"]

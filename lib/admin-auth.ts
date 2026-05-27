// Edge-compatible HMAC auth via Web Crypto API (no Node.js crypto).
// Token format: `${base64url(HMAC)}.${timestamp_ms}`
// The cookie is session-only (no maxAge) — clears on tab close.

export const COOKIE_NAME = "admin_session"

const ALGORITHM = { name: "HMAC", hash: "SHA-256" } as const

function envSecret(): string {
  const s = process.env.ADMIN_SECRET
  if (!s) throw new Error("ADMIN_SECRET is not set")
  return s
}

async function importKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    ALGORITHM,
    false,
    ["sign", "verify"]
  )
}

function toBase64Url(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
}

function fromBase64Url(str: string): ArrayBuffer {
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/")
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4)
  const bytes = Uint8Array.from(atob(padded), (c) => c.charCodeAt(0))
  return bytes.buffer as ArrayBuffer
}

export async function createToken(): Promise<string> {
  const key = await importKey(envSecret())
  const ts = Date.now().toString()
  const sig = await crypto.subtle.sign(ALGORITHM, key, new TextEncoder().encode(ts))
  return `${toBase64Url(sig)}.${ts}`
}

const TOKEN_MAX_AGE_MS = 24 * 60 * 60 * 1000 // 24 hours

export async function verifyToken(token: string): Promise<boolean> {
  try {
    const dot = token.indexOf(".")
    if (dot === -1) return false
    const sigPart = token.slice(0, dot)
    const tsPart = token.slice(dot + 1)
    if (Date.now() - parseInt(tsPart, 10) > TOKEN_MAX_AGE_MS) return false
    const key = await importKey(envSecret())
    return crypto.subtle.verify(
      ALGORITHM,
      key,
      fromBase64Url(sigPart),
      new TextEncoder().encode(tsPart)
    )
  } catch {
    return false
  }
}

// ── Edit-mode session (scoped with ":edit" suffix to prevent token reuse) ────

export const EDIT_MODE_COOKIE = "edit_mode_session"
export const EDIT_PATH_COOKIE = "edit_mode_path"

export async function createEditModeToken(): Promise<string> {
  const key = await importKey(envSecret() + ":edit")
  const ts = Date.now().toString()
  const sig = await crypto.subtle.sign(ALGORITHM, key, new TextEncoder().encode(ts))
  return `${toBase64Url(sig)}.${ts}`
}

export async function verifyEditModeToken(token: string): Promise<boolean> {
  try {
    const dot = token.indexOf(".")
    if (dot === -1) return false
    const sigPart = token.slice(0, dot)
    const tsPart = token.slice(dot + 1)
    if (Date.now() - parseInt(tsPart, 10) > TOKEN_MAX_AGE_MS) return false
    const key = await importKey(envSecret() + ":edit")
    return crypto.subtle.verify(
      ALGORITHM,
      key,
      fromBase64Url(sigPart),
      new TextEncoder().encode(tsPart)
    )
  } catch {
    return false
  }
}

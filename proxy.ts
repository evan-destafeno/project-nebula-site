import { NextRequest, NextResponse } from "next/server"
import { verifyToken, COOKIE_NAME } from "@/lib/admin-auth"

export async function proxy(req: NextRequest) {
  // Forward pathname to server layouts (cookies() can't provide this directly)
  const response = NextResponse.next({
    request: { headers: new Headers(req.headers) },
  })
  response.headers.set("x-pathname", req.nextUrl.pathname)

  // Auth guard: only /admin/new requires a valid session cookie
  if (req.nextUrl.pathname.startsWith("/admin/new")) {
    const token = req.cookies.get(COOKIE_NAME)?.value
    if (!token || !(await verifyToken(token))) {
      return NextResponse.redirect(new URL("/admin", req.url))
    }
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico).*)"],
}

import type { Metadata } from "next"
import { Suspense } from "react"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { verifyToken, COOKIE_NAME } from "@/lib/admin-auth"
import { AdminShell } from "@/components/admin/admin-shell"

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
}

async function AdminAuthGate() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token || !(await verifyToken(token))) {
    redirect("/admin?r=1")
  }
  return <AdminShell />
}

export default function AdminPage() {
  return (
    <Suspense fallback={null}>
      <AdminAuthGate />
    </Suspense>
  )
}

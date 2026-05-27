"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { LoginForm } from "@/components/admin/login-form"

function AdminGate() {
  const router = useRouter()
  const params = useSearchParams()
  const [gate, setGate] = useState<"loading" | "login" | "shh">("loading")

  useEffect(() => {
    // Show login if: Konami (?k=1) OR redirected from an expired session (?r=1)
    if (params.get("k") === "1" || params.get("r") === "1") {
      setGate("login")
    } else {
      setGate("shh")
    }
  }, [params])

  if (gate === "loading") return null

  if (gate === "shh") {
    return (
      <div className="min-h-dvh flex items-center justify-center px-6">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="font-italic text-[3rem] leading-[1.1] text-ink-strong hover:text-ink transition-colors duration-150 cursor-pointer select-none"
        >
          Shhh.
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-dvh flex items-center justify-center px-6">
      <div className="w-full max-w-[22rem]">
        <p className="font-italic text-[2.25rem] leading-[1.1] text-ink-strong mb-8">
          What do have we here?
        </p>
        <LoginForm />
      </div> 
    </div>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <AdminGate />
    </Suspense>
  )
}

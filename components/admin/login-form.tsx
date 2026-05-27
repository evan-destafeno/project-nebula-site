"use client"

import { useActionState } from "react"
import { login } from "@/app/admin/actions"

const INITIAL = { error: null }

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, INITIAL)

  return (
    <form action={formAction} className="space-y-3">
      <input
        type="text"
        name="username"
        placeholder="Username"
        autoComplete="username"
        required
        className="w-full bg-paper-base border border-rule rounded-[3px] px-4 py-3 text-[0.9375rem] text-ink placeholder:text-ink-faint focus:outline-none focus:ring-1 focus:ring-accent-base"
      />
      <input
        type="password"
        name="password"
        placeholder="Password"
        autoComplete="current-password"
        required
        className="w-full bg-paper-base border border-rule rounded-[3px] px-4 py-3 text-[0.9375rem] text-ink placeholder:text-ink-faint focus:outline-none focus:ring-1 focus:ring-accent-base"
      />

      {state.error && (
        <p className="eyebrow text-[oklch(0.65_0.20_28)]">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-accent-base text-ink-strong rounded-[4px] px-5 py-3 text-[0.9375rem] font-medium hover:bg-accent-bright transition-colors duration-150 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed mt-1"
      >
        {pending ? "evan was here…" : "Enter"}
      </button>
    </form>
  )
}

"use client"

import { PatchesContext, type Patches } from "@/lib/patches-context"

export function PatchesProvider({
  patches,
  children,
}: {
  patches: Patches
  children: React.ReactNode
}) {
  return (
    <PatchesContext.Provider value={patches}>
      {children}
    </PatchesContext.Provider>
  )
}

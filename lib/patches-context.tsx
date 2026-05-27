"use client"

import { createContext, useContext } from "react"

export type Patches = Record<string, string>

const PatchesContext = createContext<Patches>({})

export const usePatchesContext = () => useContext(PatchesContext)

export { PatchesContext }

"use client"

import type { ReactNode } from "react"
import { usePatchesContext } from "@/lib/patches-context"

type Props = {
  children: string
  className?: string
  patchKey?: string
}

export function WavyText({ children, className, patchKey }: Props): ReactNode {
  const patches = usePatchesContext()
  const text = patchKey !== undefined && patches[patchKey] !== undefined
    ? patches[patchKey]
    : children

  const segments = text.split(/(\s+)/)

  return (
    <>
      <span
        className="sr-only"
        {...(patchKey ? { "data-patch-key": patchKey } : {})}
      >
        {text}
      </span>
      <span className={className} aria-hidden="true">
        {segments.flatMap((seg, segIdx) => {
          if (seg === "") return []
          if (/^\s+$/.test(seg)) {
            return [<span key={`s-${segIdx}`}>{seg}</span>]
          }
          return [
            <span key={`w-${segIdx}`} style={{ whiteSpace: "nowrap" }}>
              {Array.from(seg).map((ch, ci) => (
                <span key={`c-${ci}`} className="wavy-char">
                  {ch}
                </span>
              ))}
            </span>,
          ]
        })}
      </span>
    </>
  )
}

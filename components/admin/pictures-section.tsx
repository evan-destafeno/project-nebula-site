"use client"

// ── Types (mirrored from crew/page.tsx) ───────────────────────────────────────

interface SlotProps {
  label: string
  path: string
  hint?: string
  exists?: boolean
}

// ── Slot ─────────────────────────────────────────────────────────────────────

function Slot({ label, path, hint, exists }: SlotProps) {
  return (
    <div className="flex items-start gap-4 py-4 border-b border-rule last:border-b-0">
      <div className={[
        "mt-0.5 shrink-0 h-2 w-2 rounded-full",
        exists ? "bg-[oklch(0.72_0.17_155)]" : "bg-[oklch(0.45_0.08_50)]",
      ].join(" ")} />
      <div className="min-w-0 flex-1">
        <p className="text-[0.9375rem] text-ink-strong font-medium">{label}</p>
        <p className="eyebrow text-ink-faint mt-0.5 font-mono normal-case tracking-normal text-[0.75rem]">
          {path}
        </p>
        {hint && (
          <p className="text-[0.8125rem] text-ink-faint mt-1 leading-relaxed">{hint}</p>
        )}
      </div>
      <span className={[
        "eyebrow shrink-0 mt-0.5",
        exists ? "text-[oklch(0.72_0.17_155)]" : "text-ink-faint",
      ].join(" ")}>
        {exists ? "uploaded" : "pending"}
      </span>
    </div>
  )
}

// ── Group ─────────────────────────────────────────────────────────────────────

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <p className="eyebrow text-ink-faint mb-4">{title}</p>
      <div className="border border-rule rounded-[4px] divide-y divide-rule px-6">
        {children}
      </div>
    </section>
  )
}

// ── Section root ──────────────────────────────────────────────────────────────

export function PicturesSection() {
  return (
    <div className="flex-1 overflow-y-auto px-10 py-8 max-w-[780px]">

      <p className="text-[0.875rem] text-ink-faint leading-relaxed mb-8">
        Drop files in <span className="font-mono text-ink">public/</span> at the project root, then add the path to the relevant entry in the source. Green dot = file already present.
      </p>

      <Group title="Team photo">
        <Slot
          label="Team photo"
          path="public/team-photo.png"
          hint="Landscape, full group. Replace the existing placeholder file. At least 1200px wide."
        />
      </Group>

      <Group title="Individual portraits — public/portraits/<name>.jpg">
        {Array.from({ length: 8 }, (_, i) => (
          <Slot
            key={i}
            label={`Member ${String(i + 1).padStart(2, "0")}`}
            path={`public/portraits/member-${String(i + 1).padStart(2, "0")}.jpg`}
            hint={i === 0 ? "Portrait (3:4). Add a photo field to the CREW entry in app/crew/page.tsx pointing here." : undefined}
          />
        ))}
      </Group>

      <Group title="Sponsor logos — public/sponsors/<name>.png">
        {Array.from({ length: 3 }, (_, i) => (
          <Slot
            key={i}
            label={`Sponsor ${i + 1}`}
            path={`public/sponsors/sponsor-${i + 1}.png`}
            hint={i === 0 ? "PNG with transparent background, or SVG. Add a logo field to the SPONSORS entry in app/crew/page.tsx pointing here." : undefined}
          />
        ))}
      </Group>

      <p className="text-[0.8125rem] text-ink-faint leading-relaxed border-t border-rule pt-6">
        Filenames above are suggestions. Use any name you like — just make sure the{" "}
        <span className="font-mono text-ink">photo</span> /{" "}
        <span className="font-mono text-ink">logo</span> field in{" "}
        <span className="font-mono text-ink">app/crew/page.tsx</span> points to the actual file.
      </p>

    </div>
  )
}

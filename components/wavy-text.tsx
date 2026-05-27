import type { ReactNode } from "react";

/**
 * WavyText — splits text into per-letter inline-block spans for the JS-driven
 * underwater wave (see OceanEffects). Each `.wavy-char` gets its phase derived
 * from its measured screen position at mount, with a small random jitter, so
 * neighbors share a current and distant letters feel different waters.
 *
 * No CSS animation, no inline animation-delay, no `--wave-i`. The rAF loop in
 * OceanEffects writes `style.transform` per letter per frame while the reveal
 * is active.
 *
 * Accessibility: screen readers see the original string via an `sr-only`
 * sibling. The visual letter spans are `aria-hidden` so SRs don't read the
 * text out one character at a time.
 */
type Props = {
  children: string;
  className?: string;
};

export function WavyText({ children, className }: Props): ReactNode {
  const segments = children.split(/(\s+)/);

  return (
    <>
      {/* suppressHydrationWarning: ContentPatcher mutates this text after hydration */}
      <span className="sr-only" suppressHydrationWarning>{children}</span>
      <span className={className} aria-hidden="true">
        {segments.flatMap((seg, segIdx) => {
          if (seg === "") return [];
          if (/^\s+$/.test(seg)) {
            return [<span key={`s-${segIdx}`}>{seg}</span>];
          }
          return [
            <span key={`w-${segIdx}`} style={{ whiteSpace: "nowrap" }}>
              {Array.from(seg).map((ch, ci) => (
                <span key={`c-${ci}`} className="wavy-char">
                  {ch}
                </span>
              ))}
            </span>,
          ];
        })}
      </span>
    </>
  );
}

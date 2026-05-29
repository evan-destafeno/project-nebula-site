"use client";
import type { CSSProperties } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wordmark } from "@/components/wordmark";
import { WavyText } from "@/components/wavy-text";

const NAV_LINKS = [
  { href: "/epsilon", label: "The Sub" },
  { href: "/crew", label: "Crew" },
  { href: "/log", label: "Log" },
  { href: "/crew#sponsors", label: "Sponsors" },
] as const;

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <>
      <header
        role="banner"
        className="flex flex-col gap-3 px-6 pt-6 sm:px-10 md:flex-row md:items-center md:justify-between md:gap-6 load-up"
        style={{ "--load-delay": "0ms", "--load-dur": "400ms", "--load-y": "6px" } as CSSProperties}
      >
        <Wordmark />
        <nav aria-label="primary">
          <ul className="flex items-center gap-5 md:gap-8">
            {NAV_LINKS.map((link) => {
              const isPage = !link.href.includes("#");
              const isCurrent = isPage && pathname === link.href;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={isCurrent ? "page" : undefined}
                    className="group/nav relative text-[0.8125rem] text-ink-muted transition-colors duration-200 hover:text-ink-strong"
                  >
                    <WavyText>{link.label}</WavyText>
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none absolute -bottom-1 left-0 right-0 h-px origin-left bg-accent-base transition-transform duration-300 [transition-timing-function:var(--ease-quart)] group-hover/nav:scale-x-100 ${isCurrent ? "scale-x-100" : "scale-x-0"}`}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>
      <div
        role="separator"
        className="hairline mt-6 load-rule"
        style={{ "--load-delay": "80ms" } as CSSProperties}
      />
    </>
  );
}

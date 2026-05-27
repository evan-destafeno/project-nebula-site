import Link from "next/link";
import { cn } from "@/lib/utils";
import { WavyText } from "@/components/wavy-text";

type WordmarkProps = {
  className?: string;
  href?: string;
  showSub?: boolean;
};

export function Wordmark({ className, href = "/", showSub = true }: WordmarkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group/wm inline-flex items-baseline gap-3 no-underline",
        className,
      )}
      aria-label="Project Nebula home"
    >
      <span data-wordmark-text className="text-[0.9375rem] font-bold uppercase tracking-[0.22em] text-ink-strong leading-none">
        <WavyText>Project Nebula</WavyText>
      </span>
      {showSub && (
        <span className="font-italic-text text-[0.875rem] text-ink-faint leading-none">
          <WavyText>RoboSub 2026</WavyText>
        </span>
      )}
    </Link>
  );
}

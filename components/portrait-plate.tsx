import type { CSSProperties } from "react";
import Image from "next/image";
import { WavyText } from "@/components/wavy-text";

interface PortraitPlateProps {
  src?: string;
  name: string;
  index: string;
  caption: string;
  imageKey?: string;
  captionKey?: string;
  className?: string;
  style?: CSSProperties;
}

export function PortraitPlate({ src, name, index, caption, imageKey, captionKey, className, style }: PortraitPlateProps) {
  const initials = name
    .split(" ")
    .map((w) => w.match(/[a-zA-Z]/)?.[0] ?? "")
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <figure className={`flex min-w-0 flex-col${className ? ` ${className}` : ""}`} style={style}>
      <div className="relative aspect-[3/4] overflow-hidden rounded-[3px] border bg-paper-base" {...(imageKey ? { "data-image-key": imageKey } : {})}>
        <span
          aria-hidden="true"
          className="absolute left-2.5 top-2.5 z-10 font-mono text-[0.625rem] uppercase tracking-[0.16em] text-ink-muted"
        >
          {index}
        </span>
        {src ? (
          <Image
            src={src}
            alt={`${name}, Project Nebula crew`}
            fill
            className="object-cover grayscale contrast-110"
            sizes="(max-width: 640px) 40vw, 176px"
          />
        ) : (
          <span
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-center select-none font-mono text-2xl text-ink-faint"
          >
            {initials}
          </span>
        )}
      </div>
      <figcaption className="font-italic-text mt-2 text-[0.875rem] text-ink-muted">
        {captionKey ? (
          <WavyText patchKey={captionKey}>{caption}</WavyText>
        ) : (
          caption
        )}
      </figcaption>
    </figure>
  );
}

import Image from "next/image";
import { cn } from "@/lib/utils";
import { WavyText } from "@/components/wavy-text";

type SubAlphaPlateProps = {
  className?: string;
  imageKey?: string;
  imageSrc?: string;
};

export function SubAlphaPlate({ className, imageKey, imageSrc }: SubAlphaPlateProps) {
  return (
    <figure
      className={cn(
        "relative w-full max-w-[420px] flex flex-col gap-3",
        className,
      )}
    >
      <div
        className="relative aspect-[4/3] w-full bg-paper-base overflow-hidden"
        role="img"
        aria-label="Sub-Epsilon, front three-quarter view, vector outline"
        {...(imageKey ? { "data-image-key": imageKey } : {})}
      >
        {/* Hairline frame */}
        <div className="absolute inset-0 border border-rule" aria-hidden="true" />

        {/* Plate label */}
        <div className="absolute top-3 left-3 colophon">
          <span className="text-ink-muted">
            <WavyText patchKey="epsilon.sub-plate.title">Sub-Epsilon</WavyText>
          </span>
          <span className="text-ink-faint mx-1.5">/</span>
          <span className="text-ink-faint">
            <WavyText patchKey="epsilon.sub-plate.view">3/4 view</WavyText>
          </span>
        </div>

        {/* Version */}
        <div className="absolute top-3 right-3 colophon text-right">
          <span className="text-ink-faint">
            <WavyText patchKey="epsilon.sub-plate.version">v0.7.2</WavyText>
          </span>
        </div>

        <Image
          src={imageSrc ?? "/sub-epsilon-3d.png"}
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 420px"
          className="object-contain scale-[1.25] translate-x-[4.7%] -translate-y-[12px]"
          aria-hidden="true"
        />
      </div>

      <figcaption className="font-italic-text text-[0.875rem] leading-snug text-ink-muted">
        <span className="text-ink">
          <WavyText patchKey="epsilon.sub-plate.caption.title">Sub-Epsilon</WavyText>
        </span>
        <span className="mx-1.5 text-ink-faint">·</span>
        <WavyText patchKey="epsilon.sub-plate.caption.desc">frame assembly, 3/4 view, working drawing.</WavyText>
      </figcaption>
    </figure>
  );
}

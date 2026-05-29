"use client";
import { useState } from "react";

interface VideoPlayerProps {
  videoId: string;
  title: string;
  poster?: string;
}

export function VideoPlayer({ videoId, title, poster }: VideoPlayerProps) {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return (
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&autoplay=1`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="absolute inset-0 h-full w-full border-0"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={`Play ${title}`}
      className="group absolute inset-0 h-full w-full cursor-pointer"
    >
      {poster && (
        <img
          src={poster}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
      )}
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-full border border-rule bg-paper-deep/80 transition-colors duration-200 group-hover:bg-paper-base/90">
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            className="h-3.5 w-3.5 translate-x-px fill-ink-strong"
          >
            <path d="M3 2l11 6-11 6V2z" />
          </svg>
        </span>
      </span>
    </button>
  );
}

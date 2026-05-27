import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/wordmark";
import { WavyText } from "@/components/wavy-text";
import Image from "next/image";
import { PortraitPlate } from "@/components/portrait-plate";
import { PatchesProvider } from "@/components/patches-provider";
import { getPageContent } from "@/lib/page-content";

export const metadata: Metadata = {
  title: "Crew",
  description:
    "Eight engineers. Mechanical, electrical, and software — every one of us.",
};

const NAV_LINKS = [
  { href: "/epsilon", label: "The Sub" },
  { href: "/crew", label: "Crew" },
  { href: "/log", label: "Log" },
  { href: "#sponsors", label: "Sponsors" },
] as const;

interface Sponsor {
  initials: string;
  name: string;
  description: string;
  logo?: string;
}

const SPONSORS: Sponsor[] = [
  {
    initials: "SP",
    name: "Sponsor Name",
    description: "One to two sentences about what this organization does and why they support Project Nebula.",
  },
  {
    initials: "SP",
    name: "Sponsor Name",
    description: "One to two sentences about what this organization does and why they support Project Nebula.",
  },
  {
    initials: "SP",
    name: "Sponsor Name",
    description: "One to two sentences about what this organization does and why they support Project Nebula.",
  },
];

const COLOPHON = [
  "Sub-Epsilon",
  "ROS 2 + YOLOv11",
  "8 m rated",
  "Garage-built",
] as const;

interface Member {
  name: string;
  role: string;
  photo?: string;
  bio: string;
  outside?: string;
}

const CREW: Member[] = [
  {
    name: "Name Placeholder",
    role: "Role / Specialization",
    bio: "Two sentences describing what this engineer owns on the sub and what they built for it.",
    outside: "One or two sentences about what this person does outside of RoboSub.",
  },
  {
    name: "Name Placeholder",
    role: "Role / Specialization",
    bio: "Two sentences describing what this engineer owns on the sub and what they built for it.",
    outside: "One or two sentences about what this person does outside of RoboSub.",
  },
  {
    name: "Name Placeholder",
    role: "Role / Specialization",
    bio: "Two sentences describing what this engineer owns on the sub and what they built for it.",
    outside: "One or two sentences about what this person does outside of RoboSub.",
  },
  {
    name: "Name Placeholder",
    role: "Role / Specialization",
    bio: "Two sentences describing what this engineer owns on the sub and what they built for it.",
    outside: "One or two sentences about what this person does outside of RoboSub.",
  },
  {
    name: "Name Placeholder",
    role: "Role / Specialization",
    bio: "Two sentences describing what this engineer owns on the sub and what they built for it.",
    outside: "One or two sentences about what this person does outside of RoboSub.",
  },
  {
    name: "Name Placeholder",
    role: "Role / Specialization",
    bio: "Two sentences describing what this engineer owns on the sub and what they built for it.",
    outside: "One or two sentences about what this person does outside of RoboSub.",
  },
  {
    name: "Name Placeholder",
    role: "Role / Specialization",
    bio: "Two sentences describing what this engineer owns on the sub and what they built for it.",
    outside: "One or two sentences about what this person does outside of RoboSub.",
  },
  {
    name: "Name Placeholder",
    role: "Role / Specialization",
    bio: "Two sentences describing what this engineer owns on the sub and what they built for it.",
    outside: "One or two sentences about what this person does outside of RoboSub.",
  },
];

const ls = (delay: number, dur: number, y?: number): CSSProperties =>
  ({
    "--load-delay": `${delay}ms`,
    "--load-dur": `${dur}ms`,
    ...(y !== undefined && { "--load-y": `${y}px` }),
  } as CSSProperties);

const pad = (n: number) => String(n).padStart(2, "0");

export default async function CrewPage() {
  const patches = await getPageContent("crew");
  return (
    <PatchesProvider patches={patches}>
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>

      <div className="flex min-h-dvh flex-col">
        {/* ── Top band ─────────────────────────────────────────────────── */}
        <header
          role="banner"
          className="flex items-center justify-between gap-6 px-6 pt-6 sm:px-10 load-up"
          style={ls(0, 400, 6)}
        >
          <Wordmark />
          <nav aria-label="primary" className="hidden md:block">
            <ul className="flex items-center gap-8">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group/nav relative text-[0.8125rem] text-ink-muted transition-colors duration-200 hover:text-ink-strong"
                  >
                    <WavyText>{link.label}</WavyText>
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute -bottom-1 left-0 right-0 h-px origin-left scale-x-0 bg-accent-base transition-transform duration-300 [transition-timing-function:var(--ease-quart)] group-hover/nav:scale-x-100"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </header>

        <div
          role="separator"
          className="hairline mt-6 load-rule"
          style={{ "--load-delay": "80ms" } as CSSProperties}
        />

        {/* ── Main ─────────────────────────────────────────────────────── */}
        <main
          id="main"
          className="flex flex-1 flex-col px-6 py-10 sm:px-10 sm:py-14"
        >
          <div className="mx-auto w-full max-w-[1240px]">

            {/* Intro */}
            <div className="grid xl:grid-cols-[minmax(0,720px)_1fr] xl:gap-14">
              <div className="flex max-w-[720px] flex-col gap-4">
                <p
                  className="eyebrow load-up"
                  style={ls(120, 350, 6)}
                >
                  <WavyText patchKey="crew.intro.eyebrow">The Crew · 08 Members</WavyText>
                </p>
                <h1
                  className="display load-up"
                  style={ls(180, 600)}
                >
                  <WavyText patchKey="crew.intro.headline">{"We don't have departments."}</WavyText>
                </h1>
                <p
                  className="kicker load-up"
                  style={ls(300, 500, 8)}
                >
                  <WavyText>{"Every one of us runs the full stack: "}</WavyText>
                  <span className="text-accent-bright"><WavyText>mechanical</WavyText></span>
                  <WavyText>{", "}</WavyText>
                  <span className="text-accent-bright"><WavyText>electrical</WavyText></span>
                  <WavyText>{", and "}</WavyText>
                  <span className="text-accent-bright"><WavyText>software</WavyText></span>
                  <WavyText>.</WavyText>
                </p>
              </div>

              {/* Team photo */}
              <figure
                className="hidden load-up xl:block"
                style={ls(240, 600, 12)}
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-[3px] border border-rule bg-paper-base">
                  <span
                    aria-hidden="true"
                    className="absolute left-2.5 top-2.5 z-10 font-mono text-[0.625rem] uppercase tracking-[0.16em] text-ink-muted"
                  >
                    Team
                  </span>
                  <Image
                    src="/team-photo.png"
                    alt="Project Nebula crew"
                    fill
                    className="object-cover object-center"
                    style={{ objectFit: "cover" }}
                    sizes="(max-width: 1280px) 0px, 40vw"
                    priority
                  />
                </div>
              </figure>
            </div>

            {/* Discipline declaration block */}
            <div
              role="separator"
              className="hairline mt-10 load-rule"
              style={{ "--load-delay": "400ms" } as CSSProperties}
            />
            <div
              className="grid grid-cols-1 sm:grid-cols-3 load-up"
              style={ls(440, 400, 6)}
            >
              <div className="border-b py-5 sm:border-b-0 sm:border-r sm:pr-8">
                <p className="text-base font-bold text-ink-strong">
                  <WavyText>Mechanical Engineering</WavyText>
                </p>
                <p className="eyebrow mt-2 text-ink-muted">8 / 8 Engineers</p>
              </div>
              <div className="border-b py-5 sm:border-b-0 sm:border-r sm:px-8">
                <p className="text-base font-bold text-ink-strong">
                  <WavyText>Electrical Engineering</WavyText>
                </p>
                <p className="eyebrow mt-2 text-ink-muted">8 / 8 Engineers</p>
              </div>
              <div className="py-5 sm:pl-8">
                <p className="text-base font-bold text-ink-strong">
                  <WavyText>Computer Science</WavyText>
                </p>
                <p className="eyebrow mt-2 text-ink-muted">8 / 8 Engineers</p>
              </div>
            </div>
            <div
              role="separator"
              className="hairline load-rule"
              style={{ "--load-delay": "480ms" } as CSSProperties}
            />

            {/* Roster */}
            <ol role="list">
              {CREW.map((member, i) => {
                const rowDelay = 520 + i * 50;
                return (
                <li key={i}>
                  {i > 0 && <div role="separator" className="hairline" />}
                  <article className="grid grid-cols-1 gap-6 py-10 sm:grid-cols-[176px_3fr_2fr] sm:gap-10">
                    <PortraitPlate
                      src={member.photo}
                      name={member.name}
                      index={pad(i + 1)}
                      caption={member.role}
                      className="load-up"
                      style={ls(rowDelay, 500, 10)}
                    />
                    <div className="flex flex-col justify-start gap-2 load-up" style={ls(rowDelay + 40, 500, 8)}>
                      <h2 className="text-[1.5rem] font-bold leading-tight tracking-[-0.025em] text-ink-strong">
                        <WavyText patchKey={`crew.members.${i}.name`}>{member.name}</WavyText>
                      </h2>
                      <p className="eyebrow text-ink-muted"><WavyText patchKey={`crew.members.${i}.role`}>{member.role}</WavyText></p>
                      {member.bio && (
                        <p className="mt-3 max-w-[55ch] text-[0.9375rem] leading-relaxed text-ink-muted">
                          <WavyText patchKey={`crew.members.${i}.bio`}>{member.bio}</WavyText>
                        </p>
                      )}
                    </div>
                    {member.outside && (
                      <div className="flex flex-col gap-2 border-t border-[var(--rule)] pt-5 sm:border-t-0 sm:border-l sm:border-[var(--rule)] sm:pt-0 sm:pl-8 load-up" style={ls(rowDelay + 80, 500, 8)}>
                        <p className="eyebrow text-ink-faint">Beyond the sub</p>
                        <p className="text-[0.9375rem] leading-relaxed text-ink-muted">
                          <WavyText patchKey={`crew.members.${i}.outside`}>{member.outside}</WavyText>
                        </p>
                      </div>
                    )}
                  </article>
                </li>
              );
              })}
            </ol>

            <div role="separator" className="hairline" />

            {/* Sponsors */}
            <section id="sponsors" className="pt-14 pb-2">
              <p className="eyebrow text-ink-faint mb-8">With support from</p>
              <div className="grid grid-cols-1 sm:grid-cols-3">
                {SPONSORS.map((sponsor, i) => (
                  <div
                    key={i}
                    className={[
                      "py-6",
                      i < SPONSORS.length - 1 ? "border-b border-rule sm:border-b-0 sm:border-r sm:pr-10" : "",
                      i > 0 ? "sm:pl-10" : "",
                    ].filter(Boolean).join(" ")}
                  >
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-[3px] border border-rule bg-paper-base overflow-hidden">
                      {sponsor.logo ? (
                        <Image
                          src={sponsor.logo}
                          alt={sponsor.name}
                          width={48}
                          height={48}
                          className="h-full w-full object-contain p-2"
                        />
                      ) : (
                        <span className="font-mono text-[0.5625rem] tracking-widest text-ink-faint uppercase">
                          <WavyText>{sponsor.initials}</WavyText>
                        </span>
                      )}
                    </div>
                    <p className="text-[0.9375rem] font-semibold tracking-[-0.01em] text-ink-strong mb-2">
                      <WavyText patchKey={`crew.sponsors.${i}.name`}>{sponsor.name}</WavyText>
                    </p>
                    <p className="text-[0.875rem] leading-relaxed text-ink-muted max-w-[45ch]">
                      <WavyText patchKey={`crew.sponsors.${i}.description`}>{sponsor.description}</WavyText>
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </main>

        {/* ── Bottom band ──────────────────────────────────────────────── */}
        <div
          role="separator"
          className="hairline load-rule"
          style={{ "--load-delay": "520ms" } as CSSProperties}
        />

        <footer role="contentinfo" className="px-6 py-5 sm:px-10">
          <ul
            role="list"
            className="colophon flex flex-wrap items-center gap-x-3 gap-y-1.5"
          >
            {COLOPHON.map((item, idx) => (
              <li key={item} className="flex items-center gap-3">
                {idx > 0 && (
                  <span aria-hidden="true" className="text-ink-faint">
                    ·
                  </span>
                )}
                <span
                  className={
                    idx === COLOPHON.length - 1 ? "text-ink" : "text-ink-muted"
                  }
                >
                  <WavyText>{item}</WavyText>
                </span>
              </li>
            ))}
            <li className="ms-auto flex items-center gap-2 text-ink-faint">
              <span
                aria-hidden="true"
                className="inline-block h-1.5 w-1.5 rounded-full bg-mission"
              />
              <WavyText>Mission Ready</WavyText>
            </li>
          </ul>
        </footer>
      </div>
    </>
    </PatchesProvider>
  );
}

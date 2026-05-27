import type { Metadata } from "next";
import { Suspense } from "react";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Fraunces } from "next/font/google";
import { cookies, headers } from "next/headers";
import { ClickHint } from "@/components/click-hint";
import { OceanEffects } from "@/components/ocean-effects";
import { ScrollHint } from "@/components/scroll-hint";
import { UnderwaterBackground } from "@/components/underwater-background";
import { KonamiGate } from "@/components/admin/konami-gate";
import { EditModeClient } from "@/components/edit-mode-client";
import { ContentPatcher } from "@/components/content-patcher";
import { verifyEditModeToken, EDIT_MODE_COOKIE, EDIT_PATH_COOKIE } from "@/lib/admin-auth";
import { getPageContent, pathnameToSlug } from "@/lib/page-content";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["italic"],
  axes: ["opsz", "SOFT"],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Project Nebula · Autonomous Submarine · RoboSub 2026",
    template: "%s · Project Nebula",
  },
  description:
    "A non-profit, student-run team of high schoolers building an autonomous submarine in a garage, competing in RoboSub 2026 against universities with full labs and faculty advisors.",
  applicationName: "Project Nebula",
  keywords: [
    "RoboSub",
    "AUV",
    "autonomous underwater vehicle",
    "ROS 2",
    "computer vision",
    "robotics",
    "Project Nebula",
    "high school robotics",
  ],
  authors: [{ name: "Project Nebula" }],
  openGraph: {
    type: "website",
    title: "Project Nebula · Autonomous Submarine",
    description:
      "Built by high schoolers in a garage. Competing in RoboSub 2026.",
    siteName: "Project Nebula",
  },
  twitter: { card: "summary_large_image" },
};

// Async server component for dynamic per-request addons.
// Suspense-wrapped so /_not-found (and other statically prerendered pages) are not blocked.
async function DynamicLayoutAddons() {
  const cookieStore = await cookies();
  const headersList = await headers();

  // ── Edit mode detection ────────────────────────────────────────────────────
  const editToken = cookieStore.get(EDIT_MODE_COOKIE)?.value;
  const editPath = cookieStore.get(EDIT_PATH_COOKIE)?.value;
  const inEditMode =
    !!(editToken && editPath && (await verifyEditModeToken(editToken)));

  // ── Page content patches ───────────────────────────────────────────────────
  // Pathname forwarded by proxy.ts via x-pathname header
  const pathname = headersList.get("x-pathname") ?? "/";
  const patches = await getPageContent(pathnameToSlug(pathname));
  const hasPatches = Object.keys(patches).length > 0;

  return (
    <>
      {/* Inline patches for ContentPatcher — avoids a client-side fetch */}
      {hasPatches && (
        <script
          id="__page_patches__"
          type="application/json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(patches) }}
        />
      )}

      {/* Apply saved content patches on every page load */}
      {hasPatches && <ContentPatcher />}

      {/* Gear cursor + in-place editing overlay (only when admin is in edit mode) */}
      {inEditMode && editPath && <EditModeClient targetPath={editPath} />}
    </>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} ${fraunces.variable}`}
      style={{ colorScheme: "dark" }}
    >
      <body>
        <UnderwaterBackground />
        <div className="ocean-surface">{children}</div>
        <OceanEffects />
        <ScrollHint />
        <ClickHint />
        <KonamiGate />
        <Suspense fallback={null}>
          <DynamicLayoutAddons />
        </Suspense>
      </body>
    </html>
  );
}

import { Hero } from "@/components/hero";
import { PatchesProvider } from "@/components/patches-provider";
import { getPageContent } from "@/lib/page-content";

export default async function Home() {
  const patches = await getPageContent("home");
  return (
    <PatchesProvider patches={patches}>
      <Hero />
    </PatchesProvider>
  );
}

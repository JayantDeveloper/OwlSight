import type { Metadata } from "next";

import { ArchitecturePage } from "@/components/pages/architecture-page";

export const metadata: Metadata = {
  title: "How It Works | OwlSight",
};

export default function HowItWorksPage() {
  return <ArchitecturePage />;
}

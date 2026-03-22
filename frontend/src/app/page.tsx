import type { Metadata } from "next";

import { LandingDemoPage } from "@/components/pages/landing-demo-page";

export const metadata: Metadata = {
  title: "Home | OwlSight",
};

export default function HomePage() {
  return <LandingDemoPage />;
}

"use client";

import { usePathname } from "next/navigation";

import { SiteNav } from "@/components/site-nav";

export function ConditionalNav() {
  const pathname = usePathname();
  if (pathname.startsWith("/app")) return null;
  return <SiteNav pathname={pathname} />;
}

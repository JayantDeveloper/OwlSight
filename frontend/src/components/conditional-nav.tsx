"use client";

import { usePathname } from "next/navigation";

import { SiteNav } from "@/components/site-nav";

const APP_PATHS = ["/app", "/dashboard", "/settings", "/auth"];

export function ConditionalNav() {
  const pathname = usePathname();
  if (APP_PATHS.some((p) => pathname.startsWith(p))) return null;
  return <SiteNav pathname={pathname} />;
}

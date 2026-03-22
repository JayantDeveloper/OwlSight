import type { Metadata } from "next";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";

import { ConditionalNav } from "@/components/conditional-nav";

import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-ibm-plex-mono",
});

export const metadata: Metadata = {
  title: "OwlSight",
  description:
    "Institutional-grade execution intelligence made accessible to crypto traders.",
  icons: {
    icon: "/owlsightlogo.jpg",
    shortcut: "/owlsightlogo.jpg",
    apple: "/owlsightlogo.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${ibmPlexMono.variable}`}>
      <body className="min-h-screen">
        <ConditionalNav />
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";

import { ConditionalNav } from "@/components/conditional-nav";
import { ThemeProvider } from "@/components/theme-provider";
import { Providers } from "@/components/providers";

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
      <head>
        {/* No-flash theme: runs before paint, applies 'light' class if stored */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('owlsight-theme');if(t==='light'){document.documentElement.classList.add('light');}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-screen">
        <Providers>
          <ThemeProvider>
            <ConditionalNav />
            {children}
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}

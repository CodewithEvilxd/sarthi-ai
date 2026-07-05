import type { Metadata } from "next";
import { Inter, Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import Navbar from "@/components/Navbar";
import SignalStrip from "@/components/SignalStrip";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ibm",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sarthi AI — Community Decision Intelligence Platform",
  description: "Real-time AI-powered health, environment, and civic decision intelligence for Indian cities. Live AQI, disease surveillance, complaint routing.",
  keywords: ["AQI", "civic tech", "health monitoring", "air quality", "India", "decision intelligence"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} ${ibmPlexMono.variable} antialiased flex flex-col`}
        style={{ minHeight: '100vh', background: 'var(--z0)', color: 'var(--ink-1)' }}
        suppressHydrationWarning
      >
        <Navbar />
        <SignalStrip />
        <main
          className="flex-1 max-w-7xl w-full mx-auto px-6 md:px-8 py-8"
          style={{ position: 'relative', zIndex: 1 }}
        >
          {children}
        </main>
        <footer
          style={{
            borderTop: '1px solid var(--border-subtle)',
            background: 'var(--z1)',
            padding: '20px 24px',
            textAlign: 'center',
            fontSize: 11,
            color: 'var(--ink-3)',
            letterSpacing: '0.04em',
            position: 'relative',
            zIndex: 1
          }}
        >
          © {new Date().getFullYear()} Sarthi AI · Community Decision Intelligence Platform · Built for Gen AI Academy APAC
        </footer>
      </body>
    </html>
  );
}

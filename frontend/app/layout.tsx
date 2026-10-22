import { RequestErrorBanner } from "./request-error-banner";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import "./campus.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const spaceGrotesk = Space_Grotesk({ variable: "--font-space-grotesk", subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "EDOPS — Connected school operations",
  description: "Manage school setup, academic structure and roster from one connected workspace.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.png", type: "image/png", sizes: "64x64" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: { title: "EDOPS", description: "School operations, properly connected.", images: ["/EDOPSLogo.png"] },
  twitter: { card: "summary_large_image", title: "EDOPS", description: "School operations, properly connected.", images: ["/EDOPSLogo.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable}`}>{children}<RequestErrorBanner /></body></html>;
}

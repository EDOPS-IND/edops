import { RequestErrorBanner } from "./request-error-banner";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import "./campus.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const spaceGrotesk = Space_Grotesk({ variable: "--font-space-grotesk", subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  return {
    metadataBase: new URL(origin),
    title: "EDOPS — Connected school operations",
    description: "Manage school setup, academic structure and roster from one connected workspace.",
    icons: { icon: "/favicon.png", shortcut: "/favicon.png", apple: "/logo.png" },
    openGraph: { title: "EDOPS", description: "School operations, properly connected.", images: [`${origin}/og-api.png`] },
    twitter: { card: "summary_large_image", title: "EDOPS", description: "School operations, properly connected.", images: [`${origin}/og-api.png`] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable}`}>{children}<RequestErrorBanner /></body></html>;
}

import type { Metadata } from "next";
import { Libre_Baskerville, Manrope } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/providers/app-providers";
import { AppShell } from "@/components/layout/app-shell";
import { StructuredDataScript } from "@/components/seo/structured-data-script";
import { brandThemeStyle } from "@/lib/brand-theme";
import { getBrandConfig } from "@/lib/brand";
import { buildWebsiteSchema } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

const display = Libre_Baskerville({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const sans = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return {
    metadataBase: new URL(siteConfig.url),
    title: {
      default: siteConfig.name,
      template: `%s | ${siteConfig.name}`,
    },
    description: siteConfig.description,
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any", type: "image/x-icon" },
        { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
        { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      ],
      apple: [
        { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      ],
      shortcut: ["/favicon.ico"],
    },
    manifest: "/manifest.webmanifest",
    openGraph: {
      title: siteConfig.name,
      description: siteConfig.description,
      type: "website",
      url: siteConfig.url,
      siteName: siteConfig.name,
      images: [{ url: `${siteConfig.url}/opengraph-image` }],
    },
    twitter: {
      card: "summary_large_image",
      title: siteConfig.name,
      description: siteConfig.description,
      images: [`${siteConfig.url}/opengraph-image`],
    },
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const brand = await getBrandConfig();

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${display.variable} ${sans.variable} h-full antialiased`}
    >
      <body
        className="min-h-full bg-[var(--background)] font-sans text-[var(--foreground)]"
        style={brandThemeStyle(brand.theme)}
      >
        <StructuredDataScript data={buildWebsiteSchema()} />
        <AppProviders defaultTheme={brand.theme.mode}>
          <AppShell brand={brand}>{children}</AppShell>
        </AppProviders>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { StructuredDataScript } from "@/components/seo/structured-data-script";
import { TrustPage } from "@/components/public/trust-page";
import { getBrandConfig } from "@/lib/brand";
import { absoluteUrl, buildPageMetadata, buildWebPageStructuredData } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Contact VanterenPress",
  description: "Contact VanterenPress for newsroom tips, editorial questions, support requests, press inquiries, and advertiser conversations.",
  path: "/contact",
});

export default async function ContactPage() {
  const brand = await getBrandConfig();

  return (
    <>
      <StructuredDataScript
        data={buildWebPageStructuredData({
          title: "Contact VanterenPress",
          description: "Contact VanterenPress for newsroom tips, editorial questions, support requests, press inquiries, and advertiser conversations.",
          url: absoluteUrl("/contact"),
          breadcrumbs: [
            { name: "Home", url: absoluteUrl("/") },
            { name: "Contact", url: absoluteUrl("/contact") },
          ],
        })}
      />
      <TrustPage
        badge="Contact"
        title="Reach the newsroom"
        summary="Use these channels for editorial tips, press inquiries, support requests, and advertising conversations."
        sections={[
          {
            title: "Editorial",
            body: [
              `Email tips, sourcing, corrections, and live coverage leads to ${brand.supportEmail}.`,
              "For urgent story verification, use the newsroom phone line listed in the internal contact directory.",
            ],
          },
          {
            title: "Support and sales",
            body: [
              "Support questions go to support@globalpress.network.",
              "Advertising, sponsorship, and enterprise partnerships are routed through the advertiser inquiry flow.",
            ],
          },
        ]}
        cta={{ label: "Advertiser inquiry", href: "/advertise/inquiry" }}
      />
    </>
  );
}

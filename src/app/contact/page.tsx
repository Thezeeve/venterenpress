import { TrustPage } from "@/components/public/trust-page";
import { getBrandConfig } from "@/lib/brand";

export default async function ContactPage() {
  const brand = await getBrandConfig();

  return (
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
  );
}

import { TrustPage } from "@/components/public/trust-page";

export default function CareersPage() {
  return (
    <TrustPage
      badge="Careers"
      title="Join the newsroom"
      summary="We hire editors, reporters, engineers, product specialists, and operations staff who care about high-trust global coverage."
      sections={[
        {
          title: "Open roles",
          body: [
            "Editorial positions include regional editors, reporters, fact checkers, and live coverage producers.",
            "Product and engineering roles support the publishing platform, media workflows, and audience products.",
          ],
        },
      ]}
    />
  );
}

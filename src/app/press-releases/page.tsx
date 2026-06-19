import { TrustPage } from "@/components/public/trust-page";

export default function PressReleasesPage() {
  return (
    <TrustPage
      badge="Press releases"
      title="Press release publishing"
      summary="Organizations can submit press releases for marketplace review, distribution, and sponsored handling."
      sections={[
        {
          title: "Submission process",
          body: [
            "Press releases are reviewed for formatting, sponsorship labeling, and regional distribution fit.",
            "Editorial teams can route releases to partner feeds and enterprise audiences as needed.",
          ],
        },
      ]}
      cta={{ label: "Submit a press release", href: "/advertise/press-release" }}
    />
  );
}

import { TrustPage } from "@/components/public/trust-page";

export default function EditorialStandardsPage() {
  return (
    <TrustPage
      badge="Editorial standards"
      title="How we report and edit"
      summary="Our editorial process emphasizes sourcing, verification, contextual reporting, and clear separation between facts and analysis."
      sections={[
        {
          title: "Reporting standards",
          body: [
            "Stories should include primary sourcing wherever possible, and secondary sources should be clearly characterized.",
            "Editors are expected to review framing, chronology, and category placement before publication.",
          ],
        },
        {
          title: "Publishing workflow",
          body: [
            "Article states move through draft, submitted, fact-checking, editor review, approved, scheduled, published, and archived.",
            "Editorial notes, approvals, and corrections remain available in version history and workflow comments.",
          ],
        },
      ]}
    />
  );
}

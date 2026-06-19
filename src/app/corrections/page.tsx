import { TrustPage } from "@/components/public/trust-page";

export default function CorrectionsPage() {
  return (
    <TrustPage
      badge="Corrections"
      title="Corrections policy"
      summary="When we get something wrong, we correct it clearly, preserve the record, and disclose the change to readers."
      sections={[
        {
          title: "What gets corrected",
          body: [
            "Factual inaccuracies, misattributed quotes, wrong dates, and labeling errors are corrected as soon as verified.",
            "Minor clarifications may be made without a correction note when they do not change the meaning of the story.",
          ],
        },
        {
          title: "How we disclose",
          body: [
            "Substantive corrections are shown on the article page and retained in the article version history.",
            "Editorial teams should attach workflow notes to explain the reason for the change.",
          ],
        },
      ]}
    />
  );
}

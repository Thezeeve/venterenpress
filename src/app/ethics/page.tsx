import { TrustPage } from "@/components/public/trust-page";

export default function EthicsPage() {
  return (
    <TrustPage
      badge="Ethics"
      title="Ethics policy"
      summary="We separate reporting, opinion, sponsored content, and marketplace listings with clear labels and editorial review."
      sections={[
        {
          title: "Core principles",
          body: [
            "Accuracy, independence, transparency, and accountability guide all newsroom decisions.",
            "Conflicts of interest must be disclosed to editors before publication.",
          ],
        },
        {
          title: "Corrections",
          body: [
            "Verified factual errors are corrected quickly and transparently with a visible correction note.",
            "Substantive changes are logged in version history and editorial workflow notes.",
          ],
        },
      ]}
    />
  );
}

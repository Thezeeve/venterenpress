import { TrustPage } from "@/components/public/trust-page";

export default function SubscribePage() {
  return (
    <TrustPage
      badge="Subscribe"
      title="Support premium reporting"
      summary="Choose a plan that fits your reading habits, team needs, or enterprise distribution requirements."
      sections={[
        {
          title: "What subscription unlocks",
          body: [
            "Premium investigations, live alerts, member newsletters, bookmarks, and account preferences.",
            "Reader access is metered so the newsroom can support sustainable independent reporting.",
          ],
        },
      ]}
      cta={{ label: "View plans", href: "/pricing" }}
    />
  );
}

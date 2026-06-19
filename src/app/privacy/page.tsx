import { TrustPage } from "@/components/public/trust-page";

export default function PrivacyPage() {
  return (
    <TrustPage
      badge="Privacy"
      title="Privacy policy"
      summary="We collect only the data needed to run the newsroom, manage subscriptions, and improve the reader experience."
      sections={[
        {
          title: "Data collection",
          body: [
            "Account data, reading preferences, subscription status, and limited usage analytics support the platform.",
            "We do not sell personal data as part of this newsroom product.",
          ],
        },
        {
          title: "Your controls",
          body: [
            "Readers can manage newsletters, notifications, and account settings from the account center.",
            "Cookie and session behavior is limited to what the product needs to function and meter access.",
          ],
        },
      ]}
    />
  );
}

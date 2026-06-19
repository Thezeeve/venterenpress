import { TrustPage } from "@/components/public/trust-page";

export default function TermsPage() {
  return (
    <TrustPage
      badge="Terms"
      title="Terms of service"
      summary="These terms govern use of the newsroom platform, subscriber services, and partner distribution products."
      sections={[
        {
          title: "Acceptable use",
          body: [
            "Users must not abuse authentication, comment systems, or account features.",
            "Automated access to APIs should follow published policies and rate limits.",
          ],
        },
        {
          title: "Subscriptions and billing",
          body: [
            "Subscription purchases are governed by the billing provider and the applicable plan terms.",
            "Premium access may be limited by account status, regional rights, or editorial policy.",
          ],
        },
      ]}
    />
  );
}

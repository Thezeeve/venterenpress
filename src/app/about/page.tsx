import { TrustPage } from "@/components/public/trust-page";

export default function AboutPage() {
  return (
    <TrustPage
      badge="About"
      title="Independent global reporting for an international audience"
      summary="The newsroom platform is built for breaking news, investigations, live coverage, and multilingual publishing."
      sections={[
        {
          title: "What we publish",
          body: [
            "We publish original reporting, analysis, opinion, video, live blogs, newsletters, and data journalism packages across regional editions.",
            "Our newsroom workflow is designed for verification, editorial accountability, and fast distribution at global scale.",
          ],
        },
        {
          title: "How we operate",
          body: [
            "The platform separates editorial roles, fact-checking, and publishing approvals so launch decisions remain auditable.",
            "Media assets, subscriptions, analytics, and syndication are managed as part of one production stack.",
          ],
        },
      ]}
    />
  );
}

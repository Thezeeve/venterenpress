import type { Metadata } from "next";
import { requireDashboardUser } from "@/lib/server-auth";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireDashboardUser();

  return <div data-platform-shell>{children}</div>;
}

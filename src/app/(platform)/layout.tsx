import { requireDashboardUser } from "@/lib/server-auth";

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireDashboardUser();

  return <div data-platform-shell>{children}</div>;
}

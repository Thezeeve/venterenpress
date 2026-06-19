"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Bell, Menu, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  readAt: Date | string | null;
};

type NavEdition = {
  id: string;
  code: string;
  name: string;
  region: string;
};

type NavProps = {
  editions: NavEdition[];
  notifications: NotificationItem[];
  isLoggedIn: boolean;
  navItems: { label: string; href: string }[];
};

export function DesktopPrimaryNav({ navItems }: Pick<NavProps, "navItems">) {
  const pathname = usePathname();

  return (
    <nav className="hidden flex-1 items-center justify-center gap-1.5 px-4 lg:flex xl:px-8">
      {navItems.map((item) => {
        const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href.split("?")[0]);
        return (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "relative inline-flex min-h-[44px] items-center justify-center rounded-full px-4 py-2.5 text-[0.94rem] font-medium tracking-[0.01em] text-white/84 transition duration-200 hover:bg-white/[0.055] hover:text-white xl:px-5 xl:text-[0.98rem]",
              isActive ? "bg-white/[0.075] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]" : "",
            )}
          >
            {item.label}
            {isActive ? (
              <span className="absolute inset-x-4 bottom-1.5 h-[2px] rounded-full bg-[#D71920] xl:inset-x-5" />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

export function DesktopUtilityNav({
  notifications,
  isLoggedIn,
}: Pick<NavProps, "notifications" | "isLoggedIn">) {
  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.readAt).length,
    [notifications],
  );

  return (
    <div className="hidden shrink-0 items-center gap-2.5 lg:flex">
      <Link
        href="/search"
        aria-label="Search"
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-white/[0.045] text-white/88 transition hover:border-white/18 hover:bg-white/[0.08] hover:text-white"
      >
        <Search className="h-4 w-4" />
      </Link>

      {isLoggedIn ? (
        <Link
          href="/account/notifications"
          aria-label="Notifications"
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-white/[0.045] text-white/88 transition hover:border-white/18 hover:bg-white/[0.08] hover:text-white"
        >
          <Bell className="h-4 w-4" />
          {unreadCount ? (
            <Badge className="absolute -right-2 -top-2 h-5 min-w-5 rounded-full bg-[var(--accent)] px-1.5 text-[10px] text-white">
              {unreadCount}
            </Badge>
          ) : null}
        </Link>
      ) : null}

      <Link
        href="/pricing"
        className="inline-flex h-10 min-w-[144px] items-center justify-center rounded-full bg-[#D71920] px-6 text-sm font-semibold whitespace-nowrap text-white shadow-[0_12px_24px_rgba(215,25,32,0.22)] transition hover:bg-[#bf171d] hover:shadow-[0_14px_28px_rgba(215,25,32,0.26)]"
      >
        Subscribe
      </Link>
    </div>
  );
}

export function NewsroomNavigation({ notifications, isLoggedIn, navItems }: NavProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.readAt).length,
    [notifications],
  );
  const mobileLinks = useMemo(
    () => [
      ...navItems,
      { label: "Latest News", href: "/latest" },
      { label: "Most Read", href: "/most-read" },
    ],
    [navItems],
  );

  return (
    <>
      <div className="flex items-center gap-2 lg:hidden">
        <Link
          href="/search"
          aria-label="Search"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-white/[0.045] text-white/88"
        >
          <Search className="h-4 w-4" />
        </Link>
        {isLoggedIn ? (
          <Link
            href="/account/notifications"
            aria-label="Notifications"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-white/[0.045] text-white/88"
          >
            <Bell className="h-4 w-4" />
            {unreadCount ? <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[var(--accent)]" /> : null}
          </Link>
        ) : null}
        <Button
          variant="outline"
          size="sm"
          className="rounded-full border-white/15 bg-white/[0.045] text-white hover:bg-white/[0.08]"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="h-4 w-4" />
        </Button>
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-[90] bg-black/60 lg:hidden">
          <div className="absolute right-0 top-0 h-full w-full max-w-sm overflow-y-auto bg-[#081221] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-white/45">Menu</div>
                <div className="font-serif text-2xl text-white">VANTERENPRESS</div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10 hover:text-white"
                onClick={() => setMobileOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-6 space-y-6">
              <div className="grid gap-2">
                {mobileLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "rounded-xl border border-white/10 px-4 py-3 text-sm text-white/88 transition",
                      pathname === link.href ? "bg-white/10 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]" : "bg-white/4",
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              <Link
                href="/pricing"
                onClick={() => setMobileOpen(false)}
                className="block rounded-lg bg-[#D71920] px-4 py-3 text-center text-sm font-semibold text-white"
              >
                Subscribe
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

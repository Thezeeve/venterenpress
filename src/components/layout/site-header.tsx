import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Zap } from "lucide-react";
import type { BrandConfig } from "@/lib/brand";
import { isDatabaseAvailable } from "@/lib/database-availability";
import { getSeedHomepageBundle } from "@/lib/news-providers/seed-content";
import { slugifyValue } from "@/lib/newsroom";
import { getVisiblePublicNavItems } from "@/lib/public-story-feed";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/server-auth";
import { siteConfig } from "@/lib/site";
import {
  DesktopPrimaryNav,
  DesktopUtilityNav,
  NewsroomNavigation,
} from "@/components/layout/newsroom-navigation";

export async function SiteHeader({ brand }: { brand: BrandConfig }) {
  const seedBundle = getSeedHomepageBundle();
  const userPromise = getCurrentUser();
  const databaseAvailable = await isDatabaseAvailable();
  const [user, editions, notifications, breakingBanner, navItems] = await Promise.all([
    userPromise,
    databaseAvailable ? prisma.edition.findMany({
      orderBy: { name: "asc" },
      take: 8,
    }).catch(() => []) : [],
    userPromise.then((currentUser) =>
      databaseAvailable && currentUser
        ? prisma.notification.findMany({
            where: { userId: currentUser.id },
            orderBy: { createdAt: "desc" },
            take: 5,
          }).catch(() => [])
        : [],
    ),
    databaseAvailable ? prisma.breakingNewsBanner.findFirst({
      where: {
        isActive: true,
        startsAt: { lte: new Date() },
        OR: [{ endsAt: null }, { endsAt: { gte: new Date() } }],
      },
      orderBy: [{ priority: "desc" }, { startsAt: "desc" }],
    }).catch(() => null) : null,
    getVisiblePublicNavItems(),
  ]);

  const navEditions =
    editions.length > 0
      ? editions.map((edition) => ({
          id: edition.id,
          code: edition.code,
          name: edition.name,
          region: edition.region,
        }))
      : siteConfig.editions.map((label) => ({
          id: slugifyValue(label),
          code: slugifyValue(label),
          name: label,
          region: label,
        }));

  return (
    <header className="sticky top-0 z-50 border-b border-slate-900 bg-[#04111F] text-white shadow-[0_10px_30px_rgba(0,0,0,0.28)]">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 sm:px-8 lg:h-[74px] lg:gap-4 lg:px-8 xl:gap-6">
        <div className="flex w-[250px] shrink-0 items-center xl:w-[290px]">
          <Link href="/" className="flex w-full items-center gap-3.5">
            <div className="relative h-10 w-10 shrink-0 md:h-11 md:w-11 lg:h-12 lg:w-12">
              <Image
                src={brand.logoUrl}
                alt={`${brand.name} logo`}
                fill
                sizes="(max-width: 768px) 40px, (max-width: 1024px) 44px, 48px"
                className="object-contain"
                priority
              />
            </div>
            <div className="min-w-0">
              <div className="text-[1rem] font-semibold leading-none tracking-[0.01em] text-white sm:text-[1.08rem] lg:text-[1.18rem]">
                {brand.name}
              </div>
            </div>
          </Link>
        </div>

        <DesktopPrimaryNav navItems={navItems} />

        <DesktopUtilityNav notifications={notifications} isLoggedIn={Boolean(user)} />

        <div className="lg:hidden">
          <NewsroomNavigation
            editions={navEditions}
            notifications={notifications}
            isLoggedIn={Boolean(user)}
            navItems={navItems}
          />
        </div>
      </div>

      <div className="bg-[linear-gradient(90deg,#cf1118_0%,#d71920_52%,#bf1217_100%)] text-white">
        <div className="mx-auto flex max-w-[1500px] items-center gap-3 px-4 py-2.5 sm:px-8 lg:px-8">
          <div className="inline-flex shrink-0 items-center gap-2 rounded-md bg-black/14 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em]">
            <Zap className="h-3.5 w-3.5 fill-current" />
            Breaking News
          </div>
          <div className="min-w-0 flex-1 overflow-hidden text-[13px] sm:text-sm">
            <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
              <span className="truncate font-medium">
                {breakingBanner?.title ?? seedBundle.breakingBanners[0]?.title ?? `${brand.name} newsroom is live with edition-specific coverage`}
              </span>
              <span className="shrink-0 text-white/75">2m ago</span>
            </div>
          </div>
          <Link
            href={breakingBanner?.linkUrl ?? seedBundle.breakingBanners[0]?.linkUrl ?? "/latest"}
            className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-white"
          >
            View all updates
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}

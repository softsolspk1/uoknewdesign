import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

function classifyDevice(ua: string): "mobile" | "tablet" | "desktop" {
  const s = ua.toLowerCase();
  if (/ipad|tablet/.test(s)) return "tablet";
  if (/mobile|android|iphone/.test(s)) return "mobile";
  return "desktop";
}

function classifyBrowser(ua: string): string {
  const s = ua.toLowerCase();
  if (s.includes("edg/")) return "Edge";
  if (s.includes("opr/") || s.includes("opera")) return "Opera";
  if (s.includes("chrome/") && !s.includes("chromium")) return "Chrome";
  if (s.includes("crios")) return "Chrome";
  if (s.includes("fxios") || s.includes("firefox")) return "Firefox";
  if (s.includes("safari/") && !s.includes("chrome")) return "Safari";
  return "Other";
}

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      total,
      viewsToday,
      viewsYesterday,
      viewsLast7,
      viewsLast30,
      topPagesRaw,
      recentRows,
      uniqueTotalRaw,
      uniqueTodayRaw,
    ] = await Promise.all([
      prisma.pageView.count(),
      prisma.pageView.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.pageView.count({ where: { createdAt: { gte: yesterdayStart, lt: todayStart } } }),
      prisma.pageView.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.pageView.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.pageView.groupBy({
        by: ["path"],
        _count: { path: true },
        orderBy: { _count: { path: "desc" } },
        take: 12,
      }),
      // Pull the raw fields needed for trend/device/browser/referrer
      // breakdowns ourselves — 30 days of traffic at this site's volume is
      // small enough to aggregate in JS without a second SQL dialect to
      // maintain.
      prisma.pageView.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true, referrer: true, userAgent: true, ip: true },
      }),
      prisma.pageView.findMany({ distinct: ["ip"], select: { ip: true } }),
      prisma.pageView.findMany({
        where: { createdAt: { gte: todayStart } },
        distinct: ["ip"],
        select: { ip: true },
      }),
    ]);

    const topPages = topPagesRaw.map((p) => ({ path: p.path, views: p._count.path }));

    // Daily trend for the last 30 days, zero-filled for days with no traffic
    const trendMap = new Map<string, number>();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(todayStart);
      d.setDate(d.getDate() - i);
      trendMap.set(dayKey(d), 0);
    }

    const deviceCounts = { mobile: 0, tablet: 0, desktop: 0 };
    const browserCounts = new Map<string, number>();
    const referrerCounts = new Map<string, number>();

    for (const row of recentRows) {
      const key = dayKey(row.createdAt);
      if (trendMap.has(key)) trendMap.set(key, (trendMap.get(key) || 0) + 1);

      const ua = row.userAgent || "";
      deviceCounts[classifyDevice(ua)]++;
      const browser = classifyBrowser(ua);
      browserCounts.set(browser, (browserCounts.get(browser) || 0) + 1);

      let refLabel = "Direct / None";
      if (row.referrer) {
        try {
          const host = new URL(row.referrer).hostname.replace(/^www\./, "");
          refLabel = host === "uok.edu.pk" ? "Internal navigation" : host;
        } catch {
          refLabel = "Direct / None";
        }
      }
      referrerCounts.set(refLabel, (referrerCounts.get(refLabel) || 0) + 1);
    }

    const dailyTrend = Array.from(trendMap.entries()).map(([date, views]) => ({ date, views }));
    const browsers = Array.from(browserCounts.entries())
      .map(([name, views]) => ({ name, views }))
      .sort((a, b) => b.views - a.views);
    const topReferrers = Array.from(referrerCounts.entries())
      .map(([referrer, views]) => ({ referrer, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    return NextResponse.json({
      summary: {
        total,
        today: viewsToday,
        yesterday: viewsYesterday,
        last7Days: viewsLast7,
        last30Days: viewsLast30,
        uniqueVisitorsTotal: uniqueTotalRaw.length,
        uniqueVisitorsToday: uniqueTodayRaw.length,
      },
      dailyTrend,
      topPages,
      topReferrers,
      devices: deviceCounts,
      browsers,
    });
  } catch (error: any) {
    console.error("Admin analytics error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

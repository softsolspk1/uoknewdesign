import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Parallel queries for high performance
    const [
      totalPageViews,
      viewsToday,
      viewsThisWeek,
      totalPages,
      departmentPages,
      institutePages,
      totalContacts,
      unreadContacts,
      totalUsers,
      recentContacts,
      recentPages,
    ] = await Promise.all([
      prisma.pageView.count(),
      prisma.pageView.count({
        where: { createdAt: { gte: todayStart } },
      }),
      prisma.pageView.count({
        where: { createdAt: { gte: sevenDaysAgo } },
      }),
      prisma.page.count(),
      prisma.page.count({ where: { category: "department" } }),
      prisma.page.count({ where: { category: "institute" } }),
      prisma.contactSubmission.count(),
      prisma.contactSubmission.count({ where: { status: "unread" } }),
      prisma.user.count(),
      prisma.contactSubmission.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
      }),
      prisma.page.findMany({
        take: 6,
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          slug: true,
          title: true,
          category: true,
          updatedAt: true,
        },
      }),
    ]);

    // Top pages
    const topViewsRaw = await prisma.pageView.groupBy({
      by: ["path"],
      _count: { path: true },
      orderBy: { _count: { path: "desc" } },
      take: 5,
    });

    const topPages = topViewsRaw.map((v) => ({
      path: v.path,
      views: v._count.path,
    }));

    return NextResponse.json({
      traffic: {
        total: totalPageViews,
        today: viewsToday,
        thisWeek: viewsThisWeek,
        topPages,
      },
      pages: {
        total: totalPages,
        departments: departmentPages,
        institutes: institutePages,
        other: totalPages - departmentPages - institutePages,
        recent: recentPages,
      },
      contacts: {
        total: totalContacts,
        unread: unreadContacts,
        recent: recentContacts,
      },
      users: {
        total: totalUsers,
      },
    });
  } catch (error: any) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

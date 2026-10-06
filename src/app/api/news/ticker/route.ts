import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ensureExtraSchema } from "@/lib/schemaBootstrap";

// Public, unauthenticated feed for the site-wide header news ticker.
// Only exposes the fields needed to render it.
export async function GET() {
  try {
    await ensureExtraSchema();
    const items = await prisma.news.findMany({
      where: { isPublished: true },
      orderBy: [{ order: "asc" }, { date: "desc" }],
      take: 10,
      select: { id: true, title: true, link: true, pdfUrl: true, date: true },
    });
    return NextResponse.json(
      { items },
      { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } }
    );
  } catch (error) {
    console.error("News ticker fetch error:", error);
    return NextResponse.json({ items: [] });
  }
}

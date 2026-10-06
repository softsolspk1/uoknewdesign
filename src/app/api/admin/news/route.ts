import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { regenerateNewsSection } from "@/lib/homeSections";
import { ensureExtraSchema } from "@/lib/schemaBootstrap";

async function requireAdminSession() {
  const session = await getServerSession(authOptions);
  if (!session) return null;
  return session;
}

export async function GET() {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await ensureExtraSchema();
  const news = await prisma.news.findMany({ orderBy: [{ order: "asc" }, { date: "desc" }] });
  return NextResponse.json({ news });
}

export async function POST(req: NextRequest) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await ensureExtraSchema();
  const body = await req.json();
  const { title, excerpt, content, imageUrl, pdfUrl, link, isPublished, order, date } = body;

  if (!title) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }

  const created = await prisma.news.create({
    data: {
      title,
      excerpt: excerpt || null,
      content: content || excerpt || title,
      imageUrl: imageUrl || null,
      pdfUrl: pdfUrl || null,
      link: link || null,
      isPublished: isPublished ?? true,
      order: typeof order === "number" ? order : 0,
      date: date ? new Date(date) : new Date(),
    },
  });

  await regenerateNewsSection();
  return NextResponse.json({ success: true, news: created });
}

export async function PUT(req: NextRequest) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await ensureExtraSchema();
  const body = await req.json();
  const { id, title, excerpt, content, imageUrl, pdfUrl, link, isPublished, order, date } = body;

  if (!id) return NextResponse.json({ error: "News ID is required." }, { status: 400 });

  const existing = await prisma.news.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "News item not found." }, { status: 404 });

  const updated = await prisma.news.update({
    where: { id },
    data: {
      title: title !== undefined ? title : existing.title,
      excerpt: excerpt !== undefined ? excerpt : existing.excerpt,
      content: content !== undefined ? content : existing.content,
      imageUrl: imageUrl !== undefined ? imageUrl : existing.imageUrl,
      pdfUrl: pdfUrl !== undefined ? pdfUrl : existing.pdfUrl,
      link: link !== undefined ? link : existing.link,
      isPublished: isPublished !== undefined ? isPublished : existing.isPublished,
      order: order !== undefined ? order : existing.order,
      date: date !== undefined ? new Date(date) : existing.date,
    },
  });

  await regenerateNewsSection();
  return NextResponse.json({ success: true, news: updated });
}

export async function DELETE(req: NextRequest) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "News ID is required." }, { status: 400 });

  await prisma.news.delete({ where: { id } });
  await regenerateNewsSection();
  return NextResponse.json({ success: true });
}

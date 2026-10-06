import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { regenerateFaqSection } from "@/lib/homeSections";

async function requireAdminSession() {
  const session = await getServerSession(authOptions);
  if (!session) return null;
  return session;
}

export async function GET() {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const faqs = await prisma.faq.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json({ faqs });
}

export async function POST(req: NextRequest) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { question, answer, isPublished, order } = body;

  if (!question || !answer) {
    return NextResponse.json({ error: "Question and answer are required." }, { status: 400 });
  }

  let finalOrder = order;
  if (typeof finalOrder !== "number") {
    const max = await prisma.faq.aggregate({ _max: { order: true } });
    finalOrder = (max._max.order ?? -1) + 1;
  }

  const created = await prisma.faq.create({
    data: { question, answer, isPublished: isPublished ?? true, order: finalOrder },
  });

  await regenerateFaqSection();
  return NextResponse.json({ success: true, faq: created });
}

export async function PUT(req: NextRequest) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, question, answer, isPublished, order } = body;

  if (!id) return NextResponse.json({ error: "FAQ ID is required." }, { status: 400 });

  const existing = await prisma.faq.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "FAQ not found." }, { status: 404 });

  const updated = await prisma.faq.update({
    where: { id },
    data: {
      question: question !== undefined ? question : existing.question,
      answer: answer !== undefined ? answer : existing.answer,
      isPublished: isPublished !== undefined ? isPublished : existing.isPublished,
      order: order !== undefined ? order : existing.order,
    },
  });

  await regenerateFaqSection();
  return NextResponse.json({ success: true, faq: updated });
}

export async function DELETE(req: NextRequest) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "FAQ ID is required." }, { status: 400 });

  await prisma.faq.delete({ where: { id } });
  await regenerateFaqSection();
  return NextResponse.json({ success: true });
}

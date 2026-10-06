import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { regenerateHeroSlider } from "@/lib/homeSections";
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
  const slides = await prisma.slide.findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }] });
  return NextResponse.json({ slides });
}

export async function POST(req: NextRequest) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await ensureExtraSchema();
  const body = await req.json();
  const { heading, description, imageUrl, videoUrl, isPublished, order } = body;

  if (!heading) {
    return NextResponse.json({ error: "Heading is required." }, { status: 400 });
  }

  const created = await prisma.slide.create({
    data: {
      heading,
      description: description || null,
      imageUrl: imageUrl || null,
      videoUrl: videoUrl || null,
      isPublished: isPublished ?? true,
      order: typeof order === "number" ? order : 0,
    },
  });

  await regenerateHeroSlider();
  return NextResponse.json({ success: true, slide: created });
}

export async function PUT(req: NextRequest) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await ensureExtraSchema();
  const body = await req.json();
  const { id, heading, description, imageUrl, videoUrl, isPublished, order } = body;

  if (!id) return NextResponse.json({ error: "Slide ID is required." }, { status: 400 });

  const existing = await prisma.slide.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Slide not found." }, { status: 404 });

  const updated = await prisma.slide.update({
    where: { id },
    data: {
      heading: heading !== undefined ? heading : existing.heading,
      description: description !== undefined ? description : existing.description,
      imageUrl: imageUrl !== undefined ? imageUrl : existing.imageUrl,
      videoUrl: videoUrl !== undefined ? videoUrl : existing.videoUrl,
      isPublished: isPublished !== undefined ? isPublished : existing.isPublished,
      order: order !== undefined ? order : existing.order,
    },
  });

  await regenerateHeroSlider();
  return NextResponse.json({ success: true, slide: updated });
}

export async function DELETE(req: NextRequest) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await ensureExtraSchema();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Slide ID is required." }, { status: 400 });

  await prisma.slide.delete({ where: { id } });
  await regenerateHeroSlider();
  return NextResponse.json({ success: true });
}

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { ensureExtraSchema } from "@/lib/schemaBootstrap";
import { ensureMenuSeed } from "@/lib/menu";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session) return null;
  const user = session.user as any;
  if (user?.role !== "admin") return null;
  return session;
}

function revalidateAll() {
  // Header/Footer render on every page via the root layout.
  revalidatePath("/", "layout");
}

export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await ensureExtraSchema();
  await ensureMenuSeed();

  const { searchParams } = new URL(req.url);
  const location = searchParams.get("location");

  const items = await prisma.menuItem.findMany({
    where: location ? { location } : undefined,
    orderBy: [{ location: "asc" }, { order: "asc" }],
  });

  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await ensureExtraSchema();
  await ensureMenuSeed();

  const body = await req.json();
  const { location, label, url, parentId, target, order, isPublished } = body;

  if (!location || !["header", "footer"].includes(location)) {
    return NextResponse.json({ error: "location must be 'header' or 'footer'." }, { status: 400 });
  }
  if (!label || !url) {
    return NextResponse.json({ error: "Label and URL are required." }, { status: 400 });
  }

  let finalOrder = order;
  if (typeof finalOrder !== "number") {
    const max = await prisma.menuItem.aggregate({
      where: { location, parentId: parentId || null },
      _max: { order: true },
    });
    finalOrder = (max._max.order ?? -1) + 1;
  }

  const created = await prisma.menuItem.create({
    data: {
      location,
      label,
      url,
      parentId: parentId || null,
      target: target || null,
      order: finalOrder,
      isPublished: isPublished ?? true,
    },
  });

  revalidateAll();
  return NextResponse.json({ success: true, item: created });
}

export async function PUT(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await ensureExtraSchema();
  await ensureMenuSeed();

  const body = await req.json();

  // Bulk reorder: [{ id, order, parentId? }, ...]
  if (Array.isArray(body.reorder)) {
    for (const entry of body.reorder) {
      if (!entry.id) continue;
      await prisma.menuItem.update({
        where: { id: entry.id },
        data: {
          order: typeof entry.order === "number" ? entry.order : undefined,
          parentId: entry.parentId !== undefined ? entry.parentId || null : undefined,
        },
      });
    }
    revalidateAll();
    return NextResponse.json({ success: true });
  }

  const { id, label, url, parentId, target, order, isPublished } = body;
  if (!id) return NextResponse.json({ error: "Menu item ID is required." }, { status: 400 });

  const existing = await prisma.menuItem.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Menu item not found." }, { status: 404 });

  const updated = await prisma.menuItem.update({
    where: { id },
    data: {
      label: label !== undefined ? label : existing.label,
      url: url !== undefined ? url : existing.url,
      parentId: parentId !== undefined ? parentId || null : existing.parentId,
      target: target !== undefined ? target || null : existing.target,
      order: order !== undefined ? order : existing.order,
      isPublished: isPublished !== undefined ? isPublished : existing.isPublished,
    },
  });

  revalidateAll();
  return NextResponse.json({ success: true, item: updated });
}

export async function DELETE(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await ensureExtraSchema();

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Menu item ID is required." }, { status: 400 });

  // Deleting a parent (e.g. a top-level nav item or footer column) also
  // deletes its children — otherwise they'd become orphaned dropdown items.
  await prisma.menuItem.deleteMany({ where: { parentId: id } });
  await prisma.menuItem.delete({ where: { id } });

  revalidateAll();
  return NextResponse.json({ success: true });
}

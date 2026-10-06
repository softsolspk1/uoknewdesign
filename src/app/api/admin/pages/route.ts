import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { ensureExtraSchema } from "@/lib/schemaBootstrap";

function revalidateSlug(slug: string) {
  revalidatePath(slug === "home" ? "/" : `/${slug}`);
}

// A subadmin assigned to department "sfao" also manages its sub-pages
// (e.g. "sfao-scholarships", "sfao-donors") — pages that share the
// department slug as a prefix but aren't an exact match.
function isDeptAllowed(pageSlug: string, assignedDepts: string[]) {
  return assignedDepts.some((dept) => pageSlug === dept || pageSlug.startsWith(`${dept}-`));
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const role = user?.role || "student";
    const assignedDepts = (user?.assignedDepartments || "")
      .split(",")
      .map((s: string) => s.trim())
      .filter(Boolean);

    await ensureExtraSchema();

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const slug = searchParams.get("slug");

    // Single page fetch
    if (slug) {
      const page = await prisma.page.findUnique({ where: { slug } });
      if (!page) return NextResponse.json({ error: "Page not found" }, { status: 404 });

      // If subadmin, check department permission
      if (role === "subadmin" && assignedDepts.length > 0 && !assignedDepts.includes("all")) {
        if (!isDeptAllowed(page.slug, assignedDepts)) {
          return NextResponse.json({ error: "Forbidden: You do not manage this department" }, { status: 403 });
        }
      }
      return NextResponse.json({ page });
    }

    const where: any = {};
    const and: any[] = [];

    // Category filter
    if (category && category !== "all") {
      where.category = category;
    }

    // Search filter
    if (search) {
      and.push({
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { slug: { contains: search, mode: "insensitive" } },
        ],
      });
    }

    // Subadmin restriction — a department also covers its sub-pages
    // (e.g. "sfao" covers "sfao-scholarships", "sfao-donors", ...).
    if (role === "subadmin" && !assignedDepts.includes("all")) {
      and.push({
        OR: assignedDepts.flatMap((dept: string) => [
          { slug: dept },
          { slug: { startsWith: `${dept}-` } },
        ]),
      });
    }

    if (and.length > 0) {
      where.AND = and;
    }

    const pages = await prisma.page.findMany({
      where,
      orderBy: { title: "asc" },
      select: {
        id: true,
        slug: true,
        title: true,
        category: true,
        isPublished: true,
        updatedAt: true,
        updatedBy: true,
      },
    });

    return NextResponse.json({ pages, userRole: role, assignedDepartments: assignedDepts });
  } catch (error: any) {
    console.error("Error fetching pages:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Only full Admins can create new pages." }, { status: 403 });
    }

    await ensureExtraSchema();

    const body = await req.json();
    let { slug, title, category, content, metaTitle, metaDescription, pdfUrl, pdfLabel, isPublished } = body;

    if (!slug || !title) {
      return NextResponse.json({ error: "Slug and title are required." }, { status: 400 });
    }

    slug = slug.toLowerCase().replace(/[^a-z0-9-_]/g, "-").replace(/-+/g, "-");

    const existing = await prisma.page.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: `A page with slug '${slug}' already exists.` }, { status: 400 });
    }

    const newPage = await prisma.page.create({
      data: {
        slug,
        title,
        category: category || "main",
        content: content || `<div class="container py-5"><h2>${title}</h2><p>Page content coming soon.</p></div>`,
        metaTitle: metaTitle || `${title} — University of Karachi`,
        metaDescription: metaDescription || `Official page for ${title} at University of Karachi`,
        pdfUrl: pdfUrl || null,
        pdfLabel: pdfLabel || null,
        isPublished: isPublished ?? true,
        updatedBy: user.email,
      },
    });

    revalidateSlug(newPage.slug);
    return NextResponse.json({ success: true, page: newPage });
  } catch (error: any) {
    console.error("Error creating page:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const role = user?.role;
    const assignedDepts = (user?.assignedDepartments || "")
      .split(",")
      .map((s: string) => s.trim())
      .filter(Boolean);

    await ensureExtraSchema();

    const body = await req.json();
    const { id, slug, title, category, content, metaTitle, metaDescription, pdfUrl, pdfLabel, isPublished } = body;

    if (!id && !slug) {
      return NextResponse.json({ error: "Page ID or slug is required." }, { status: 400 });
    }

    // Retrieve target page
    const existing = id
      ? await prisma.page.findUnique({ where: { id } })
      : await prisma.page.findUnique({ where: { slug } });

    if (!existing) {
      return NextResponse.json({ error: "Page not found." }, { status: 404 });
    }

    // Check permissions
    if (role === "subadmin" && !assignedDepts.includes("all")) {
      if (!isDeptAllowed(existing.slug, assignedDepts)) {
        return NextResponse.json({ error: "Forbidden: You are not authorized to edit this department page." }, { status: 403 });
      }
    }

    const updated = await prisma.page.update({
      where: { id: existing.id },
      data: {
        title: title !== undefined ? title : existing.title,
        category: category !== undefined && role === "admin" ? category : existing.category,
        content: content !== undefined ? content : existing.content,
        metaTitle: metaTitle !== undefined ? metaTitle : existing.metaTitle,
        metaDescription: metaDescription !== undefined ? metaDescription : existing.metaDescription,
        pdfUrl: pdfUrl !== undefined ? pdfUrl : existing.pdfUrl,
        pdfLabel: pdfLabel !== undefined ? pdfLabel : existing.pdfLabel,
        isPublished: isPublished !== undefined ? isPublished : existing.isPublished,
        updatedBy: user.email,
      },
    });

    revalidateSlug(existing.slug);
    if (updated.slug !== existing.slug) revalidateSlug(updated.slug);
    return NextResponse.json({ success: true, page: updated });
  } catch (error: any) {
    console.error("Error updating page:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Only master admins can delete pages." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Page ID is required." }, { status: 400 });
    }

    const deleted = await prisma.page.delete({ where: { id } });
    revalidateSlug(deleted.slug);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting page:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

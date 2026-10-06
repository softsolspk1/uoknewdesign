import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { hashPassword } from "@/lib/password";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = session.user as any;
    if (currentUser.role !== "admin") {
      return NextResponse.json({ error: "Access denied. Admin role required." }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        assignedDepartments: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Also get list of all departments for assignment dropdown
    const departments = await prisma.page.findMany({
      where: { category: "department" },
      select: { slug: true, title: true },
      orderBy: { title: "asc" },
    });

    return NextResponse.json({ users, departments });
  } catch (error: any) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = session.user as any;
    if (currentUser.role !== "admin") {
      return NextResponse.json({ error: "Access denied. Admin role required." }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, password, role, assignedDepartments } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing) {
      return NextResponse.json({ error: "A user with this email already exists." }, { status: 400 });
    }

    let deptsString = "";
    if (Array.isArray(assignedDepartments)) {
      deptsString = assignedDepartments.join(",");
    } else if (typeof assignedDepartments === "string") {
      deptsString = assignedDepartments;
    }

    const newUser = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: await hashPassword(password),
        name: name || "Sub-Admin",
        role: role || "subadmin",
        assignedDepartments: deptsString,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        assignedDepartments: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, user: newUser });
  } catch (error: any) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = session.user as any;
    if (currentUser.role !== "admin") {
      return NextResponse.json({ error: "Access denied. Admin role required." }, { status: 403 });
    }

    const body = await req.json();
    const { id, name, role, assignedDepartments, password } = body;

    if (!id) {
      return NextResponse.json({ error: "User ID is required." }, { status: 400 });
    }

    let deptsString = "";
    if (Array.isArray(assignedDepartments)) {
      deptsString = assignedDepartments.join(",");
    } else if (typeof assignedDepartments === "string") {
      deptsString = assignedDepartments;
    }

    const updateData: any = {
      name,
      role,
      assignedDepartments: deptsString,
    };

    if (password && password.trim().length > 0) {
      updateData.password = await hashPassword(password.trim());
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        assignedDepartments: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error: any) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = session.user as any;
    if (currentUser.role !== "admin") {
      return NextResponse.json({ error: "Access denied. Admin role required." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "User ID is required." }, { status: 400 });
    }

    const userToDelete = await prisma.user.findUnique({ where: { id } });
    if (userToDelete && userToDelete.email === "uok@softsols.pk") {
      return NextResponse.json({ error: "The master super admin cannot be deleted." }, { status: 400 });
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

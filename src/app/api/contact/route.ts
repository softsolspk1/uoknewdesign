import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { sendContactFormEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const allowed = await checkRateLimit(`contact:${getClientIp(req)}`, 5, 10 * 60 * 1000);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many messages sent. Please try again in a few minutes." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const name = body.firstname || body.name || "Anonymous";
    const email = body.email;
    const phone = body.phone || body.number || "";
    const subject = body.subject || "General Inquiry";
    const message = body.message;

    if (!email || !message) {
      return NextResponse.json(
        { error: "Email and message are required." },
        { status: 400 }
      );
    }

    const submission = await prisma.contactSubmission.create({
      data: {
        name,
        email,
        phone,
        subject,
        message,
        status: "unread",
      },
    });

    // Send email notification to registrar@uok.edu.pk (safe and non-blocking to DB record)
    try {
      await sendContactFormEmail({
        name,
        email,
        phone,
        subject,
        message,
        submittedAt: submission.createdAt,
      });
    } catch (emailError) {
      console.error("[Contact Email] Failed to send email notification:", emailError);
    }

    return NextResponse.json({
      success: true,
      message: "Thank you! Your message has been sent successfully.",
      data: submission,
    });
  } catch (error: any) {
    console.error("Error submitting contact form:", error);
    return NextResponse.json(
      { error: "Failed to submit message. Please try again later." },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const where: any = {};
    if (status && status !== "all") {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { subject: { contains: search, mode: "insensitive" } },
        { message: { contains: search, mode: "insensitive" } },
      ];
    }

    const submissions = await prisma.contactSubmission.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    const unreadCount = await prisma.contactSubmission.count({
      where: { status: "unread" },
    });

    return NextResponse.json({ submissions, unreadCount });
  } catch (error: any) {
    console.error("Error fetching contact submissions:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "ID and status are required." }, { status: 400 });
    }

    const updated = await prisma.contactSubmission.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("Error updating submission status:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required." }, { status: 400 });
    }

    await prisma.contactSubmission.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting contact submission:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

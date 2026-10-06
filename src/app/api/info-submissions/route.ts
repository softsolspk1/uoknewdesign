import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { ensureExtraSchema } from "@/lib/schemaBootstrap";
import { verifyVerificationToken } from "@/lib/emailOtp";
import { isValidUokEmail, normalizeEmail } from "@/lib/emailValidation";

const VALID_TYPES = ["department", "faculty", "institute"];

// Public submission endpoint for the Department/Faculty/Institute
// information-collection form. Submissions require a verified @uok.edu.pk email.
// Admins review, edit status and export the results from /admin/info-submissions.
export async function POST(req: NextRequest) {
  try {
    await ensureExtraSchema();

    const allowed = await checkRateLimit(`info-submission:${getClientIp(req)}`, 10, 10 * 60 * 1000);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many submissions sent. Please try again in a few minutes." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const {
      type,
      name,
      departmentName,
      headName,
      designation,
      qualification,
      email,
      phone,
      description,
      programsOffered,
      facilities,
      focusAreas,
      bio,
      publications,
      submittedByName,
      submittedByEmail,
      verificationToken,
      images,
    } = body;

    const cleanSubmittedByEmail = normalizeEmail(String(submittedByEmail || ""));
    if (!cleanSubmittedByEmail) {
      return NextResponse.json(
        { error: "Submitter email is required." },
        { status: 400 }
      );
    }

    if (!isValidUokEmail(cleanSubmittedByEmail)) {
      return NextResponse.json(
        { error: "Submissions are only permitted from official @uok.edu.pk email addresses." },
        { status: 400 }
      );
    }

    if (!verificationToken || !verifyVerificationToken(verificationToken, cleanSubmittedByEmail)) {
      return NextResponse.json(
        { error: "Please verify your @uok.edu.pk email address with the 4-digit code before submitting." },
        { status: 400 }
      );
    }

    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json({ error: "A valid category (Department, Faculty or Institute) is required." }, { status: 400 });
    }
    if (!name || !String(name).trim()) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }

    const imageUrls: string[] = Array.isArray(images)
      ? images.filter((u: any) => typeof u === "string" && u.trim()).slice(0, 20)
      : [];

    const submission = await prisma.infoSubmission.create({
      data: {
        type,
        name: String(name).trim(),
        departmentName: departmentName || null,
        headName: headName || null,
        designation: designation || null,
        qualification: qualification || null,
        email: email || null,
        phone: phone || null,
        description: description || null,
        programsOffered: programsOffered || null,
        facilities: facilities || null,
        focusAreas: focusAreas || null,
        bio: bio || null,
        publications: publications || null,
        submittedByName: submittedByName || null,
        submittedByEmail: cleanSubmittedByEmail,
        status: "new",
        images: {
          create: imageUrls.map((url, index) => ({ url, order: index })),
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Thank you! Your information has been submitted successfully.",
      data: submission,
    });
  } catch (error: any) {
    console.error("Error submitting info form:", error);
    return NextResponse.json({ error: "Failed to submit. Please try again later." }, { status: 500 });
  }
}

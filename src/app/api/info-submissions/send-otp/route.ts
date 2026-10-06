import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { ensureExtraSchema } from "@/lib/schemaBootstrap";
import { generate4DigitCode, sendOtpEmail } from "@/lib/emailOtp";
import { isValidUokEmail, normalizeEmail } from "@/lib/emailValidation";

export async function POST(req: NextRequest) {
  try {
    await ensureExtraSchema();

    const ip = getClientIp(req);
    const ipAllowed = await checkRateLimit(`otp-ip:${ip}`, 10, 10 * 60 * 1000);
    if (!ipAllowed) {
      return NextResponse.json(
        { error: "Too many verification requests. Please wait a few minutes before trying again." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const rawEmail = body.email;

    if (!rawEmail || typeof rawEmail !== "string") {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const cleanEmail = normalizeEmail(rawEmail);

    if (!isValidUokEmail(cleanEmail)) {
      return NextResponse.json(
        { error: "Invalid email. Submissions are only permitted from official @uok.edu.pk email addresses." },
        { status: 400 }
      );
    }

    const emailAllowed = await checkRateLimit(`otp-email:${cleanEmail}`, 4, 10 * 60 * 1000);
    if (!emailAllowed) {
      return NextResponse.json(
        { error: "Too many codes requested for this email. Please check your inbox or wait 10 minutes." },
        { status: 429 }
      );
    }

    const code = generate4DigitCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Clean up older unverified codes for this email
    await prisma.emailOtp.deleteMany({
      where: { email: cleanEmail, verified: false },
    });

    // Record new OTP
    await prisma.emailOtp.create({
      data: {
        email: cleanEmail,
        code,
        expiresAt,
        verified: false,
      },
    });

    // Dispatch email
    const emailResult = await sendOtpEmail(cleanEmail, code);
    if (!emailResult.success) {
      return NextResponse.json(
        { error: "Could not send verification email. Please verify your address and try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `A 4-digit verification code has been sent to ${cleanEmail}. Please check your inbox.`,
    });
  } catch (error: any) {
    console.error("Error sending OTP:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while sending the code. Please try again." },
      { status: 500 }
    );
  }
}

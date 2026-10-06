import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { ensureExtraSchema } from "@/lib/schemaBootstrap";
import { createVerificationToken } from "@/lib/emailOtp";
import { isValidUokEmail, normalizeEmail } from "@/lib/emailValidation";

export async function POST(req: NextRequest) {
  try {
    await ensureExtraSchema();

    const ip = getClientIp(req);
    const ipAllowed = await checkRateLimit(`verify-ip:${ip}`, 20, 10 * 60 * 1000);
    if (!ipAllowed) {
      return NextResponse.json(
        { error: "Too many verification attempts. Please wait a few minutes." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const rawEmail = body.email;
    const rawCode = body.code;

    if (!rawEmail || !rawCode) {
      return NextResponse.json(
        { error: "Email and 4-digit code are required." },
        { status: 400 }
      );
    }

    const cleanEmail = normalizeEmail(String(rawEmail));
    const cleanCode = String(rawCode).trim();

    if (!isValidUokEmail(cleanEmail)) {
      return NextResponse.json(
        { error: "Invalid email. Must be an official @uok.edu.pk address." },
        { status: 400 }
      );
    }

    const otpRecord = await prisma.emailOtp.findFirst({
      where: {
        email: cleanEmail,
        code: cleanCode,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otpRecord) {
      return NextResponse.json(
        { error: "Invalid or expired verification code. Please check your code or request a new one." },
        { status: 400 }
      );
    }

    const verificationToken = createVerificationToken(cleanEmail);

    await prisma.emailOtp.update({
      where: { id: otpRecord.id },
      data: {
        verified: true,
        token: verificationToken,
      },
    });

    return NextResponse.json({
      success: true,
      verificationToken,
      message: "Email address verified successfully!",
    });
  } catch (error: any) {
    console.error("Error verifying OTP:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while verifying the code." },
      { status: 500 }
    );
  }
}

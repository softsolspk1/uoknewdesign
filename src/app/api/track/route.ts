import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const path = body.path || "/";
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const userAgent = req.headers.get("user-agent") || "";
    const referrer = req.headers.get("referer") || "";

    await prisma.pageView.create({
      data: {
        path,
        ip,
        userAgent,
        referrer,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    // Non-blocking telemetry
    return NextResponse.json({ success: false }, { status: 200 });
  }
}

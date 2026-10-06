import { NextRequest, NextResponse } from "next/server";
import { generateCaptcha } from "@/lib/captcha";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

// Issues a signed arithmetic challenge for public forms (e.g.
// /info-submission) to deter automated bot submissions.
export async function GET(req: NextRequest) {
  const allowed = await checkRateLimit(`captcha:${getClientIp(req)}`, 60, 10 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests. Please try again shortly." }, { status: 429 });
  }

  const { question, token } = generateCaptcha();
  return NextResponse.json({ question, token });
}

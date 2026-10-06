import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rateLimit";

// Videos are uploaded directly from the browser to Vercel Blob (bypassing our
// serverless function entirely) so they aren't capped by the ~4.5MB request
// body limit that applies to routes like /api/admin/upload. This route only
// ever sees a small JSON handshake — it authorizes the upload and hands back
// a short-lived client token; the file bytes never pass through it.
const MAX_VIDEO_SIZE = 200 * 1024 * 1024; // 200MB

export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        const session = await getServerSession(authOptions);
        if (!session) {
          throw new Error("Unauthorized");
        }

        const user = session.user as any;
        const allowed = await checkRateLimit(`upload:${user.email}`, 60, 60 * 60 * 1000);
        if (!allowed) {
          throw new Error("Upload limit reached. Please try again later.");
        }

        return {
          allowedContentTypes: ["video/mp4", "video/webm", "video/ogg", "video/quicktime"],
          addRandomSuffix: true,
          maximumSizeInBytes: MAX_VIDEO_SIZE,
        };
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Upload failed." }, { status: 400 });
  }
}

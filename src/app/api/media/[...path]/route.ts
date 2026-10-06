import { NextRequest, NextResponse } from "next/server";
import { SNAPSHOT_PREFIX } from "@/lib/backup";

interface RouteParams {
  params: Promise<{ path: string[] }>;
}

// Publicly serves images uploaded through the admin Visual Editor. The
// underlying Vercel Blob store is private-only, so this route fetches the
// blob server-side (with our own credentials) and streams it back to
// visitors — no site-visitor auth required, these are public page photos.
export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { path: pathParts } = await params;
  const pathname = pathParts.join("/");

  // Backup snapshots share this private store but hold password hashes and
  // contact details — only the admin snapshots API may hand them out.
  if (pathname.startsWith(SNAPSHOT_PREFIX) || pathname.includes("..")) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const { get } = await import("@vercel/blob");
    const result = await get(pathname, { access: "private" });

    if (!result || result.statusCode !== 200) {
      return new NextResponse("Not found", { status: 404 });
    }

    return new NextResponse(result.stream, {
      headers: {
        "Content-Type": result.blob.contentType || "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Media proxy error:", error);
    return new NextResponse("Not found", { status: 404 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { blobConfigured, listSnapshots, readSnapshot } from "@/lib/backup";

// GET            → list the automatic pre-restore snapshots
// GET ?file=name → download one of them
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if ((session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Access denied. Admin role required." }, { status: 403 });
  }

  const file = req.nextUrl.searchParams.get("file");
  try {
    if (!file) {
      return NextResponse.json({ enabled: blobConfigured(), snapshots: await listSnapshots() });
    }
    const data = await readSnapshot(file);
    if (!data) {
      return NextResponse.json({ error: "Snapshot not found." }, { status: 404 });
    }
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": "application/gzip",
        "Content-Disposition": `attachment; filename="uok-backup-${file}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Snapshot error:", error);
    return NextResponse.json({ error: "Could not read safety snapshots." }, { status: 500 });
  }
}

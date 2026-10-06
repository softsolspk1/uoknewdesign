import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { ensureExtraSchema } from "@/lib/schemaBootstrap";
import { backupFileName, createBackup, encodeBackup } from "@/lib/backup";

export const maxDuration = 60;

// Downloads a full content backup as a gzipped JSON file. Admin only: the
// file includes user password hashes and visitor contact details.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const currentUser = session.user as any;
  if (currentUser.role !== "admin") {
    return NextResponse.json({ error: "Access denied. Admin role required." }, { status: 403 });
  }

  try {
    await ensureExtraSchema();
    const backup = await createBackup(currentUser.email || null);
    const body = encodeBackup(backup);
    return new NextResponse(new Uint8Array(body), {
      headers: {
        "Content-Type": "application/gzip",
        "Content-Disposition": `attachment; filename="${backupFileName()}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    console.error("Backup failed:", error);
    return NextResponse.json({ error: "Could not create the backup. Please try again." }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { ensureExtraSchema } from "@/lib/schemaBootstrap";
import {
  BACKUP_TABLES,
  blobConfigured,
  createBackup,
  decodeBackup,
  encodeBackup,
  restoreBackup,
  saveSnapshot,
} from "@/lib/backup";

export const maxDuration = 60;

// Restores the selected sections from an uploaded backup file.
//
// Body: the backup file's bytes (gzipped or plain JSON). The admin page
// gzips plain files before sending so they fit Vercel's 4.5MB request limit.
// Query: ?tables=Page,News,... — which sections to replace.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const currentUser = session.user as any;
  if (currentUser.role !== "admin") {
    return NextResponse.json({ error: "Access denied. Admin role required." }, { status: 403 });
  }

  const known = new Set<string>(BACKUP_TABLES.map((t) => t.model));
  const selected = (req.nextUrl.searchParams.get("tables") || "")
    .split(",")
    .filter((t) => known.has(t)) as Prisma.ModelName[];
  if (selected.length === 0) {
    return NextResponse.json({ error: "Choose at least one section to restore." }, { status: 400 });
  }

  let backup;
  try {
    backup = decodeBackup(Buffer.from(await req.arrayBuffer()));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  try {
    await ensureExtraSchema();

    // Safety net first: if this snapshot can't be saved, don't restore.
    let snapshot: string | null = null;
    if (blobConfigured()) {
      const current = encodeBackup(await createBackup(currentUser.email || null));
      snapshot = await saveSnapshot(current, `pre-restore-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.json.gz`);
    }

    const { restored } = await restoreBackup(backup, selected, currentUser.email);

    // Every public page reads from these tables (menus, pages, news...).
    revalidatePath("/", "layout");

    return NextResponse.json({
      success: true,
      restored,
      snapshot: snapshot ? snapshot.split("/").pop() : null,
      backupCreatedAt: backup.createdAt,
    });
  } catch (error: any) {
    console.error("Restore failed:", error);
    const detail = error instanceof Prisma.PrismaClientKnownRequestError ? ` (${error.code})` : "";
    return NextResponse.json(
      { error: `Restore failed and nothing was changed${detail}. ${error.message?.split("\n").pop() || ""}`.trim() },
      { status: 500 }
    );
  }
}

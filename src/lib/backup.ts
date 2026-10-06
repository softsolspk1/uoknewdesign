import { gzipSync, gunzipSync } from "zlib";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { BACKUP_TABLES } from "@/lib/backupTables";

export { BACKUP_TABLES };

// Site content backup/restore, used by /admin/backup.
//
// A backup is a gzipped JSON file holding every row of the tables listed in
// backupTables.ts.
// Analytics page views (hundreds of thousands of rows) and short-lived
// rate-limit / email-OTP rows are deliberately left out: they aren't site
// content, and including page views alone would push the file far past what
// a Vercel function can send or receive in one request (4.5MB).
//
// Uploaded images/PDFs live in Vercel Blob, not the database. A backup
// stores the /api/media/... links to them; the files themselves are not
// touched by backup or restore.

export const BACKUP_FORMAT = "uok-website-backup";
export const BACKUP_VERSION = 1;

type Delegate = {
  findMany: (args?: any) => Promise<any[]>;
  deleteMany: (args?: any) => Promise<unknown>;
  createMany: (args: any) => Promise<unknown>;
};


// Key names used by the older command-line backups in db-backups/.
const LEGACY_KEYS: Record<string, Prisma.ModelName> = {
  pages: "Page",
  slides: "Slide",
  news: "News",
  faqs: "Faq",
  users: "User",
  menuItems: "MenuItem",
};

export interface BackupFile {
  format: typeof BACKUP_FORMAT;
  version: number;
  createdAt: string;
  createdBy: string | null;
  counts: Record<string, number>;
  tables: Partial<Record<Prisma.ModelName, Record<string, unknown>[]>>;
}

function delegateFor(client: Prisma.TransactionClient | typeof prisma, model: Prisma.ModelName): Delegate {
  const key = model.charAt(0).toLowerCase() + model.slice(1);
  return (client as any)[key] as Delegate;
}

// Only the model's own columns are written back, so a backup taken before a
// column was added (or with extra keys) still restores cleanly.
function scalarFields(model: Prisma.ModelName): Set<string> {
  const def = Prisma.dmmf.datamodel.models.find((m) => m.name === model);
  return new Set((def?.fields || []).filter((f) => f.kind === "scalar" || f.kind === "enum").map((f) => f.name));
}

export async function createBackup(createdBy: string | null): Promise<BackupFile> {
  const tables: BackupFile["tables"] = {};
  const counts: Record<string, number> = {};
  for (const { model } of BACKUP_TABLES) {
    const rows = await delegateFor(prisma, model).findMany();
    tables[model] = rows;
    counts[model] = rows.length;
  }
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    createdAt: new Date().toISOString(),
    createdBy,
    counts,
    tables,
  };
}

export function encodeBackup(backup: BackupFile): Buffer {
  return gzipSync(Buffer.from(JSON.stringify(backup), "utf8"));
}

export function backupFileName(date = new Date()): string {
  const stamp = date.toISOString().slice(0, 16).replace("T", "_").replace(":", "-");
  return `uok-backup-${stamp}.json.gz`;
}

// Accepts a gzipped or plain JSON backup — either this module's format or
// the older db-backups/*.json layout.
export function decodeBackup(bytes: Buffer): BackupFile {
  const isGzip = bytes.length > 2 && bytes[0] === 0x1f && bytes[1] === 0x8b;
  let parsed: any;
  try {
    parsed = JSON.parse((isGzip ? gunzipSync(bytes) : bytes).toString("utf8"));
  } catch {
    throw new Error("This file is not a valid backup (could not read it as JSON).");
  }
  if (!parsed || typeof parsed !== "object") {
    throw new Error("This file is not a valid backup.");
  }

  let backup: BackupFile;
  if (parsed.format === BACKUP_FORMAT) {
    if (typeof parsed.version !== "number" || parsed.version > BACKUP_VERSION) {
      throw new Error("This backup was made by a newer version of the site and can't be restored here.");
    }
    backup = parsed as BackupFile;
  } else if (parsed.takenAt && Array.isArray(parsed.pages)) {
    const tables: BackupFile["tables"] = {};
    for (const [key, model] of Object.entries(LEGACY_KEYS)) {
      if (Array.isArray(parsed[key])) tables[model] = parsed[key];
    }
    backup = {
      format: BACKUP_FORMAT,
      version: BACKUP_VERSION,
      createdAt: parsed.takenAt,
      createdBy: null,
      counts: {},
      tables,
    };
  } else {
    throw new Error("This file is not a UoK website backup.");
  }

  const known = new Set<string>(BACKUP_TABLES.map((t) => t.model));
  for (const [model, rows] of Object.entries(backup.tables || {})) {
    if (!known.has(model)) {
      delete backup.tables[model as Prisma.ModelName];
      continue;
    }
    if (!Array.isArray(rows) || rows.some((r) => !r || typeof r !== "object" || typeof (r as any).id !== "string")) {
      throw new Error(`The "${model}" section of this backup is damaged.`);
    }
  }
  backup.counts = Object.fromEntries(Object.entries(backup.tables).map(([m, rows]) => [m, rows!.length]));
  return backup;
}

export interface RestoreResult {
  restored: Record<string, number>;
}

// Replaces the selected tables with the backup's rows in one transaction:
// either every selected table is restored, or nothing changes.
export async function restoreBackup(
  backup: BackupFile,
  selected: Prisma.ModelName[],
  currentUserEmail: string
): Promise<RestoreResult> {
  const order = BACKUP_TABLES.map((t) => t.model).filter((m) => selected.includes(m) && backup.tables[m]);
  if (order.length === 0) throw new Error("None of the selected sections are in this backup.");

  if (order.includes("User")) {
    const users = backup.tables.User || [];
    if (!users.some((u) => u.role === "admin")) {
      throw new Error("The backup's user list has no admin account, so Users can't be restored from it.");
    }
  }

  const restored: Record<string, number> = {};
  await prisma.$transaction(
    async (tx) => {
      // Keep the signed-in admin able to log in afterwards even if their
      // account didn't exist when the backup was taken.
      const me = order.includes("User") ? await tx.user.findUnique({ where: { email: currentUserEmail } }) : null;

      for (const model of [...order].reverse()) {
        await delegateFor(tx, model).deleteMany({});
      }
      // Deleting a parent cascades to InfoSubmissionImage even when it isn't
      // selected; put those rows back from the backup so they aren't lost.
      const restoreOrder =
        order.includes("InfoSubmission") && !order.includes("InfoSubmissionImage") && backup.tables.InfoSubmissionImage
          ? [...order, "InfoSubmissionImage" as Prisma.ModelName]
          : order;

      for (const model of restoreOrder) {
        const fields = scalarFields(model);
        let rows = (backup.tables[model] || []).map((row) =>
          Object.fromEntries(Object.entries(row).filter(([k]) => fields.has(k)))
        );
        if (model === "User" && me && !rows.some((r) => r.email === me.email)) {
          rows = [...rows, me as unknown as Record<string, unknown>];
        }
        if (model === "InfoSubmissionImage") {
          const parents = new Set((await tx.infoSubmission.findMany({ select: { id: true } })).map((s) => s.id));
          rows = rows.filter((r) => parents.has(r.submissionId as string));
        }
        for (let i = 0; i < rows.length; i += 200) {
          await delegateFor(tx, model).createMany({ data: rows.slice(i, i + 200) });
        }
        restored[model] = rows.length;
      }
    },
    { maxWait: 10_000, timeout: 50_000 }
  );
  return { restored };
}

// Safety snapshots: before every restore, the current state is saved to the
// private Blob store under backups/ so a mistaken restore can be undone from
// the Backup page. /api/media refuses to serve this prefix — snapshots hold
// password hashes and contact details and are only downloadable by admins.
export const SNAPSHOT_PREFIX = "backups/";

export function blobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
}

export async function saveSnapshot(data: Buffer, name: string): Promise<string | null> {
  if (!blobConfigured()) return null;
  const { put } = await import("@vercel/blob");
  const pathname = `${SNAPSHOT_PREFIX}${name}`;
  await put(pathname, data, { access: "private", contentType: "application/gzip" });
  return pathname;
}

export interface SnapshotInfo {
  name: string;
  size: number;
  uploadedAt: string;
}

export async function listSnapshots(): Promise<SnapshotInfo[]> {
  if (!blobConfigured()) return [];
  const { list } = await import("@vercel/blob");
  const { blobs } = await list({ prefix: SNAPSHOT_PREFIX, limit: 100 });
  return blobs
    .map((b) => ({ name: b.pathname.slice(SNAPSHOT_PREFIX.length), size: b.size, uploadedAt: new Date(b.uploadedAt).toISOString() }))
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}

export async function readSnapshot(name: string): Promise<Buffer | null> {
  if (!blobConfigured() || !/^[\w.-]+\.json\.gz$/.test(name)) return null;
  const { get } = await import("@vercel/blob");
  const result = await get(`${SNAPSHOT_PREFIX}${name}`, { access: "private" });
  if (!result || result.statusCode !== 200) return null;
  return Buffer.from(await new Response(result.stream).arrayBuffer());
}

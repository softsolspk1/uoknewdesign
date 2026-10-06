import prisma from '@/lib/prisma';

// This project applies schema changes via `prisma db push` against a
// Vercel-managed Postgres whose connection string is a "sensitive" env var
// (write-only — nobody, including the project owner, can read it back once
// set). That makes `prisma db push`/`migrate` unusable from outside the
// running app. These statements are additive and idempotent, so running them
// lazily at runtime (once per server instance) keeps the DB in sync with
// schema.prisma without ever needing the raw connection string.
let ensured = false;

// A transient DB hiccup here (Neon cold-start, brief network blip) must never
// crash page rendering — every caller expects this to be a fire-and-forget
// best-effort sync, same as the .catch(() => null) pattern used around the
// actual data queries elsewhere. If it fails, `ensured` stays false so the
// next request tries again instead of permanently skipping the migration.
export async function ensureExtraSchema() {
  if (ensured) return;
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "News" ADD COLUMN IF NOT EXISTS "pdfUrl" TEXT`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Page" ADD COLUMN IF NOT EXISTS "pdfUrl" TEXT`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Page" ADD COLUMN IF NOT EXISTS "pdfLabel" TEXT`);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Slide" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "heading" TEXT NOT NULL,
        "description" TEXT,
        "imageUrl" TEXT,
        "videoUrl" TEXT,
        "isPublished" BOOLEAN NOT NULL DEFAULT true,
        "order" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Slide" ADD COLUMN IF NOT EXISTS "videoUrl" TEXT`);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "MenuItem" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "location" TEXT NOT NULL,
        "label" TEXT NOT NULL,
        "url" TEXT NOT NULL DEFAULT '#',
        "parentId" TEXT,
        "order" INTEGER NOT NULL DEFAULT 0,
        "target" TEXT,
        "isPublished" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "MenuItem_location_parentId_idx" ON "MenuItem" ("location", "parentId")`);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "InfoSubmission" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "type" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'new',
        "departmentName" TEXT,
        "headName" TEXT,
        "designation" TEXT,
        "qualification" TEXT,
        "email" TEXT,
        "phone" TEXT,
        "description" TEXT,
        "programsOffered" TEXT,
        "facilities" TEXT,
        "focusAreas" TEXT,
        "bio" TEXT,
        "publications" TEXT,
        "submittedByName" TEXT,
        "submittedByEmail" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "InfoSubmission_type_status_idx" ON "InfoSubmission" ("type", "status")`);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "InfoSubmissionImage" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "submissionId" TEXT NOT NULL,
        "url" TEXT NOT NULL,
        "order" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "InfoSubmissionImage_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "InfoSubmission"("id") ON DELETE CASCADE
      )
    `);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "InfoSubmissionImage_submissionId_idx" ON "InfoSubmissionImage" ("submissionId")`);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "EmailOtp" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "email" TEXT NOT NULL,
        "code" TEXT NOT NULL,
        "token" TEXT,
        "expiresAt" TIMESTAMP(3) NOT NULL,
        "verified" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "EmailOtp_email_idx" ON "EmailOtp" ("email")`);
    ensured = true;
  } catch (error) {
    console.error("ensureExtraSchema failed (will retry on next request):", error);
  }
}

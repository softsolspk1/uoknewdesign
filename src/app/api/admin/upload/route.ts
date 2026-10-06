import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rateLimit";
import { loadValidatedImage } from "@/lib/imageValidation";
import fs from "fs";
import path from "path";

const MAX_IMAGE_SIZE = 4 * 1024 * 1024; // 4MB
const MAX_PDF_SIZE = 15 * 1024 * 1024; // 15MB
const MAX_VIDEO_SIZE = 60 * 1024 * 1024; // 60MB
const MAX_DOC_SIZE = 15 * 1024 * 1024; // 15MB

const WORD_MIME_TYPES = [
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as any;
  const allowed = await checkRateLimit(`upload:${user.email}`, 60, 60 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Upload limit reached. Please try again later." },
      { status: 429 }
    );
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  const isImage = file.type.startsWith("image/");
  const isPdf = file.type === "application/pdf";
  const isVideo = file.type.startsWith("video/");
  // .doc files often arrive with a generic/empty MIME type depending on the
  // OS, so also allow by extension for Word docs specifically.
  const isWord = WORD_MIME_TYPES.includes(file.type) || /\.(docx?|DOCX?)$/.test(file.name);
  if (!isImage && !isPdf && !isVideo && !isWord) {
    return NextResponse.json({ error: "Only image, video, PDF or Word (.doc/.docx) files are allowed." }, { status: 400 });
  }
  if (isImage && file.size > MAX_IMAGE_SIZE) {
    return NextResponse.json({ error: "Image must be smaller than 4MB." }, { status: 400 });
  }
  if (isPdf && file.size > MAX_PDF_SIZE) {
    return NextResponse.json({ error: "PDF must be smaller than 15MB." }, { status: 400 });
  }
  if (isVideo && file.size > MAX_VIDEO_SIZE) {
    return NextResponse.json({ error: "Video must be smaller than 60MB." }, { status: 400 });
  }
  if (isWord && file.size > MAX_DOC_SIZE) {
    return NextResponse.json({ error: "Word document must be smaller than 15MB." }, { status: 400 });
  }

  const ext = path.extname(file.name) || "";
  let safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;

  try {
    let buffer = Buffer.from(await file.arrayBuffer());
    let contentType = file.type || undefined;

    if (isImage) {
      // Never trust the client-supplied MIME type/extension — decode the
      // actual bytes and re-encode through sharp. This rejects anything
      // that isn't a genuine JPG/PNG/WEBP (scripts, HTML, SVG with embedded
      // <script>, disguised executables, polyglot files, etc.) and strips
      // any EXIF/metadata or trailing payload from the stored copy.
      const validated = await loadValidatedImage(buffer);
      if ("error" in validated) {
        return NextResponse.json({ error: validated.error }, { status: 400 });
      }

      // When replacing an existing image, the admin UI sends the target
      // slot's current pixel dimensions so the new image is auto-cropped to
      // match it (same size + centered alignment) instead of distorting or
      // resizing the layout it's dropped into.
      const targetWidth = parseInt(String(formData.get("targetWidth") || ""), 10);
      const targetHeight = parseInt(String(formData.get("targetHeight") || ""), 10);
      const MAX_DIMENSION = 8000;
      let pipeline = validated.image;
      if (
        Number.isFinite(targetWidth) &&
        Number.isFinite(targetHeight) &&
        targetWidth > 0 &&
        targetHeight > 0 &&
        targetWidth <= MAX_DIMENSION &&
        targetHeight <= MAX_DIMENSION
      ) {
        pipeline = pipeline.resize(targetWidth, targetHeight, { fit: "cover", position: "centre" });
      }

      buffer = await pipeline.toBuffer();
      contentType = validated.contentType;
      safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${validated.extension}`;
    }

    // Vercel Blob credentials: either a static BLOB_READ_WRITE_TOKEN, or the
    // newer OIDC-based auth (BLOB_STORE_ID + the platform-injected
    // VERCEL_OIDC_TOKEN), which is what "Connect Project" wires up today.
    if (process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID) {
      const { put } = await import("@vercel/blob");
      const pathname = `uploads/${safeName}`;
      // This store is provisioned as private-only, so blobs are uploaded
      // private and served back through our own public /api/media proxy
      // (see src/app/api/media/[...path]/route.ts) instead of a direct URL.
      await put(pathname, buffer, { access: "private", contentType });
      return NextResponse.json({ url: `/api/media/${pathname}` });
    }

    // Local development fallback: write directly into the public folder.
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    fs.mkdirSync(uploadDir, { recursive: true });
    fs.writeFileSync(path.join(uploadDir, safeName), buffer);
    return NextResponse.json({ url: `/uploads/${safeName}` });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message || "Upload failed." }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { loadValidatedImage } from "@/lib/imageValidation";
import fs from "fs";
import path from "path";

const MAX_IMAGE_SIZE = 4 * 1024 * 1024; // 4MB

// Public, unauthenticated image upload used by the Department/Faculty/
// Institute information submission form. Images only, and tightly rate
// limited per IP since there's no login gate.
export async function POST(req: NextRequest) {
  const allowed = await checkRateLimit(`public-upload:${getClientIp(req)}`, 30, 15 * 60 * 1000);
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

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image files are allowed." }, { status: 400 });
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return NextResponse.json({ error: "Image must be smaller than 4MB." }, { status: 400 });
  }

  try {
    const rawBuffer = Buffer.from(await file.arrayBuffer());

    // Never trust the client-supplied MIME type/extension above — decode the
    // actual bytes and re-encode through sharp. This rejects anything that
    // isn't a genuine JPG/PNG/WEBP (scripts, HTML, SVG with embedded
    // <script>, disguised executables, polyglot files, etc.) and strips any
    // EXIF/metadata or trailing payload from the stored copy.
    const validated = await loadValidatedImage(rawBuffer);
    if ("error" in validated) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const buffer = await validated.image.toBuffer();
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${validated.extension}`;

    if (process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID) {
      const { put } = await import("@vercel/blob");
      const pathname = `uploads/${safeName}`;
      await put(pathname, buffer, { access: "private", contentType: validated.contentType });
      return NextResponse.json({ url: `/api/media/${pathname}` });
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    fs.mkdirSync(uploadDir, { recursive: true });
    fs.writeFileSync(path.join(uploadDir, safeName), buffer);
    return NextResponse.json({ url: `/uploads/${safeName}` });
  } catch (error: any) {
    console.error("Public upload error:", error);
    return NextResponse.json({ error: error.message || "Upload failed." }, { status: 500 });
  }
}

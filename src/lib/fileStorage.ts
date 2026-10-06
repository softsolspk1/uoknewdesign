import fs from "fs/promises";
import path from "path";

// Reads the raw bytes of a file previously returned by /api/admin/upload or
// /api/public/upload, whichever backend (Vercel Blob or local /public/uploads)
// produced it. Used server-side to embed uploaded images into generated
// PDF/Word exports.
export async function getUploadedFileBuffer(url: string): Promise<Buffer | null> {
  try {
    if (url.startsWith("/api/media/")) {
      const pathname = url.replace(/^\/api\/media\//, "");
      const { get } = await import("@vercel/blob");
      const result = await get(pathname, { access: "private" });
      if (!result || result.statusCode !== 200) return null;
      const arrayBuffer = await new Response(result.stream).arrayBuffer();
      return Buffer.from(arrayBuffer);
    }
    if (url.startsWith("/uploads/")) {
      const filePath = path.join(process.cwd(), "public", url);
      return await fs.readFile(filePath);
    }
    return null;
  } catch (error) {
    console.error("getUploadedFileBuffer error:", error);
    return null;
  }
}

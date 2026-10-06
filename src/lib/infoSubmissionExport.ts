import { getUploadedFileBuffer } from "@/lib/fileStorage";

export const TYPE_LABELS: Record<string, string> = {
  department: "Department",
  faculty: "Faculty Member",
  institute: "Research Institute",
};

type SubmissionWithImages = {
  type: string;
  name: string;
  status: string;
  departmentName: string | null;
  headName: string | null;
  designation: string | null;
  qualification: string | null;
  email: string | null;
  phone: string | null;
  description: string | null;
  programsOffered: string | null;
  facilities: string | null;
  focusAreas: string | null;
  bio: string | null;
  publications: string | null;
  submittedByName: string | null;
  submittedByEmail: string | null;
  createdAt: Date;
  images: { url: string }[];
};

// Returns only the label/value pairs relevant to this submission's type, in
// the order they should appear in an exported document, skipping empty ones.
export function getSubmissionFields(sub: SubmissionWithImages): [string, string][] {
  const rows: [string, string][] = [];
  const add = (label: string, value: string | null | undefined) => {
    if (value && String(value).trim()) rows.push([label, String(value).trim()]);
  };

  if (sub.type === "department") {
    add("Head of Department", sub.headName);
    add("Email", sub.email);
    add("Phone", sub.phone);
    add("Description", sub.description);
    add("Programs Offered", sub.programsOffered);
    add("Facilities", sub.facilities);
  } else if (sub.type === "faculty") {
    add("Department", sub.departmentName);
    add("Designation", sub.designation);
    add("Qualification", sub.qualification);
    add("Email", sub.email);
    add("Phone", sub.phone);
    add("Bio", sub.bio);
    add("Publications", sub.publications);
  } else if (sub.type === "institute") {
    add("Director", sub.headName);
    add("Email", sub.email);
    add("Phone", sub.phone);
    add("Description", sub.description);
    add("Focus Areas", sub.focusAreas);
  }

  add("Submitted By", sub.submittedByName || sub.submittedByEmail ? `${sub.submittedByName || ""}${sub.submittedByName && sub.submittedByEmail ? " — " : ""}${sub.submittedByEmail || ""}` : null);
  add("Submitted On", sub.createdAt ? new Date(sub.createdAt).toLocaleString() : null);
  add("Status", sub.status);

  return rows;
}

// Normalizes an uploaded image (any format the upload pipeline accepts, incl.
// ones pdfkit/docx can't read directly) to a PNG sized to a safe max width,
// so it can be embedded into a generated PDF/Word document.
export async function prepareEmbeddableImage(
  url: string,
  maxWidth = 320
): Promise<{ buffer: Buffer; width: number; height: number } | null> {
  const raw = await getUploadedFileBuffer(url);
  if (!raw) return null;
  try {
    const sharp = (await import("sharp")).default;
    const img = sharp(raw).rotate();
    const metadata = await img.metadata();
    const width = metadata.width || maxWidth;
    const targetWidth = Math.min(width, maxWidth);
    const resized = img.resize({ width: targetWidth });
    const buffer = await resized.png().toBuffer();
    const finalMeta = await sharp(buffer).metadata();
    return {
      buffer,
      width: finalMeta.width || targetWidth,
      height: finalMeta.height || targetWidth,
    };
  } catch (error) {
    console.error("prepareEmbeddableImage error:", error);
    return null;
  }
}

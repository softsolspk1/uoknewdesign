import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { TYPE_LABELS, getSubmissionFields, prepareEmbeddableImage } from "@/lib/infoSubmissionExport";

async function buildPdf(submissions: any[]): Promise<Buffer> {
  const PDFDocument = (await import("pdfkit")).default;
  const doc = new PDFDocument({ margin: 50, autoFirstPage: false });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  for (const sub of submissions) {
    doc.addPage();
    doc.fontSize(18).fillColor("#0a3622").font("Helvetica-Bold").text(`${TYPE_LABELS[sub.type] || sub.type}: ${sub.name}`);
    doc.moveDown(0.6);
    doc.fillColor("#000");

    for (const [label, value] of getSubmissionFields(sub)) {
      doc.fontSize(11).font("Helvetica-Bold").text(`${label}: `, { continued: true });
      doc.font("Helvetica").text(value);
      doc.moveDown(0.3);
    }

    if (sub.images?.length) {
      doc.moveDown(0.5);
      doc.fontSize(11).font("Helvetica-Bold").text("Images:");
      doc.moveDown(0.3);

      const displayWidth = 150;
      const rowHeight = 120;
      const gap = 10;
      let x = doc.page.margins.left;
      let y = doc.y;

      for (const image of sub.images) {
        const prepared = await prepareEmbeddableImage(image.url, 300);
        if (!prepared) continue;

        if (x + displayWidth > doc.page.width - doc.page.margins.right) {
          x = doc.page.margins.left;
          y += rowHeight;
        }
        if (y + rowHeight > doc.page.height - doc.page.margins.bottom) {
          doc.addPage();
          x = doc.page.margins.left;
          y = doc.page.margins.top;
        }

        doc.image(prepared.buffer, x, y, { width: displayWidth });
        x += displayWidth + gap;
      }
    }
  }

  doc.end();
  return done;
}

async function buildDocx(submissions: any[]): Promise<Buffer> {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, ImageRun, PageBreak } = await import("docx");

  const children: any[] = [];

  for (let i = 0; i < submissions.length; i++) {
    const sub = submissions[i];
    if (i > 0) {
      children.push(new Paragraph({ children: [new PageBreak()] }));
    }

    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: `${TYPE_LABELS[sub.type] || sub.type}: ${sub.name}` })],
      })
    );

    for (const [label, value] of getSubmissionFields(sub)) {
      children.push(
        new Paragraph({
          spacing: { after: 100 },
          children: [new TextRun({ text: `${label}: `, bold: true }), new TextRun({ text: value })],
        })
      );
    }

    if (sub.images?.length) {
      children.push(
        new Paragraph({
          spacing: { before: 200, after: 100 },
          children: [new TextRun({ text: "Images:", bold: true })],
        })
      );

      for (const image of sub.images) {
        const prepared = await prepareEmbeddableImage(image.url, 300);
        if (!prepared) continue;
        const displayWidth = 220;
        const displayHeight = Math.round((prepared.height / prepared.width) * displayWidth);
        children.push(
          new Paragraph({
            spacing: { after: 150 },
            children: [
              new ImageRun({
                type: "png",
                data: prepared.buffer,
                transformation: { width: displayWidth, height: displayHeight },
              } as any),
            ],
          })
        );
      }
    }
  }

  const doc = new Document({ sections: [{ children }] });
  return Packer.toBuffer(doc);
}

function safeFilenamePart(s: string) {
  return s.replace(/[^a-z0-9-_]+/gi, "-").replace(/-+/g, "-").slice(0, 60);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { ids, format } = body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "Select at least one entry to export." }, { status: 400 });
  }
  if (format !== "pdf" && format !== "docx") {
    return NextResponse.json({ error: "Format must be 'pdf' or 'docx'." }, { status: 400 });
  }

  const submissions = await prisma.infoSubmission.findMany({
    where: { id: { in: ids } },
    include: { images: { orderBy: { order: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  if (submissions.length === 0) {
    return NextResponse.json({ error: "No matching entries found." }, { status: 404 });
  }

  try {
    const filenameBase =
      submissions.length === 1
        ? `${submissions[0].type}-${safeFilenamePart(submissions[0].name)}`
        : `info-submissions-export-${submissions.length}`;

    if (format === "pdf") {
      const buffer = await buildPdf(submissions);
      return new NextResponse(new Blob([Uint8Array.from(buffer)]), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filenameBase}.pdf"`,
        },
      });
    }

    const buffer = await buildDocx(submissions);
    return new NextResponse(new Blob([Uint8Array.from(buffer)]), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filenameBase}.docx"`,
      },
    });
  } catch (error: any) {
    console.error("Info submission export error:", error);
    return NextResponse.json({ error: "Failed to generate export." }, { status: 500 });
  }
}

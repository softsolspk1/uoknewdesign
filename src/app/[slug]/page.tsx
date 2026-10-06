import React from 'react';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import type { Metadata } from 'next';
import PageViewBeacon from '@/components/PageViewBeacon';
import PdfDownloadButton from '@/components/PdfDownloadButton';
import { ensureExtraSchema } from '@/lib/schemaBootstrap';

// Pages are cached and served statically; edits go live immediately via
// revalidatePath() in the admin pages API, this is just a safety-net TTL.
export const revalidate = 300;

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Pre-render every published page at build time so real traffic is served
// straight from the CDN edge instead of hitting the database per request.
// Any slug not listed here (new pages, .html variants) still renders
// on-demand and gets cached from then on, since dynamicParams defaults to true.
export async function generateStaticParams() {
  try {
    const pages = await prisma.page.findMany({
      // "home" is served at "/" by a separate route, and "index" (a legacy
      // page slug) collides with Next's reserved internal output naming
      // when pre-rendered as a literal static param on Vercel — both are
      // still reachable on-demand, just not statically pre-built.
      where: { isPublished: true, NOT: [{ slug: 'home' }, { slug: 'index' }] },
      select: { slug: true },
    });
    return pages.map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const cleanSlug = decodeURIComponent(slug).replace(/\.html$/, '');

  const page = await prisma.page
    .findFirst({
      where: {
        OR: [{ slug: cleanSlug }, { slug: slug }],
      },
      select: { title: true, metaTitle: true, metaDescription: true },
    })
    .catch(() => null);

  if (page) {
    return {
      title: page.metaTitle || `${page.title} — University of Karachi`,
      description: page.metaDescription || `Official page of ${page.title} at University of Karachi`,
    };
  }

  return {
    title: `${cleanSlug.replace(/-/g, ' ')} — University of Karachi`,
  };
}

export default async function DynamicLegacyPage({ params }: PageProps) {
  const { slug } = await params;
  const cleanSlug = decodeURIComponent(slug).replace(/\.html$/, '');

  await ensureExtraSchema();

  // Fetch page from DB (fall back to legacy_html below if the DB is unreachable)
  const page = await prisma.page
    .findFirst({
      where: {
        OR: [{ slug: cleanSlug }, { slug: slug }],
      },
    })
    .catch(() => null);

  let content = page?.content;

  // Fallback to legacy_html file if DB record not found
  if (!content) {
    const legacyDir = path.join(process.cwd(), 'legacy_html');
    const legacyFile = path.join(legacyDir, `${cleanSlug}.html`);

    if (fs.existsSync(legacyFile)) {
      const fileRaw = fs.readFileSync(legacyFile, 'utf8');
      const headerEndIdx = fileRaw.indexOf('</header>');
      const footerStartIdx = fileRaw.indexOf('<footer');

      if (headerEndIdx !== -1 && footerStartIdx !== -1) {
        content = fileRaw.substring(headerEndIdx + 9, footerStartIdx);
      } else {
        const bStart = fileRaw.indexOf('<body');
        const bEnd = fileRaw.indexOf('</body>');
        if (bStart !== -1 && bEnd !== -1) {
          const afterBodyTag = fileRaw.indexOf('>', bStart) + 1;
          content = fileRaw.substring(afterBodyTag, bEnd);
        } else {
          content = fileRaw;
        }
      }
    }
  }

  if (!content) {
    notFound();
  }

  return (
    <>
      <PageViewBeacon path={`/${cleanSlug}`} />
      <main className="uok-dynamic-page" dangerouslySetInnerHTML={{ __html: content }} />
      <PdfDownloadButton url={page?.pdfUrl} label={page?.pdfLabel} />
    </>
  );
}

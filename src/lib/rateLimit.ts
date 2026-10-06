import prisma from '@/lib/prisma';

/**
 * Simple DB-backed sliding-window rate limiter. Not for hot paths (pages
 * are cached/static and never touch this) — only guards low-frequency,
 * abuse-prone endpoints like login, contact, and uploads.
 */
export async function checkRateLimit(bucket: string, limit: number, windowMs: number): Promise<boolean> {
  const since = new Date(Date.now() - windowMs);

  const count = await prisma.rateLimitHit.count({
    where: { bucket, createdAt: { gte: since } },
  });

  if (count >= limit) return false;

  await prisma.rateLimitHit.create({ data: { bucket } });

  // Opportunistically prune old rows for this bucket so the table doesn't
  // grow unbounded; safe to skip on failure.
  prisma.rateLimitHit
    .deleteMany({ where: { bucket, createdAt: { lt: since } } })
    .catch(() => {});

  return true;
}

export function getClientIp(req: Request): string {
  const headers = req.headers;
  return (
    headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    headers.get('x-real-ip') ||
    'unknown'
  );
}

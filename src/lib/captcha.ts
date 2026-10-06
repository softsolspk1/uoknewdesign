import crypto from "crypto";

// Stateless arithmetic captcha for public, unauthenticated forms (no session
// storage needed). The challenge numbers are HMAC-signed so a bot can't just
// forge its own token/answer pair without ever fetching a real challenge —
// it still has to round-trip through /api/captcha and solve the sum.
const SECRET = process.env.NEXTAUTH_SECRET || "uok-captcha-fallback-secret";
const TTL_MS = 10 * 60 * 1000; // 10 minutes

function sign(payload: string): string {
  return crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function generateCaptcha(): { question: string; token: string } {
  const a = 1 + Math.floor(Math.random() * 9);
  const b = 1 + Math.floor(Math.random() * 9);
  const expires = Date.now() + TTL_MS;
  const payload = `${a}.${b}.${expires}`;
  const token = `${payload}.${sign(payload)}`;
  return { question: `What is ${a} + ${b}?`, token };
}

export function verifyCaptcha(token: unknown, answer: unknown): boolean {
  if (typeof token !== "string") return false;
  const parts = token.split(".");
  if (parts.length !== 4) return false;

  const [aStr, bStr, expiresStr, signature] = parts;
  const payload = `${aStr}.${bStr}.${expiresStr}`;
  if (!safeEqual(sign(payload), signature)) return false;

  const expires = Number(expiresStr);
  if (!Number.isFinite(expires) || Date.now() > expires) return false;

  const numericAnswer = typeof answer === "number" ? answer : Number(answer);
  if (!Number.isFinite(numericAnswer)) return false;

  return Number(aStr) + Number(bStr) === numericAnswer;
}

import nodemailer from "nodemailer";
import crypto from "crypto";
import { normalizeEmail, isValidUokEmail } from "./emailValidation";

export { isValidUokEmail };

const SECRET = process.env.NEXTAUTH_SECRET || "uok-otp-verification-secret-key";
const TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour token validity after successful verification

/**
 * Generates a 4-digit numeric verification code (1000 - 9999).
 */
export function generate4DigitCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * Generates a cryptographically signed verification token for an email address.
 */
export function createVerificationToken(email: string): string {
  const cleanEmail = normalizeEmail(email);
  const expires = Date.now() + TOKEN_EXPIRY_MS;
  const payload = `${cleanEmail}:${expires}`;
  const sig = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
  return `${payload}:${sig}`;
}

/**
 * Verifies a cryptographically signed verification token for a given email address.
 */
export function verifyVerificationToken(token: unknown, email: string): boolean {
  if (typeof token !== "string") return false;
  const parts = token.split(":");
  if (parts.length !== 3) return false;

  const [tokenEmail, expiresStr, sig] = parts;
  const cleanEmail = normalizeEmail(email);
  if (tokenEmail !== cleanEmail) return false;

  const payload = `${tokenEmail}:${expiresStr}`;
  const expectedSig = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");

  const bufSig = Buffer.from(sig);
  const bufExpected = Buffer.from(expectedSig);
  if (bufSig.length !== bufExpected.length) return false;
  if (!crypto.timingSafeEqual(bufSig, bufExpected)) return false;

  const expires = Number(expiresStr);
  if (!Number.isFinite(expires) || Date.now() > expires) return false;

  return true;
}

/**
 * Sends a 4-digit verification code email to a user's @uok.edu.pk address.
 */
export async function sendOtpEmail(
  email: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const secure = process.env.SMTP_SECURE === "true" || port === 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from =
    process.env.SMTP_FROM ||
    (user
      ? `"University of Karachi Portal" <${user}>`
      : `"University of Karachi Portal" <no-reply@uok.edu.pk>`);

  const subject = `[University of Karachi] Verification Code: ${code}`;

  const textContent = `
University of Karachi - Information Submission Verification
============================================================

Your 4-digit verification code is:

  ${code}

This code is valid for 10 minutes.
Please enter this code on the Information Submission form to verify your @uok.edu.pk email address.

If you did not request this code, please ignore this email.
`.trim();

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f6f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f6f8; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 540px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #005a2b 0%, #007a3d 100%); padding: 24px 30px; text-align: center;">
              <div style="color: #a7f3d0; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 4px;">
                University of Karachi
              </div>
              <h1 style="color: #ffffff; font-size: 20px; font-weight: 700; margin: 0; letter-spacing: -0.3px;">
                Email Verification Code
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px 30px; text-align: center;">
              <p style="color: #475569; font-size: 14.5px; line-height: 1.6; margin: 0 0 24px 0;">
                You are submitting an information update on the University of Karachi web portal. Please use the following 4-digit code to verify your official email address (<strong>${escapeHtml(email)}</strong>):
              </p>

              <!-- OTP Code Display -->
              <div style="background-color: #f0fdf4; border: 2px dashed #006633; border-radius: 10px; padding: 18px 24px; display: inline-block; margin-bottom: 24px;">
                <span style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 700; letter-spacing: 10px; color: #005a2b;">
                  ${escapeHtml(code)}
                </span>
              </div>

              <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 0 0 8px 0;">
                ⏳ This code is valid for <strong>10 minutes</strong>.
              </p>
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                If you did not request this verification code, you can safely disregard this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 30px; text-align: center; color: #94a3b8; font-size: 11.5px;">
              University of Karachi • Official Web Portal System
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined,
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 8000,
  });

  const maxAttempts = 3;
  let lastError: any;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const info = await transporter.sendMail({
        from,
        to: email,
        subject,
        text: textContent,
        html: htmlContent,
      });

      console.log(`[OTP Email] Dispatched 4-digit code to ${email} (messageId: ${info.messageId}, attempt ${attempt})`);
      return { success: true };
    } catch (error: any) {
      lastError = error;
      console.error(
        `[OTP Email] Attempt ${attempt}/${maxAttempts} failed for ${email}: code=${error.code} response=${error.response}`,
        error
      );
      // Only retry on transient connection/timeout errors, not permanent auth/rejection failures.
      const transientCodes = ["ETIMEDOUT", "ECONNECTION", "ECONNRESET", "ESOCKET", "EDNS"];
      if (attempt < maxAttempts && transientCodes.includes(error.code)) {
        await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
        continue;
      }
      break;
    }
  }

  return { success: false, error: lastError?.message || "Failed to send email" };
}

function escapeHtml(str: string): string {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

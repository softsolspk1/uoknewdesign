import nodemailer from "nodemailer";

export interface ContactEmailData {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  submittedAt?: Date;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  skipped?: boolean;
  reason?: string;
  error?: string;
}

/**
 * Sends a notification email for new contact form submissions to registrar@uok.edu.pk
 * (or configured CONTACT_RECIPIENT_EMAIL), with reply-to set to the sender.
 */
export async function sendContactFormEmail(data: ContactEmailData): Promise<SendEmailResult> {
  const recipient = process.env.CONTACT_RECIPIENT_EMAIL || "registrar@uok.edu.pk";
  const smtpHost = process.env.SMTP_HOST;

  if (!smtpHost) {
    console.warn(
      `[Contact Email] SMTP_HOST is not configured in environment. Skipped sending email to ${recipient} for inquiry from ${data.email}. (Inquiry saved to Dashboard database).`
    );
    return {
      success: false,
      skipped: true,
      reason: "SMTP_HOST not configured",
    };
  }

  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const secure = process.env.SMTP_SECURE === "true" || port === 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD;
  const from = process.env.SMTP_FROM || (user ? `"University of Karachi Portal" <${user}>` : `"University of Karachi Portal" <noreply@uok.edu.pk>`);

  const submittedDate = (data.submittedAt || new Date()).toLocaleString("en-PK", {
    timeZone: "Asia/Karachi",
    dateStyle: "full",
    timeStyle: "medium",
  });

  const emailSubject = `[UoK Contact Form] ${data.subject || "General Inquiry"} - from ${data.name}`;

  const textContent = `
New Contact Form Submission - University of Karachi Portal
=========================================================

Date & Time: ${submittedDate} (PKT)
Full Name:   ${data.name}
Email:       ${data.email}
Phone:       ${data.phone || "Not provided"}
Subject:     ${data.subject || "General Inquiry"}

Message:
---------------------------------------------------------
${data.message}
---------------------------------------------------------

You can reply directly to this email to respond to ${data.name} (${data.email}).
This message was also recorded in the UOK Admin Portal.
`.trim();

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${emailSubject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f6f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f6f8; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" max-width="640" style="max-width: 640px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #005a2b 0%, #007a3d 100%); padding: 28px 32px; text-align: left;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <div style="color: #a7f3d0; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 4px;">
                      University of Karachi • Official Web Portal
                    </div>
                    <h1 style="color: #ffffff; font-size: 22px; font-weight: 700; margin: 0; letter-spacing: -0.3px;">
                      New Contact Form Inquiry
                    </h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Notice Bar -->
          <tr>
            <td style="background-color: #ecfdf5; border-bottom: 1px solid #a7f3d0; padding: 12px 32px; color: #065f46; font-size: 13px; font-weight: 500;">
              📬 Received via <strong>/contact</strong> page and registered in the Admin Dashboard.
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 32px;">
              
              <!-- Sender Details Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="6" border="0" style="font-size: 14px;">
                      <tr>
                        <td width="120" style="color: #64748b; font-weight: 600; vertical-align: top;">From:</td>
                        <td style="color: #0f172a; font-weight: 600;">${escapeHtml(data.name)}</td>
                      </tr>
                      <tr>
                        <td style="color: #64748b; font-weight: 600; vertical-align: top;">Email:</td>
                        <td>
                          <a href="mailto:${escapeHtml(data.email)}" style="color: #006633; text-decoration: none; font-weight: 600;">
                            ${escapeHtml(data.email)}
                          </a>
                        </td>
                      </tr>
                      <tr>
                        <td style="color: #64748b; font-weight: 600; vertical-align: top;">Phone:</td>
                        <td style="color: #0f172a;">
                          ${data.phone ? `<a href="tel:${escapeHtml(data.phone)}" style="color: #0f172a; text-decoration: none;">${escapeHtml(data.phone)}</a>` : '<span style="color: #94a3b8; font-style: italic;">Not provided</span>'}
                        </td>
                      </tr>
                      <tr>
                        <td style="color: #64748b; font-weight: 600; vertical-align: top;">Subject:</td>
                        <td>
                          <span style="background-color: #e0f2fe; color: #0369a1; padding: 3px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; display: inline-block;">
                            ${escapeHtml(data.subject || "General Inquiry")}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td style="color: #64748b; font-weight: 600; vertical-align: top;">Submitted At:</td>
                        <td style="color: #475569; font-size: 13px;">${submittedDate} (PKT)</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Message Section -->
              <div style="margin-bottom: 24px;">
                <h2 style="font-size: 15px; font-weight: 700; color: #0f172a; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 0.5px;">
                  Message Content
                </h2>
                <div style="background-color: #ffffff; border: 1px solid #cbd5e1; border-left: 4px solid #006633; border-radius: 6px; padding: 18px 20px; font-size: 14px; line-height: 1.65; color: #1e293b; white-space: pre-wrap;">
${escapeHtml(data.message)}
                </div>
              </div>

              <!-- Action Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top: 24px;">
                <tr>
                  <td align="left">
                    <a href="mailto:${escapeHtml(data.email)}?subject=Re:%20${encodeURIComponent(data.subject || 'Inquiry')}" style="background-color: #006633; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: 600; display: inline-block;">
                      ↩ Reply to ${escapeHtml(data.name)}
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 32px; text-align: center; color: #64748b; font-size: 12px; line-height: 1.5;">
              This notification was generated automatically by the <strong>University of Karachi</strong> official web portal.<br>
              Direct replies to this email will be addressed to <strong>${escapeHtml(data.email)}</strong>.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port,
      secure,
      auth: user && pass ? { user, pass } : undefined,
    });

    const info = await transporter.sendMail({
      from,
      to: recipient,
      replyTo: `${data.name} <${data.email}>`,
      subject: emailSubject,
      text: textContent,
      html: htmlContent,
    });

    console.log(`[Contact Email] Email dispatched successfully to ${recipient} (messageId: ${info.messageId})`);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error: any) {
    console.error(`[Contact Email] Failed to send email to ${recipient}:`, error);
    return {
      success: false,
      error: error.message || "Failed to send email",
    };
  }
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

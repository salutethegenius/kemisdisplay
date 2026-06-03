import { Resend } from "resend";

export type FreeportLead = {
  name: string;
  business: string;
  phone: string;
  email?: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getResendClient(): Resend | null {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  return new Resend(key);
}

function getFromAddress(): string | null {
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  return from || null;
}

function getNotifyRecipients(): string[] {
  const raw =
    process.env.FREEPORT_LEADS_NOTIFY_EMAIL?.trim() ||
    process.env.RESEND_LEADS_NOTIFY_EMAIL?.trim() ||
    "legal@kemisdisplay.com";
  return raw
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
}

export function isResendConfigured(): boolean {
  return Boolean(getResendClient() && getFromAddress());
}

export async function sendFreeportLeadEmails(lead: FreeportLead): Promise<void> {
  const resend = getResendClient();
  const from = getFromAddress();
  if (!resend || !from) {
    throw new Error("Resend is not configured (RESEND_API_KEY, RESEND_FROM_EMAIL).");
  }

  const notifyTo = getNotifyRecipients();
  const safe = {
    name: escapeHtml(lead.name),
    business: escapeHtml(lead.business),
    phone: escapeHtml(lead.phone),
    email: lead.email ? escapeHtml(lead.email) : "",
  };

  const notifyHtml = `
    <h2 style="color:#0d0806;font-family:sans-serif;">New Freeport demo interest</h2>
    <table style="font-family:sans-serif;font-size:15px;line-height:1.5;color:#1a1410;">
      <tr><td style="padding:4px 12px 4px 0;font-weight:600;">Name</td><td>${safe.name}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;font-weight:600;">Business</td><td>${safe.business}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;font-weight:600;">Phone</td><td><a href="tel:${safe.phone}">${safe.phone}</a></td></tr>
      ${
        safe.email
          ? `<tr><td style="padding:4px 12px 4px 0;font-weight:600;">Email</td><td><a href="mailto:${safe.email}">${safe.email}</a></td></tr>`
          : ""
      }
    </table>
    <p style="font-family:sans-serif;font-size:13px;color:#6b7280;margin-top:24px;">
      Submitted via kemisdisplay.com/freeport
    </p>
  `;

  const { error: notifyError } = await resend.emails.send({
    from,
    to: notifyTo,
    subject: `Freeport demo interest — ${lead.business}`,
    html: notifyHtml,
  });
  if (notifyError) {
    throw new Error(notifyError.message);
  }

  if (lead.email) {
    const welcomeHtml = `
      <div style="font-family:sans-serif;max-width:32rem;color:#1a1410;line-height:1.6;">
        <p style="font-size:18px;font-weight:600;color:#0d0806;">Hi ${safe.name},</p>
        <p>Thanks for registering your interest in our <strong>exclusive Freeport live demo</strong>.</p>
        <p>You're on the list. We'll reach out to confirm the date and location once they're set — and you'll lock in your spot for <strong>30 days free</strong> on KemisDisplay, then just <strong>$25/month</strong>.</p>
        <p>Questions before then? Call or WhatsApp us at <strong>242-447-9692</strong>.</p>
        <p style="margin-top:28px;color:#6b7280;font-size:14px;">— KemisDisplay<br>Freeport, The Bahamas</p>
      </div>
    `;

    const { error: welcomeError } = await resend.emails.send({
      from,
      to: lead.email,
      subject: "You're on the list — KemisDisplay Freeport demo",
      html: welcomeHtml,
    });
    if (welcomeError) {
      throw new Error(welcomeError.message);
    }
  }
}

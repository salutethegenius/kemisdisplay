import { NextRequest, NextResponse } from "next/server";

import {
  isResendConfigured,
  sendFreeportLeadEmails,
  type FreeportLead,
} from "@/lib/resend-mail";

export const runtime = "nodejs";

const MAX = {
  name: 120,
  business: 200,
  phone: 40,
  email: 320,
} as const;

function trimField(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

function isValidEmail(value: string): boolean {
  if (!value) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: NextRequest) {
  if (!isResendConfigured()) {
    return NextResponse.json(
      { detail: "Lead capture is not configured on this server." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ detail: "Invalid JSON body." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ detail: "Invalid request body." }, { status: 400 });
  }

  const raw = body as Record<string, unknown>;

  if (typeof raw.website === "string" && raw.website.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  const name = trimField(raw.name, MAX.name);
  const business = trimField(raw.business, MAX.business);
  const phone = trimField(raw.phone, MAX.phone);
  const email = trimField(raw.email, MAX.email).toLowerCase();

  if (!name || !business || !phone) {
    return NextResponse.json(
      { detail: "Name, business name, and contact number are required." },
      { status: 400 },
    );
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ detail: "Invalid email address." }, { status: 400 });
  }

  const lead: FreeportLead = { name, business, phone };
  if (email) lead.email = email;

  try {
    await sendFreeportLeadEmails(lead);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send email.";
    console.error("[freeport-interest]", message);
    return NextResponse.json(
      { detail: "Could not register your interest. Please try again or call us." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from "next/server";

import {
  isResendConfigured,
  sendScheduleDemoLeadEmails,
  type ScheduleDemoLead,
} from "@/lib/resend-mail";

export const runtime = "nodejs";

const MAX = {
  name: 120,
  business: 200,
  phone: 40,
  email: 320,
  area: 120,
  notes: 500,
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
  const area = trimField(raw.area, MAX.area);
  const notes = trimField(raw.notes, MAX.notes);

  if (!name || !business || !phone) {
    return NextResponse.json(
      { detail: "Name, business name, and contact number are required." },
      { status: 400 },
    );
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ detail: "Invalid email address." }, { status: 400 });
  }

  const lead: ScheduleDemoLead = { name, business, phone };
  if (email) lead.email = email;
  if (area) lead.area = area;
  if (notes) lead.notes = notes;

  try {
    await sendScheduleDemoLeadEmails(lead);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send email.";
    console.error("[schedule-demo]", message);
    return NextResponse.json(
      { detail: "Could not submit your request. Please try again or call us." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}

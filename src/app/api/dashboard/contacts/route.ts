import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchOdooContacts } from "@/lib/odoo";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8080";

function bearer() {
  const token = cookies().get("token")?.value ?? "";
  return token ? `Bearer ${token}` : "";
}

// GET — read synced data from the Go backend DB (never hits Odoo)
export async function GET() {
  try {
    const res = await fetch(`${BACKEND}/odoo/contacts`, {
      headers: { Authorization: bearer() },
      cache: "no-store",
    });
    if (!res.ok) {
      const text = await res.text();
      console.error("[odoo/contacts] GET backend error", res.status, text);
      return NextResponse.json({ error: `Backend ${res.status}` }, { status: res.status });
    }
    return NextResponse.json(await res.json());
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch contacts";
    console.error("[odoo/contacts] GET", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

// POST — fetch fresh data from Odoo then save to Go backend DB
export async function POST() {
  try {
    const fresh = await fetchOdooContacts();
    const contacts = fresh.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email === false ? "" : c.email,
      phone: c.phone === false ? "" : c.phone,
    }));

    const res = await fetch(`${BACKEND}/odoo/contacts/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: bearer(),
      },
      body: JSON.stringify({ contacts }),
      cache: "no-store",
    });
    if (!res.ok) {
      const text = await res.text();
      console.error("[odoo/contacts] POST sync error", res.status, text);
      return NextResponse.json({ error: `Backend sync ${res.status}` }, { status: res.status });
    }
    return NextResponse.json(await res.json());
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to sync contacts";
    console.error("[odoo/contacts] POST", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchOdooContacts } from "@/lib/odoo";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8080";

function bearer() {
  const token = cookies().get("token")?.value ?? "";
  return token ? `Bearer ${token}` : "";
}

function mapContact(c: Awaited<ReturnType<typeof fetchOdooContacts>>[number]) {
  return {
    id: c.id,
    name: c.name,
    email: c.email === false ? "" : c.email,
    phone: c.phone === false ? "" : c.phone,
    street: c.street === false ? "" : c.street,
    city: c.city === false ? "" : c.city,
    state_name: c.state_id ? c.state_id[1] : "",
    country_name: c.country_id ? c.country_id[1] : "",
    vat: c.vat === false ? "" : c.vat,
    website: c.website === false ? "" : c.website,
    lang: c.lang === false ? "" : c.lang,
    salesperson: c.user_id ? c.user_id[1] : "",
    company_type: c.company_type,
    customer_rank: c.customer_rank,
    supplier_rank: c.supplier_rank,
  };
}

// GET — fetch directly from Odoo so all fields are available
export async function GET() {
  try {
    const fresh = await fetchOdooContacts();
    const data = fresh.map(mapContact);
    return NextResponse.json({ data, synced_at: new Date().toISOString() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch contacts";
    console.error("[odoo/contacts] GET", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

// POST — also sync the slim subset to the Go backend DB for the mobile app
export async function POST() {
  try {
    const fresh = await fetchOdooContacts();
    const data = fresh.map(mapContact);

    const slim = fresh.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email === false ? "" : c.email,
      phone: c.phone === false ? "" : c.phone,
    }));

    fetch(`${BACKEND}/odoo/contacts/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: bearer() },
      body: JSON.stringify({ contacts: slim }),
      cache: "no-store",
    }).catch((e) => console.error("[odoo/contacts] backend sync error", e));

    return NextResponse.json({ data, synced_at: new Date().toISOString(), count: data.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to sync contacts";
    console.error("[odoo/contacts] POST", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

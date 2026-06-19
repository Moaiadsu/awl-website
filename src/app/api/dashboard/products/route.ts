import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchOdooProducts } from "@/lib/odoo";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8080";

function bearer() {
  const token = cookies().get("token")?.value ?? "";
  return token ? `Bearer ${token}` : "";
}

// GET — read synced data from the Go backend DB (never hits Odoo)
export async function GET() {
  try {
    const res = await fetch(`${BACKEND}/odoo/products`, {
      headers: { Authorization: bearer() },
      cache: "no-store",
    });
    if (!res.ok) {
      const text = await res.text();
      console.error("[odoo/products] GET backend error", res.status, text);
      return NextResponse.json({ error: `Backend ${res.status}` }, { status: res.status });
    }
    return NextResponse.json(await res.json());
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch products";
    console.error("[odoo/products] GET", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

// POST — fetch fresh data from Odoo then save to Go backend DB
export async function POST() {
  try {
    const fresh = await fetchOdooProducts();
    const products = fresh.map((p) => ({
      id: p.id,
      name: p.name,
      list_price: p.list_price,
      qty_available: p.qty_available,
      barcode: p.barcode === false ? "" : p.barcode,
    }));

    const res = await fetch(`${BACKEND}/odoo/products/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: bearer(),
      },
      body: JSON.stringify({ products }),
      cache: "no-store",
    });
    if (!res.ok) {
      const text = await res.text();
      console.error("[odoo/products] POST sync error", res.status, text);
      return NextResponse.json({ error: `Backend sync ${res.status}` }, { status: res.status });
    }
    return NextResponse.json(await res.json());
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to sync products";
    console.error("[odoo/products] POST", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

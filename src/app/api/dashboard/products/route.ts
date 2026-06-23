import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchOdooProducts } from "@/lib/odoo";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8080";

function bearer() {
  const token = cookies().get("token")?.value ?? "";
  return token ? `Bearer ${token}` : "";
}

function mapProduct(p: Awaited<ReturnType<typeof fetchOdooProducts>>[number]) {
  return {
    id: p.id,
    name: p.name,
    list_price: p.list_price,
    standard_price: p.standard_price,
    qty_available: p.qty_available,
    barcode: p.barcode === false ? "" : p.barcode,
    default_code: p.default_code === false ? "" : p.default_code,
    categ_name: p.categ_id ? p.categ_id[1] : "",
    type: p.type,
    description_sale: p.description_sale === false ? "" : p.description_sale,
    sale_ok: p.sale_ok,
    purchase_ok: p.purchase_ok,
    weight: p.weight,
    volume: p.volume,
    image_128: p.image_128 === false ? "" : p.image_128,
  };
}

// GET — fetch directly from Odoo so all fields are available
export async function GET() {
  try {
    const fresh = await fetchOdooProducts();
    const data = fresh.map(mapProduct);
    return NextResponse.json({ data, synced_at: new Date().toISOString() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch products";
    console.error("[odoo/products] GET", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

// POST — also sync the slim subset to the Go backend DB for the mobile app
export async function POST() {
  try {
    const fresh = await fetchOdooProducts();
    const data = fresh.map(mapProduct);

    const slim = fresh.map((p) => ({
      id: p.id,
      name: p.name,
      list_price: p.list_price,
      qty_available: p.qty_available,
      barcode: p.barcode === false ? "" : p.barcode,
    }));

    // Fire-and-forget sync to Go backend; don't fail the request if it's down
    fetch(`${BACKEND}/odoo/products/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: bearer() },
      body: JSON.stringify({ products: slim }),
      cache: "no-store",
    }).catch((e) => console.error("[odoo/products] backend sync error", e));

    return NextResponse.json({ data, synced_at: new Date().toISOString(), count: data.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to sync products";
    console.error("[odoo/products] POST", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

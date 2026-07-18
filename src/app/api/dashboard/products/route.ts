import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  fetchOdooProducts,
  fetchOdooVariantsByTemplate,
  fetchOdooPackagingsByTemplate,
  type OdooPackaging,
} from "@/lib/odoo";

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
    // Wire key stays `image_128` (matches OdooProductRow/the Go backend's
    // JSON tag/the mobile app) — only the source Odoo field got bigger.
    image_128: p.image_1024 === false ? "" : p.image_1024,
    variant_count: p.product_variant_count ?? 1,
  };
}

// Resolves each template's sellable pack sizes (Odoo's product.packaging,
// e.g. "Box of 60" / "Set of 10") for display on the product card. Sync/read
// still succeeds without them.
async function withPackagings(
  fresh: Awaited<ReturnType<typeof fetchOdooProducts>>,
  data: ReturnType<typeof mapProduct>[],
): Promise<{ data: (ReturnType<typeof mapProduct> & { packagings: { id: number; name: string; qty: number }[] })[]; packagingWarning?: string }> {
  try {
    const packagingsByTemplate = await fetchOdooPackagingsByTemplate(fresh.map((p) => p.id));
    return {
      data: data.map((p) => ({
        ...p,
        packagings: (packagingsByTemplate.get(p.id) ?? []).map((pk) => ({
          id: pk.id,
          name: pk.name,
          qty: pk.qty,
        })),
      })),
    };
  } catch (e) {
    // Surfaced to the dashboard (not just the server log) — a silently
    // swallowed error here previously made "packaging never shows up" look
    // like a display bug when it was actually a failed Odoo call.
    const message = e instanceof Error ? e.message : "packaging fetch failed";
    console.error("[odoo/products] packaging fetch error", e);
    return { data: data.map((p) => ({ ...p, packagings: [] })), packagingWarning: message };
  }
}

// GET — fetch directly from Odoo so all fields are available
export async function GET() {
  try {
    const fresh = await fetchOdooProducts();
    const { data, packagingWarning } = await withPackagings(fresh, fresh.map(mapProduct));
    return NextResponse.json({
      data,
      synced_at: new Date().toISOString(),
      ...(packagingWarning ? { packaging_warning: packagingWarning } : {}),
    });
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
    const mapped = fresh.map(mapProduct);

    // Resolve each template's generated SKUs (product.product) so size/pack
    // variations reach the app catalog. Sync still succeeds without them.
    const variantsByTemplate = await fetchOdooVariantsByTemplate(
      fresh.map((p) => p.id),
    ).catch((e) => {
      console.error("[odoo/products] variant fetch error", e);
      return new Map<number, never[]>();
    });

    // Resolve each template's sellable pack sizes (Odoo's product.packaging,
    // e.g. "Set of 1" / "Box of 12"). Sync still succeeds without them, but
    // the failure reason is surfaced below instead of silently swallowed —
    // an empty `packagings` array looked like a display bug when it was
    // actually a failed Odoo call (e.g. missing model access).
    let packagingsByTemplate = new Map<number, OdooPackaging[]>();
    let packagingWarning: string | undefined;
    try {
      packagingsByTemplate = await fetchOdooPackagingsByTemplate(fresh.map((p) => p.id));
    } catch (e) {
      packagingWarning = e instanceof Error ? e.message : "packaging fetch failed";
      console.error("[odoo/products] packaging fetch error", e);
    }

    // Also carry packagings on the dashboard response so the product card
    // reflects them immediately after a sync, not just on the next GET.
    const data = mapped.map((p) => ({
      ...p,
      packagings: (packagingsByTemplate.get(p.id) ?? []).map((pk) => ({
        id: pk.id,
        name: pk.name,
        qty: pk.qty,
      })),
    }));

    const slim = fresh.map((p) => ({
      id: p.id,
      name: p.name,
      list_price: p.list_price,
      qty_available: p.qty_available,
      barcode: p.barcode === false ? "" : p.barcode,
      category: p.categ_id ? p.categ_id[1] : "",
      // Wire key stays `image_128` (Go backend's JSON tag, mobile app) —
      // only the source Odoo field is bigger now.
      image_128: p.image_1024 === false ? "" : p.image_1024,
      variants: (variantsByTemplate.get(p.id) ?? []).map((v) => ({
        id: `odoo-var-${v.id}`,
        label: v.label,
        label_ar: v.label, // Odoo carries one name; Arabic falls back to it
        price: v.price,
        stock: v.stock,
        barcode: v.barcode,
        // data URI so no extra fetch is needed; empty = use the product image
        image_url: v.image ? `data:image/png;base64,${v.image}` : "",
      })),
      packagings: (packagingsByTemplate.get(p.id) ?? []).map((pk) => ({
        id: `odoo-pack-${pk.id}`,
        name: pk.name,
        name_ar: pk.name, // Odoo carries one name; Arabic falls back to it
        qty: pk.qty,
      })),
    }));

    // With ODOO_DEBUG=1, also dump the exact payload pushed to the Go backend
    // (post-mapping — what the app catalog will contain).
    if (process.env.ODOO_DEBUG) {
      const fs = await import("fs/promises");
      const path = await import("path");
      const dir = path.join(process.cwd(), "odoo-debug");
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(
        path.join(dir, "sync-payload.json"),
        JSON.stringify(slim, null, 2),
      ).catch((e) => console.error("[odoo:debug] payload dump failed", e));
      console.log(`[odoo:debug] sync payload → odoo-debug/sync-payload.json (${slim.length} products)`);
    }

    // Sync to the Go backend and report the real outcome — a 401 (expired
    // session) or backend-down must be visible, not silently swallowed.
    let backendSync = "ok";
    try {
      const res = await fetch(`${BACKEND}/odoo/products/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: bearer() },
        body: JSON.stringify({ products: slim }),
        cache: "no-store",
      });
      if (!res.ok) {
        backendSync = `failed: HTTP ${res.status}`;
        console.error("[odoo/products] backend sync failed", res.status);
      }
    } catch (e) {
      backendSync = "failed: backend unreachable";
      console.error("[odoo/products] backend sync error", e);
    }

    return NextResponse.json({
      data,
      synced_at: new Date().toISOString(),
      count: data.length,
      backend_sync: backendSync,
      ...(packagingWarning ? { packaging_warning: packagingWarning } : {}),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to sync products";
    console.error("[odoo/products] POST", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

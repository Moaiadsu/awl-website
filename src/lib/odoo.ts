// Server-only — never import in client components.
//
// Auth flow (Odoo external JSON-RPC API):
//   1. POST /jsonrpc  service:"common"  method:"authenticate"  →  numeric uid (cached 50 min)
//   2. POST /jsonrpc  service:"object"  method:"execute_kw"    →  model data
//
// All credentials stay in process.env; nothing reaches the browser.

export type OdooContact = {
  id: number;
  name: string;
  email: string | false;
  phone: string | false;
  street: string | false;
  city: string | false;
  country_id: [number, string] | false;
  state_id: [number, string] | false;
  vat: string | false;
  website: string | false;
  lang: string | false;
  user_id: [number, string] | false;
  company_type: "company" | "person";
  customer_rank: number;
  supplier_rank: number;
};

export type OdooProduct = {
  id: number;
  name: string;
  list_price: number;
  standard_price: number;
  qty_available: number;
  barcode: string | false;
  default_code: string | false;
  categ_id: [number, string] | false;
  type: string;
  description_sale: string | false;
  sale_ok: boolean;
  purchase_ok: boolean;
  weight: number;
  volume: number;
  // Requested at 1024px (Odoo's server-derived size, same source image as
  // image_128 just resized larger) — the 128px thumbnail was visibly
  // blurry once stretched to fill a 260-280px+ product image card.
  image_1024: string | false;
  product_variant_count: number;
};

// ── Internal types ────────────────────────────────────────────────────────────

type OdooRpcError = {
  code?: number;
  message?: string;
  data?: { name?: string; message?: string; debug?: string };
};

type OdooEnvelope<T> = {
  result?: T;
  error?: OdooRpcError;
};

// ── Env helpers ───────────────────────────────────────────────────────────────

function odooEnv() {
  const url = (process.env.ODOO_URL ?? "")
    .replace(/\/(odoo|web)(\/.*)?$/, "")
    .replace(/\/$/, "");
  const db       = process.env.ODOO_DB       ?? "";
  const username = process.env.ODOO_USERNAME ?? process.env.ODOO_EMAIL ?? "";
  const key      = process.env.ODOO_API_KEY  ?? "";

  if (!url || !db || !username || !key) {
    throw new Error(
      "Missing Odoo config. Set ODOO_URL, ODOO_DB, ODOO_USERNAME, ODOO_API_KEY in .env.local",
    );
  }

  return { url, db, username, key };
}

// ── uid cache (module-level singleton) ───────────────────────────────────────

let _auth: { uid: number; expires: number } | null = null;

// ── Low-level transport ───────────────────────────────────────────────────────
// Returns the raw JSON-RPC envelope so callers can handle errors with context.

async function jsonRpc<T>(
  params: { service: string; method: string; args: unknown[] },
  rpcId: number,
): Promise<OdooEnvelope<T>> {
  const { url } = odooEnv();

  const res = await fetch(`${url}/jsonrpc`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", method: "call", id: rpcId, params }),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Odoo HTTP ${res.status}: ${res.statusText}`);
  }

  return res.json() as Promise<OdooEnvelope<T>>;
}

// ── Authentication ────────────────────────────────────────────────────────────

async function getUid(): Promise<number> {
  if (_auth && Date.now() < _auth.expires) {
    return _auth.uid;
  }

  const { db, username, key } = odooEnv();

  const envelope = await jsonRpc<number | false | null>(
    { service: "common", method: "authenticate", args: [db, username, key, {}] },
    1,
  );

  const uid = envelope.result;

  if (envelope.error || !uid || typeof uid !== "number") {
    _auth = null;
    console.error(
      "[odoo] auth failed",
      JSON.stringify(envelope.error ?? { result: uid }, null, 2),
    );
    throw new Error(
      `Odoo auth: ${
        envelope.error?.data?.message ??
        envelope.error?.message ??
        "authentication returned no uid"
      }`,
    );
  }

  _auth = { uid, expires: Date.now() + 50 * 60 * 1000 };
  return uid;
}

// ── Debug logging ─────────────────────────────────────────────────────────────
// Set ODOO_DEBUG=1 in .env.local to dump every raw Odoo response into
// odoo-debug/<seq>-<model>.<method>.json (full JSON, exactly as returned) and
// log a one-line summary to the server console.

let _dbgSeq = 0;

async function debugDump(name: string, payload: unknown) {
  if (!process.env.ODOO_DEBUG) return;
  try {
    const fs = await import("fs/promises");
    const path = await import("path");
    const dir = path.join(process.cwd(), "odoo-debug");
    await fs.mkdir(dir, { recursive: true });
    const file = path.join(dir, `${String(++_dbgSeq).padStart(3, "0")}-${name}.json`);
    await fs.writeFile(file, JSON.stringify(payload, null, 2));
    const size = Array.isArray(payload) ? `${payload.length} records` : typeof payload;
    console.log(`[odoo:debug] ${name} → ${file} (${size})`);
  } catch (e) {
    console.error("[odoo:debug] dump failed", e);
  }
}

// ── Core RPC call ─────────────────────────────────────────────────────────────

async function callKw<T>(
  model: string,
  method: string,
  args: unknown[],
  kwargs: Record<string, unknown>,
  retry = true,
): Promise<T> {
  const { db, key } = odooEnv();
  const uid = await getUid();

  const envelope = await jsonRpc<T>(
    {
      service: "object",
      method:  "execute_kw",
      args:    [db, uid, key, model, method, args, kwargs],
    },
    2,
  );

  // Session/uid expired mid-flight — clear cache and retry once
  const errName = envelope.error?.data?.name ?? "";
  const isExpired =
    errName === "odoo.http.SessionExpiredException" ||
    errName.includes("AccessDenied") ||
    errName.includes("AccessError");

  if (envelope.error && isExpired && retry) {
    _auth = null;
    return callKw(model, method, args, kwargs, false);
  }

  if (envelope.error) {
    console.error("[odoo] rpc failed", JSON.stringify(envelope.error, null, 2));
    throw new Error(
      envelope.error.data?.message ?? envelope.error.message ?? "Odoo RPC error",
    );
  }

  await debugDump(`${model}.${method}`, envelope.result);
  return envelope.result as T;
}

export type NewOdooContact = {
  name: string;
  email?: string;
  phone?: string;
  street?: string;
  street2?: string;
  city?: string;
  zip?: string;
  vat?: string;
  website?: string;
  lang?: string;
  function?: string;   // job position
  comment?: string;    // internal notes
  ref?: string;
  company_type?: "company" | "person";
  customer_rank?: number;
  supplier_rank?: number;
};

// ── Public fetch functions ────────────────────────────────────────────────────

// Translated fields (product names, attribute values …) are stored per
// language; without a lang context Odoo returns the base-language (en_US)
// value — NOT what the team edits in the Arabic UI. Read catalog data in the
// store's working language so renames actually reach the sync.
const ODOO_LANG = process.env.ODOO_LANG ?? "ar_001";
const langCtx = { lang: ODOO_LANG };

export async function fetchOdooContacts(): Promise<OdooContact[]> {
  return callKw<OdooContact[]>(
    "res.partner",
    "search_read",
    [[["active", "=", true]]],
    {
      fields: [
        "id", "name", "email", "phone",
        "street", "city", "state_id", "country_id",
        "vat", "website", "lang",
        "user_id", "company_type",
        "customer_rank", "supplier_rank",
      ],
      limit: 500,
      order: "name asc",
    },
  );
}

export async function findOdooContactByNameOrPhone(
  name: string,
  phone?: string,
): Promise<number | null> {
  const domain: unknown[] = phone
    ? ["|", ["name", "=", name], ["phone", "=", phone]]
    : [["name", "=", name]];

  const results = await callKw<Array<{ id: number }>>(
    "res.partner",
    "search_read",
    [[...domain, ["active", "=", true]]],
    { fields: ["id"], limit: 1 },
  );
  return results.length > 0 ? results[0].id : null;
}

export async function archiveOdooContact(id: number): Promise<boolean> {
  return callKw<boolean>("res.partner", "write", [[id], { active: false }], {});
}

/// Hard-delete a contact. Odoo refuses to unlink partners referenced by other
/// documents (invoices, orders, …) — in that case fall back to archiving.
/// Returns how the contact was removed.
export async function deleteOdooContact(id: number): Promise<"deleted" | "archived"> {
  try {
    await callKw<boolean>("res.partner", "unlink", [[id]], {});
    return "deleted";
  } catch {
    await archiveOdooContact(id);
    return "archived";
  }
}

export async function createOdooContact(data: NewOdooContact): Promise<number> {
  const payload: Record<string, unknown> = { name: data.name };
  if (data.email)         payload.email         = data.email;
  if (data.phone)         payload.phone         = data.phone;
  if (data.street)        payload.street        = data.street;
  if (data.street2)       payload.street2       = data.street2;
  if (data.city)          payload.city          = data.city;
  if (data.zip)           payload.zip           = data.zip;
  if (data.vat)           payload.vat           = data.vat;
  if (data.website)       payload.website       = data.website;
  if (data.lang)          payload.lang          = data.lang;
  if (data.function)      payload.function      = data.function;
  if (data.comment)       payload.comment       = data.comment;
  if (data.ref)           payload.ref           = data.ref;
  if (data.company_type)  payload.company_type  = data.company_type;
  if (data.customer_rank !== undefined) payload.customer_rank = data.customer_rank;
  if (data.supplier_rank !== undefined) payload.supplier_rank = data.supplier_rank;

  return callKw<number>("res.partner", "create", [payload], {});
}

export async function fetchOdooProducts(): Promise<OdooProduct[]> {
  return callKw<OdooProduct[]>(
    "product.template",
    "search_read",
    [[["sale_ok", "=", true]]],
    {
      fields: [
        "id", "name", "list_price", "standard_price",
        "qty_available", "barcode", "default_code",
        "categ_id", "type", "description_sale",
        "sale_ok", "purchase_ok",
        "weight", "volume", "image_1024",
        "product_variant_count",
      ],
      limit: 500,
      order: "name asc",
      context: langCtx,
    },
  );
}

// ── Product variants ──────────────────────────────────────────────────────────
//
// Odoo splits "a product" across models:
//   product.template                  — the parent (what fetchOdooProducts reads)
//   product.product                   — one sellable SKU per attribute combination;
//                                       carries its own price (lst_price =
//                                       template price + price_extra), stock and barcode
//   product.template.attribute.value  — the combination entries a variant points to
//                                       via product_template_attribute_value_ids;
//                                       its name is the value ("5L"), attribute_id
//                                       names the axis ("Size")

/// One sellable SKU of a template, with its combination resolved to a label.
export type OdooVariant = {
  id: number;            // product.product id
  templateId: number;    // parent product.template id
  label: string;         // attribute values joined, e.g. "Blue / 5L"
  price: number;         // variant sales price (lst_price)
  stock: number;         // variant-level qty_available
  barcode: string;
  image: string;         // variant-specific image (base64); "" = inherits template image
};

type RawVariant = {
  id: number;
  product_tmpl_id: [number, string];
  lst_price: number;
  qty_available: number;
  barcode: string | false;
  default_code: string | false;
  product_template_attribute_value_ids: number[];
};

/// Fetches all variants (product.product) for the given templates and resolves
/// each variant's attribute combination to a human label. Templates with a
/// single variant are omitted — their lone SKU *is* the template.
export async function fetchOdooVariantsByTemplate(
  templateIds: number[],
): Promise<Map<number, OdooVariant[]>> {
  const byTemplate = new Map<number, OdooVariant[]>();
  if (templateIds.length === 0) return byTemplate;

  // 1. All active SKUs of the requested templates in one call.
  const raw = await callKw<RawVariant[]>(
    "product.product",
    "search_read",
    [[["product_tmpl_id", "in", templateIds], ["active", "=", true]]],
    {
      fields: [
        "id", "product_tmpl_id", "lst_price", "qty_available",
        "barcode", "default_code", "product_template_attribute_value_ids",
      ],
      limit: 5000,
      context: langCtx,
    },
  );

  // 2. Resolve every referenced combination entry to a clear "attribute: value"
  //    label ("اللون: احمر"), keyed by product.template.attribute.value id.
  const ptavIds = Array.from(
    new Set(raw.flatMap((v) => v.product_template_attribute_value_ids)),
  );
  const valueLabel = new Map<number, string>();
  // combination entry → underlying product.attribute.value (carries the
  // swatch/photo an admin can set on the value in "الخصائص والمتغيرات")
  const rawValueOf = new Map<number, number>();
  if (ptavIds.length > 0) {
    const values = await callKw<
      Array<{
        id: number;
        name: string;
        attribute_id: [number, string];
        product_attribute_value_id: [number, string] | false;
      }>
    >(
      "product.template.attribute.value",
      "read",
      [ptavIds],
      {
        fields: ["id", "name", "attribute_id", "product_attribute_value_id"],
        context: langCtx,
      },
    );
    for (const v of values) {
      const attr = v.attribute_id ? v.attribute_id[1] : "";
      valueLabel.set(v.id, attr ? `${attr}: ${v.name}` : v.name);
      if (v.product_attribute_value_id) {
        rawValueOf.set(v.id, v.product_attribute_value_id[0]);
      }
    }
  }

  // 3. Group SKUs under their template, labelling each by its combination
  //    (falling back to the internal reference for combination-less SKUs).
  for (const v of raw) {
    const label =
      v.product_template_attribute_value_ids
        .map((id) => valueLabel.get(id))
        .filter(Boolean)
        .join(" • ") ||
      (v.default_code === false ? "" : v.default_code);
    const list = byTemplate.get(v.product_tmpl_id[0]) ?? [];
    list.push({
      id: v.id,
      templateId: v.product_tmpl_id[0],
      label,
      price: v.lst_price,
      stock: Math.max(0, Math.round(v.qty_available)),
      barcode: v.barcode === false ? "" : v.barcode,
      image: "",
    });
    byTemplate.set(v.product_tmpl_id[0], list);
  }

  // Single-variant templates carry no variations worth showing; the rest are
  // sorted by label so clients render a stable, readable order.
  byTemplate.forEach((list, tid) => {
    if (list.length <= 1) {
      byTemplate.delete(tid);
    } else {
      list.sort((a, b) => a.label.localeCompare(b.label, "ar"));
    }
  });

  // 4. Variant images for the SKUs that survived the grouping. Resolution
  //    chain: the SKU's own photo (image_variant_1024 — requested at 1024px
  //    so it isn't blurry once stretched to the product image card; same
  //    source photo as image_variant_128, just a bigger server-derived
  //    size) → the photo set on the attribute value itself
  //    (product.attribute.value.image — where the "الخصائص والمتغيرات"
  //    upload lands) → empty, so clients fall back to the parent product
  //    image.
  const keptIds: number[] = [];
  byTemplate.forEach((list) => list.forEach((v) => keptIds.push(v.id)));
  const imageBySku = new Map<number, string>();
  const ptavBySku = new Map<number, number[]>();
  for (const v of raw) ptavBySku.set(v.id, v.product_template_attribute_value_ids);
  for (let i = 0; i < keptIds.length; i += 200) {
    const chunk = await callKw<Array<{ id: number; image_variant_1024: string | false }>>(
      "product.product",
      "read",
      [keptIds.slice(i, i + 200)],
      { fields: ["id", "image_variant_1024"] },
    );
    for (const c of chunk) {
      if (c.image_variant_1024 !== false) imageBySku.set(c.id, c.image_variant_1024);
    }
  }

  // Attribute-value photos, only for the values still needed after step one.
  const neededValueIds = new Set<number>();
  for (const id of keptIds) {
    if (imageBySku.has(id)) continue;
    for (const ptav of ptavBySku.get(id) ?? []) {
      const rawId = rawValueOf.get(ptav);
      if (rawId) neededValueIds.add(rawId);
    }
  }
  const imageByValue = new Map<number, string>();
  const valueIdList = Array.from(neededValueIds);
  for (let i = 0; i < valueIdList.length; i += 100) {
    const chunk = await callKw<Array<{ id: number; image: string | false }>>(
      "product.attribute.value",
      "read",
      [valueIdList.slice(i, i + 100)],
      { fields: ["id", "image"] },
    );
    for (const c of chunk) {
      if (c.image !== false) imageByValue.set(c.id, c.image);
    }
  }

  byTemplate.forEach((list) =>
    list.forEach((v) => {
      let img = imageBySku.get(v.id) ?? "";
      if (!img) {
        for (const ptav of ptavBySku.get(v.id) ?? []) {
          const rawId = rawValueOf.get(ptav);
          const valueImg = rawId ? imageByValue.get(rawId) : undefined;
          if (valueImg) { img = valueImg; break; }
        }
      }
      v.image = img;
    }),
  );

  return byTemplate;
}

// ── Product packaging ─────────────────────────────────────────────────────────
//
// This Odoo instance has no `product.packaging` model — that model was
// retired in favor of representing pack sizes as extra Units of Measure.
// A template's sellable pack sizes live in `product.template.uom_ids`
// (many2many → uom.uom), set from the product form's Sales tab
// ("Upsell & Cross-Sell" → "Packaging"). Each uom.uom carries
// `relative_factor` — how many of `relative_uom_id` make up one of this
// unit (e.g. "صندوق 60" has relative_factor=60, relative_uom_id=Units, i.e.
// a box holds 60 pieces). We read relative_factor directly as the pack
// qty; for a uom chained off something other than the product's own base
// unit (e.g. a "دزينة" defined relative to "قطعة" rather than "Units"),
// this is an approximation — good enough for a quantity shortcut chip,
// not exact unit conversion.
//
// Verified live against this Odoo (2026-07-17): `ir.model` lookups are
// blocked for the API user, and `product.packaging` raises "Object
// product.packaging doesn't exist" even though stock/sale_stock/
// website_sale are all installed — confirming the model is genuinely gone
// in this Odoo version, not just a disabled feature or wrong DB.

export type OdooPackaging = {
  id: number;
  templateId: number;
  name: string;
  qty: number;
};

type RawUom = {
  id: number;
  name: string;
  relative_factor: number;
};

/// Fetches each template's extra Units of Measure (Odoo's stand-in for
/// sellable pack sizes) and returns them keyed by template id. Returns an
/// empty map (rather than throwing) only when a template simply has none —
/// real Odoo errors propagate so a sync failure is never silently hidden as
/// "no packaging".
export async function fetchOdooPackagingsByTemplate(
  templateIds: number[],
): Promise<Map<number, OdooPackaging[]>> {
  const byTemplate = new Map<number, OdooPackaging[]>();
  if (templateIds.length === 0) return byTemplate;

  const uomIdsByTemplate = new Map<number, number[]>();
  const allUomIds = new Set<number>();
  for (let i = 0; i < templateIds.length; i += 200) {
    const chunk = await callKw<Array<{ id: number; uom_ids: number[] }>>(
      "product.template",
      "read",
      [templateIds.slice(i, i + 200)],
      { fields: ["id", "uom_ids"] },
    );
    for (const t of chunk) {
      if (!t.uom_ids?.length) continue;
      uomIdsByTemplate.set(t.id, t.uom_ids);
      t.uom_ids.forEach((id) => allUomIds.add(id));
    }
  }
  if (allUomIds.size === 0) return byTemplate;

  const uomById = new Map<number, RawUom>();
  const uomIdList = Array.from(allUomIds);
  for (let i = 0; i < uomIdList.length; i += 200) {
    const chunk = await callKw<RawUom[]>(
      "uom.uom",
      "read",
      [uomIdList.slice(i, i + 200)],
      { fields: ["id", "name", "relative_factor"], context: langCtx },
    );
    for (const u of chunk) uomById.set(u.id, u);
  }

  uomIdsByTemplate.forEach((uomIds, tid) => {
    const list: OdooPackaging[] = [];
    for (const uid of uomIds) {
      const u = uomById.get(uid);
      if (!u) continue;
      list.push({ id: u.id, templateId: tid, name: u.name, qty: Math.max(1, Math.round(u.relative_factor)) });
    }
    list.sort((a, b) => a.qty - b.qty);
    byTemplate.set(tid, list);
  });

  return byTemplate;
}

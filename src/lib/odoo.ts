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
  image_128: string | false;
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
        "weight", "volume", "image_128",
      ],
      limit: 500,
      order: "name asc",
    },
  );
}

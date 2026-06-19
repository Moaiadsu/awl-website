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
};

export type OdooProduct = {
  id: number;
  name: string;
  list_price: number;
  qty_available: number;
  barcode: string | false;
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

// ── Public fetch functions ────────────────────────────────────────────────────

export async function fetchOdooContacts(): Promise<OdooContact[]> {
  return callKw<OdooContact[]>(
    "res.partner",
    "search_read",
    [[["active", "=", true]]],
    {
      fields: ["id", "name", "email", "phone"],
      limit: 500,
      order: "name asc",
    },
  );
}

export async function fetchOdooProducts(): Promise<OdooProduct[]> {
  return callKw<OdooProduct[]>(
    "product.template",
    "search_read",
    [[["sale_ok", "=", true]]],
    {
      fields: ["id", "name", "list_price", "qty_available", "barcode"],
      limit: 500,
      order: "name asc",
    },
  );
}

// Reads Odoo's product.template.attribute.line for every multi-variant
// template and outputs JSON linking each Product ID to its exact
// Attribute → Values pairs, e.g. { attribute: "brown", values: ["12"] }.
//
// Model map:
//   product.template.attribute.line — one row per (template, attribute):
//     product_tmpl_id  [id, name]   the parent product
//     attribute_id     [id, name]   the attribute axis   (e.g. "brown")
//     value_ids        number[]     product.attribute.value ids (e.g. "12")
//   product.attribute.value — the raw configured values (name field)

const url = (process.env.ODOO_URL ?? "").replace(/\/(odoo|web)(\/.*)?$/, "").replace(/\/$/, "");
const db = process.env.ODOO_DB;
const user = process.env.ODOO_USERNAME ?? process.env.ODOO_EMAIL;
const key = process.env.ODOO_API_KEY;

async function rpc(service, method, args) {
  const r = await fetch(url + "/jsonrpc", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", method: "call", id: 1, params: { service, method, args } }),
  });
  const j = await r.json();
  if (j.error) throw new Error(j.error.data?.message ?? j.error.message);
  return j.result;
}

const uid = await rpc("common", "authenticate", [db, user, key, {}]);
const kw = (model, method, args, kwargs = {}) =>
  rpc("object", "execute_kw", [db, uid, key, model, method, args, kwargs]);

// 1. Every attribute line in the system (each = one attribute axis on a template).
const lines = await kw("product.template.attribute.line", "search_read", [[]], {
  fields: ["product_tmpl_id", "attribute_id", "value_ids"],
  limit: 5000,
});

// 2. Resolve raw value ids -> names in one read.
const valueIds = [...new Set(lines.flatMap((l) => l.value_ids))];
const valueName = new Map();
for (let i = 0; i < valueIds.length; i += 500) {
  const chunk = await kw("product.attribute.value", "read", [valueIds.slice(i, i + 500)], {
    fields: ["id", "name"],
  });
  chunk.forEach((v) => valueName.set(v.id, v.name));
}

// 3. Group lines per template -> the requested JSON shape.
const byProduct = new Map();
for (const l of lines) {
  const [pid, pname] = l.product_tmpl_id;
  const entry = byProduct.get(pid) ?? { product_id: pid, product_name: pname, attributes: [] };
  entry.attributes.push({
    attribute_id: l.attribute_id[0],
    attribute: l.attribute_id[1],
    value_ids: l.value_ids,
    values: l.value_ids.map((id) => valueName.get(id) ?? `#${id}`),
  });
  byProduct.set(pid, entry);
}

const out = [...byProduct.values()];
console.log("templates with attribute lines:", out.length);
// Distinct attribute names — shows how attributes are actually named in this DB.
const attrNames = [...new Set(lines.map((l) => l.attribute_id[1]))];
console.log("distinct attributes:", attrNames.length, JSON.stringify(attrNames.slice(0, 15), null, 0));
console.log(JSON.stringify(out.slice(0, 5), null, 2));

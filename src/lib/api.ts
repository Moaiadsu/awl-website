import Cookies from "js-cookie";

// ── Auth ─────────────────────────────────────────────────────────────────────
export const adminLogin  = (token: string) => Cookies.set("token", token, { expires: 1 });
export const adminLogout = () => { Cookies.remove("token"); window.location.href = "/login"; };
export const isLoggedIn  = () => !!Cookies.get("token");

function authHeader(): HeadersInit {
  const token = Cookies.get("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

// ── Core RPC fetch ────────────────────────────────────────────────────────────
async function rpc<T>(service: string, method: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}/${service}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(body),
  });
  if (res.status === 401) {
    adminLogout();
    throw new Error("انتهت الجلسة — يرجى تسجيل الدخول مجدداً");
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `خطأ ${res.status}`);
  }
  return res.json();
}

// ── Normalisers (proto camelCase + enum strings → frontend conventions) ───────

// Proto enum → plain string for UserStatus
const USER_STATUS: Record<string, string> = {
  USER_STATUS_PENDING:            "pending",
  USER_STATUS_APPROVED:           "approved",
  USER_STATUS_REJECTED:           "rejected",
  // numeric fallbacks (ConnectRPC JSON may send the integer)
  "1":                            "pending",
  "2":                            "approved",
  "3":                            "rejected",
};

// Proto enum → plain string for OrderStatus
const ORDER_STATUS: Record<string, string> = {
  ORDER_STATUS_PENDING:           "pending",
  ORDER_STATUS_CONFIRMED:         "confirmed",
  ORDER_STATUS_SHIPPED:           "shipped",
  ORDER_STATUS_DELIVERED:         "delivered",
  ORDER_STATUS_CANCELLED:         "cancelled",
  "1":                            "pending",
  "2":                            "confirmed",
  "3":                            "shipped",
  "4":                            "delivered",
  "5":                            "cancelled",
};

function normMerchant(m: any) {
  return {
    id:         m.id,
    store_name: m.storeName  ?? m.store_name  ?? "",
    owner_name: m.ownerName  ?? m.owner_name  ?? "",
    city:       m.city       ?? "",
    phone:      m.phone      ?? "",
    status:     USER_STATUS[String(m.status)] ?? m.status ?? "pending",
    created_at: m.createdAt  ?? m.created_at  ?? "",
  };
}

const PAYMENT_METHOD: Record<string, string> = {
  PAYMENT_METHOD_COD:   "cod",
  PAYMENT_METHOD_SADAD: "sadad",
  PAYMENT_METHOD_CHECK: "check",
  "1": "cod", "2": "sadad", "3": "check",
};

function normOrder(o: any) {
  return {
    id:           o.id,
    user_id:      o.userId       ?? o.user_id      ?? "",
    total_amount: o.totalAmount  ?? o.total_amount  ?? 0,
    status:       ORDER_STATUS[String(o.status)] ?? o.status ?? "pending",
    address:      o.address      ?? "",
    note:         o.note         ?? "",
    created_at:   o.createdAt    ?? o.created_at    ?? "",
    updated_at:   o.updatedAt    ?? o.updated_at    ?? "",
    coupon_code:  o.couponCode   ?? o.coupon_code   ?? "",
    discount:     o.discount     ?? 0,
    payment_method: PAYMENT_METHOD[String(o.paymentMethod ?? o.payment_method ?? "")] ?? "",
    items:        (o.items ?? []).map((it: any) => ({
      product_id:   it.productId   ?? it.product_id,
      product_name: it.productName ?? it.product_name ?? "",
      qty:          it.qty         ?? 0,
      unit_price:   it.unitPrice   ?? it.unit_price   ?? 0,
      total:        it.total       ?? 0,
      unit_label:   it.unitLabel   ?? it.unit_label   ?? "",
    })),
  };
}

function normProduct(p: any) {
  return {
    id:          p.id,
    name:        p.name        ?? "",
    name_ar:     p.nameAr      ?? p.name_ar     ?? "",
    category:    p.category    ?? "",
    price:       p.price       ?? 0,
    unit:        p.unit        ?? "",
    min_qty:     p.minQty      ?? p.min_qty      ?? 1,
    stock:       p.stock       ?? 0,
    description: p.description ?? "",
    image_url:   p.imageUrl    ?? p.image_url    ?? "",
    barcode:     p.barcode     ?? "",
    variants:    (p.variants ?? []).map((v: any) => ({
      id:        v.id,
      label:     v.label     ?? "",
      label_ar:  v.labelAr   ?? v.label_ar ?? "",
      price:     v.price     ?? 0,
      stock:     v.stock     ?? 0,
      barcode:   v.barcode   ?? "",
      image_url: v.imageUrl  ?? v.image_url ?? "",
    })),
  };
}

// ── Merchants (UserService) ───────────────────────────────────────────────────
export const getMerchants = () =>
  rpc<{ merchants: any[] }>("awl.v1.UserService", "ListMerchants", { statusFilter: 0 })
    .then((r) => (r.merchants ?? []).map(normMerchant));

export const updateMerchantStatus = (
  merchantId: string,
  status: "approved" | "rejected" | "pending",
) => {
  const statusMap: Record<string, number> = { pending: 1, approved: 2, rejected: 3 };
  return rpc("awl.v1.UserService", "UpdateMerchantStatus", {
    merchantId,
    status: statusMap[status] ?? 1,
  });
};

// Deletes the merchant from the app database (backend) AND from Odoo.
// The Odoo step never blocks the app-side delete: a merchant that was never
// synced simply isn't found there.
export const deleteMerchantEverywhere = async (m: {
  id: string;
  store_name: string;
  phone: string;
}): Promise<{ odoo: "deleted" | "archived" | "not-found" | "error" }> => {
  await rpc("awl.v1.UserService", "DeleteMerchant", { merchantId: m.id });

  try {
    const res = await fetch("/api/dashboard/contacts/delete-by-identity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: m.store_name, phone: m.phone || undefined }),
    });
    const data = await res.json();
    if (!res.ok) return { odoo: "error" };
    if (!data.found) return { odoo: "not-found" };
    return { odoo: data.mode === "archived" ? "archived" : "deleted" };
  } catch {
    return { odoo: "error" };
  }
};

// ── Trending (ProductService) ─────────────────────────────────────────────────
// Admin-curated "trending" selection shown in the mobile app, with a signed
// percentage (+ up / − down).
export const getTrending = (): Promise<Map<string, number>> =>
  rpc<{ items?: { product: any; percent?: number }[] }>(
    "awl.v1.ProductService", "ListTrending", {},
  ).then((r) => new Map((r.items ?? []).map((i) => [i.product.id as string, i.percent ?? 0])));

export const setTrending = (productId: string, percent: number) =>
  rpc("awl.v1.ProductService", "SetTrending", { productId, percent });

export const removeTrending = (productId: string) =>
  rpc("awl.v1.ProductService", "RemoveTrending", { productId });

// ── Offers (ProductService) ───────────────────────────────────────────────────
// Admin-curated discount offers shown in the mobile app (percent = discount %).
export const getOffers = (): Promise<Map<string, number>> =>
  rpc<{ items?: { product: any; percent?: number }[] }>(
    "awl.v1.ProductService", "ListOffers", {},
  ).then((r) => new Map((r.items ?? []).map((i) => [i.product.id as string, i.percent ?? 0])));

export const setOffer = (productId: string, percent: number) =>
  rpc("awl.v1.ProductService", "SetOffer", { productId, percent });

export const removeOffer = (productId: string) =>
  rpc("awl.v1.ProductService", "RemoveOffer", { productId });

// ── Orders (OrderService) ─────────────────────────────────────────────────────
export const getAllOrders = () =>
  rpc<{ orders: any[] }>("awl.v1.OrderService", "ListAllOrders", { statusFilter: 0 })
    .then((r) => (r.orders ?? []).map(normOrder));

export const updateOrderStatus = (orderId: string, status: string) => {
  const statusMap: Record<string, number> = {
    pending: 1, confirmed: 2, shipped: 3, delivered: 4, cancelled: 5,
  };
  return rpc("awl.v1.OrderService", "UpdateOrderStatus", {
    orderId,
    status: statusMap[status] ?? 1,
  });
};

// ── Products (ProductService) ─────────────────────────────────────────────────
// ── OTP delivery log ──────────────────────────────────────────────────────────

export type OtpLogRow = {
  id: string;
  phone: string;
  provider: string; // "resala" | "local"
  env: string;      // "test" | "live"
  event: string;    // "sent" | "send_failed" | "verified" | "verify_failed"
  detail: string;
  created_at: string;
};

export const getOtpLogs = (): Promise<OtpLogRow[]> =>
  rpc<{ logs: any[] }>("awl.v1.AuthService", "ListOtpLogs", {})
    .then((r) => (r.logs ?? []).map((l: any) => ({
      id: l.id, phone: l.phone ?? "", provider: l.provider ?? "",
      env: l.env ?? "", event: l.event ?? "", detail: l.detail ?? "",
      created_at: l.createdAt ?? "",
    })));

// ── Market index (weighted product basket) ────────────────────────────────────

export type IndexComponentRow = {
  product_id: string;
  weight: number;
  product_name: string;
  price: number;        // catalog (old) price
  manual_price: number; // admin-entered market price
};

export const getMarketIndexConfig = () =>
  rpc<{ components?: any[]; currentValue?: number }>(
    "awl.v1.ProductService", "GetMarketIndexConfig", {},
  ).then((r) => ({
    components: (r.components ?? []).map((c: any) => ({
      product_id: c.productId ?? "",
      weight: c.weight ?? 1,
      product_name: c.productName ?? "",
      price: c.price ?? 0,
      manual_price: c.manualPrice ?? 0,
    })) as IndexComponentRow[],
    current_value: r.currentValue ?? 0,
  }));

export const setMarketIndex = (
  components: { product_id: string; weight: number; manual_price: number }[],
) =>
  rpc<{ value?: number }>("awl.v1.ProductService", "SetMarketIndex", {
    components: components.map((c) => ({
      productId: c.product_id,
      weight: c.weight,
      manualPrice: c.manual_price,
    })),
  });

export const getMarketIndexHistory = () =>
  rpc<{ value?: number; previousValue?: number; updatedAt?: string; history?: any[] }>(
    "awl.v1.ProductService", "GetMarketIndex", {},
  ).then((r) => ({
    value: r.value ?? 0,
    previous_value: r.previousValue ?? 0,
    updated_at: r.updatedAt ?? "",
    history: (r.history ?? []).map((h: any) => ({
      value: h.value ?? 0,
      created_at: h.createdAt ?? "",
    })),
  }));

// ── Payments (buyer settlements awaiting confirmation) ────────────────────────

export type PaymentRow = {
  id: string;
  user_id: string;
  order_id: string;
  method: "cod" | "sadad" | "check" | "";
  reference: string;
  image_url: string;
  amount: number;
  status: "pending" | "confirmed" | "rejected" | "";
  created_at: string;
  store_name: string;
};

function normPayment(p: any): PaymentRow {
  const method =
    p.method === "PAYMENT_METHOD_COD" ? "cod"
    : p.method === "PAYMENT_METHOD_SADAD" ? "sadad"
    : p.method === "PAYMENT_METHOD_CHECK" ? "check" : "";
  const status =
    p.status === "PAYMENT_STATUS_PENDING" ? "pending"
    : p.status === "PAYMENT_STATUS_CONFIRMED" ? "confirmed"
    : p.status === "PAYMENT_STATUS_REJECTED" ? "rejected" : "";
  return {
    id: p.id, user_id: p.userId ?? "", order_id: p.orderId ?? "",
    method, reference: p.reference ?? "", image_url: p.imageUrl ?? "",
    amount: p.amount ?? 0, status, created_at: p.createdAt ?? "",
    store_name: p.storeName ?? "",
  };
}

export const getPayments = (status?: "pending" | "confirmed" | "rejected") =>
  rpc<{ payments: any[] }>("awl.v1.OrderService", "ListPayments", {
    statusFilter:
      status === "pending" ? "PAYMENT_STATUS_PENDING"
      : status === "confirmed" ? "PAYMENT_STATUS_CONFIRMED"
      : status === "rejected" ? "PAYMENT_STATUS_REJECTED"
      : "PAYMENT_STATUS_UNSPECIFIED",
  }).then((r) => (r.payments ?? []).map(normPayment));

export const confirmPayment = (paymentId: string, amount: number) =>
  rpc<any>("awl.v1.OrderService", "ConfirmPayment", { paymentId, amount })
    .then(normPayment);

export const rejectPayment = (paymentId: string) =>
  rpc<any>("awl.v1.OrderService", "RejectPayment", { paymentId })
    .then(normPayment);

// Variants are imported from Odoo only (admin sync) — every sync fully
// overwrites the catalog, so there is deliberately no API here to create or
// edit them: the dashboard can never hold variant data that Odoo doesn't have.
export const getProducts = () =>
  rpc<{ products: any[] }>("awl.v1.ProductService", "ListProducts", {})
    .then((r) => (r.products ?? []).map(normProduct));

// ── Odoo mirror (routed through Next API handlers) ────────────────────────────

export type OdooContactRow = {
  id: number;
  name: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state_name: string;
  country_name: string;
  vat: string;
  website: string;
  lang: string;
  salesperson: string;
  company_type: "company" | "person";
  customer_rank: number;
  supplier_rank: number;
};

export type OdooProductRow = {
  id: number;
  name: string;
  list_price: number;
  standard_price: number;
  qty_available: number;
  barcode: string;
  default_code: string;
  categ_name: string;
  type: string;
  description_sale: string;
  sale_ok: boolean;
  purchase_ok: boolean;
  weight: number;
  volume: number;
  image_128: string;
  variant_count: number;
};

export const getOdooContacts = (): Promise<{ data: OdooContactRow[]; synced_at: string; error?: string }> =>
  fetch("/api/dashboard/contacts", { cache: "no-store" }).then((r) => r.json());

export const syncOdooContacts = (): Promise<{
  data: OdooContactRow[];
  synced_at: string;
  count: number;
  error?: string;
}> => fetch("/api/dashboard/contacts", { method: "POST" }).then((r) => r.json());

export const getOdooProducts = (): Promise<{ data: OdooProductRow[]; synced_at: string; error?: string }> =>
  fetch("/api/dashboard/products", { cache: "no-store" }).then((r) => r.json());

export type NewContactPayload = {
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
  job_position?: string;
  comment?: string;
  ref?: string;
  company_type?: "company" | "person";
  is_customer?: boolean;
  is_vendor?: boolean;
};

export const deleteOdooContact = (
  id: number,
): Promise<{ ok?: boolean; error?: string }> =>
  fetch(`/api/dashboard/contacts/${id}`, { method: "DELETE" }).then((r) => r.json());

export const createOdooContact = (
  data: NewContactPayload,
): Promise<{ id?: number; alreadyExists?: boolean; error?: string }> =>
  fetch("/api/dashboard/contacts/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: data.name,
      ...(data.email        && { email:        data.email }),
      ...(data.phone        && { phone:        data.phone }),
      ...(data.street       && { street:       data.street }),
      ...(data.street2      && { street2:      data.street2 }),
      ...(data.city         && { city:         data.city }),
      ...(data.zip          && { zip:          data.zip }),
      ...(data.vat          && { vat:          data.vat }),
      ...(data.website      && { website:      data.website }),
      ...(data.lang         && { lang:         data.lang }),
      ...(data.job_position && { function:     data.job_position }),
      ...(data.comment      && { comment:      data.comment }),
      ...(data.ref          && { ref:          data.ref }),
      company_type:  data.company_type ?? "person",
      customer_rank: data.is_customer ? 1 : 0,
      supplier_rank: data.is_vendor   ? 1 : 0,
    }),
  }).then((r) => r.json());

export const syncOdooProducts = (): Promise<{
  data: OdooProductRow[];
  synced_at: string;
  count: number;
  error?: string;
}> => fetch("/api/dashboard/products", { method: "POST" }).then((r) => r.json());

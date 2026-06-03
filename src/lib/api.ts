// All RPC calls go through ConnectRPC transport (gRPC-Web binary protocol).
// Generated service clients live in src/gen/ — run `make generate` once to create them.
//
// import { UserService }    from "@/gen/user_connect";
// import { OrderService }   from "@/gen/order_connect";
// import { ProductService } from "@/gen/product_connect";
// import { createClient }   from "@connectrpc/connect";
// import { transport }      from "@/lib/transport";
//
// const userClient    = createClient(UserService,    transport);
// const orderClient   = createClient(OrderService,   transport);
// const productClient = createClient(ProductService, transport);
//
// Until stubs are generated (make generate), the calls below use a thin
// fetch wrapper that sets the Authorization header from the cookie.

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

// ── ConnectRPC JSON fallback (replaced by generated typed clients post-generate) ──
// ConnectRPC POST /ServiceName/MethodName with JSON body.
async function rpc<T>(service: string, method: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}/${service}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `RPC error ${res.status}`);
  }
  return res.json();
}

// ── Merchants (UserService) ───────────────────────────────────────────────────
export const getMerchants = () =>
  rpc<{ merchants: any[] }>("awl.v1.UserService", "ListMerchants", { statusFilter: 0 })
    .then((r) => r.merchants ?? []);

export const updateMerchantStatus = (merchantId: string, status: "approved" | "rejected" | "pending") => {
  const statusMap: Record<string, number> = { pending: 1, approved: 2, rejected: 3 };
  return rpc("awl.v1.UserService", "UpdateMerchantStatus", {
    merchantId,
    status: statusMap[status] ?? 1,
  });
};

// ── Orders (OrderService) ─────────────────────────────────────────────────────
export const getAllOrders = () =>
  rpc<{ orders: any[] }>("awl.v1.OrderService", "ListAllOrders", { statusFilter: 0 })
    .then((r) => r.orders ?? []);

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
export const getProducts = () =>
  rpc<{ products: any[] }>("awl.v1.ProductService", "ListProducts", {})
    .then((r) => r.products ?? []);

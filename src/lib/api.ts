import axios from "axios";
import Cookies from "js-cookie";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080",
});

api.interceptors.request.use((config) => {
  const token = Cookies.get("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      Cookies.remove("token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// Auth
export const adminLogin = (token: string) => Cookies.set("token", token, { expires: 1 });
export const adminLogout = () => { Cookies.remove("token"); window.location.href = "/login"; };
export const isLoggedIn = () => !!Cookies.get("token");

// Merchants
export const getMerchants = () => api.get("/admin/merchants").then((r) => r.data.merchants ?? []);
export const updateMerchantStatus = (id: string, status: "approved" | "rejected" | "pending") =>
  api.patch(`/admin/merchants/${id}/status`, { status }).then((r) => r.data);

// Orders
export const getAllOrders = () => api.get("/admin/orders").then((r) => r.data.orders ?? []);
export const updateOrderStatus = (id: string, status: string) =>
  api.patch(`/admin/orders/${id}/status`, { status }).then((r) => r.data);

// Products (read-only in admin for now)
export const getProducts = () => api.get("/products").then((r) => r.data.products ?? []);

export default api;

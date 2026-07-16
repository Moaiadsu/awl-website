"use client";
import { useEffect, useMemo, useState } from "react";
import { getAllOrders, updateOrderStatus, getMerchants } from "@/lib/api";
import PaymentsPanel from "@/components/PaymentsPanel";
import { SkeletonRows } from "@/components/ui/Skeleton";
import {
  Search, ShoppingBag, Wallet, ChevronDown, ChevronUp,
  MapPin, StickyNote, Tag, Banknote, Smartphone, Receipt, Phone,
} from "lucide-react";

type OrderItem = {
  product_id: string;
  product_name: string;
  qty: number;
  unit_price: number;
  total: number;
  unit_label: string;
};

type Order = {
  id: string;
  user_id: string;
  total_amount: number;
  status: string;
  address: string;
  note: string;
  created_at: string;
  coupon_code: string;
  discount: number;
  payment_method: string;
  items: OrderItem[];
};

type Merchant = { id: string; store_name: string; phone: string; city: string };

type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";

const ORDER_STATUSES: OrderStatus[] = [
  "pending", "confirmed", "shipped", "delivered", "cancelled",
];

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "قيد الانتظار",
  confirmed: "مؤكد",
  shipped: "تم الشحن",
  delivered: "تم التسليم",
  cancelled: "ملغي",
};

const FILTER_LABELS: Record<string, string> = { all: "الكل", ...STATUS_LABELS };

const PM_LABEL: Record<string, { label: string; icon: React.ReactNode }> = {
  cod:   { label: "الدفع عند الاستلام", icon: <Banknote size={12} /> },
  sadad: { label: "سداد",              icon: <Smartphone size={12} /> },
  check: { label: "تحويل مصرفي",        icon: <Receipt size={12} /> },
};

export default function OrdersPage() {
  const [tab, setTab] = useState<"orders" | "payments">("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [merchants, setMerchants] = useState<Map<string, Merchant>>(new Map());
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    Promise.allSettled([
      getAllOrders().then(setOrders),
      getMerchants().then((ms: any[]) =>
        setMerchants(new Map(ms.map((m) => [m.id, m as Merchant])))),
    ]).then(() => setLoading(false));
  };
  // Refresh after a status change without re-showing the skeleton — only the
  // very first load should look like a fresh page.
  const refresh = () => {
    getAllOrders().then(setOrders).catch(() => {});
    getMerchants()
      .then((ms: any[]) => setMerchants(new Map(ms.map((m) => [m.id, m as Merchant]))))
      .catch(() => {});
  };

  useEffect(load, []);

  const handle = async (id: string, status: string) => {
    await updateOrderStatus(id, status);
    refresh();
  };

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: orders.length };
    ORDER_STATUSES.forEach((s) => (c[s] = 0));
    orders.forEach((o) => {
      if (c[o.status] != null) c[o.status]++;
    });
    return c;
  }, [orders]);

  const shown = useMemo(() => {
    let list = filter === "all" ? orders : orders.filter((o) => o.status === filter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((o) => {
        const m = merchants.get(o.user_id);
        return (
          o.id?.toLowerCase().includes(q) ||
          o.address?.toLowerCase().includes(q) ||
          m?.store_name?.toLowerCase().includes(q) ||
          m?.phone?.includes(q)
        );
      });
    }
    return list;
  }, [orders, filter, search, merchants]);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>

      {/* ── PAGE HEADER ─────────────────────────────────── */}
      <div style={{
        background: "linear-gradient(145deg, #ffffff 0%, #EEF5FF 100%)",
        borderRadius: 16, border: "1px solid rgba(14,165,233,0.12)",
        boxShadow: "0 4px 20px rgba(10,22,40,0.07)",
        padding: "20px 24px", marginBottom: 18,
        display: "flex", alignItems: "center", gap: 14,
      }}>
        <div style={{ width: 46, height: 46, borderRadius: 13, background: "rgba(14,165,233,0.10)", border: "1.5px solid rgba(14,165,233,0.20)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <ShoppingBag size={22} color="#0EA5E9" />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "#0A1628" }}>إدارة الطلبات</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, color: "#94A3B8" }}>تتبع الطلبات والمدفوعات وتفاصيل التوصيل</span>
            {counts["pending"] > 0 && (
              <span style={{ fontSize: 11, fontWeight: 700, background: "rgba(245,158,11,0.08)", color: "#B45309", border: "1px solid rgba(245,158,11,0.18)", padding: "2px 8px", borderRadius: 9999 }}>
                {counts["pending"]} معلق
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── SUB-TABS: orders / payments ───────────────────── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        {([
          ["orders", "الطلبات", <ShoppingBag key="o" size={15} />],
          ["payments", "المدفوعات", <Wallet key="p" size={15} />],
        ] as const).map(([key, label, icon]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              fontSize: 13.5, fontWeight: 800, padding: "10px 22px",
              borderRadius: 12, cursor: "pointer", fontFamily: "Cairo, sans-serif",
              background: tab === key ? "#0A1628" : "#fff",
              color: tab === key ? "#fff" : "#64748B",
              border: `1.5px solid ${tab === key ? "#0A1628" : "#E2E8F0"}`,
              transition: "all .15s",
            }}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {tab === "payments" ? (
        <PaymentsPanel />
      ) : (
        <>
          {/* ── TOOLBAR ─────────────────────────────────── */}
          <div style={{
            background: "linear-gradient(145deg, #ffffff 0%, #F4F8FF 100%)",
            borderRadius: 14, border: "1px solid rgba(14,165,233,0.10)",
            boxShadow: "0 2px 8px rgba(10,22,40,0.05)",
            padding: "14px 20px",
            display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
            marginBottom: 16,
          }}>
            <div style={{ position: "relative", flex: 1, minWidth: 220, maxWidth: 340 }}>
              <Search size={16} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#94A3B8", pointerEvents: "none" }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث: رقم الطلب، المتجر، الهاتف، العنوان..."
                style={{
                  height: 36, width: "100%", padding: "0 40px 0 12px",
                  border: "1.5px solid #E2E8F0", borderRadius: 8,
                  fontFamily: "Cairo, sans-serif", fontSize: 13.5,
                  color: "#1E293B", background: "#F8FAFC", outline: "none", direction: "rtl",
                }}
              />
            </div>
            <div style={{ width: 1, height: 24, background: "#E2E8F0" }} />
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {(["all", ...ORDER_STATUSES] as string[]).map((f) => {
                const active = filter === f;
                return (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    style={{
                      height: 32, padding: "0 12px", borderRadius: 8,
                      border: `1.5px solid ${active ? "#0A1628" : "#E2E8F0"}`,
                      fontFamily: "Cairo, sans-serif", fontSize: 12, fontWeight: 700,
                      color: active ? "#fff" : "#64748B",
                      background: active ? "#0A1628" : "#fff",
                      cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {FILTER_LABELS[f]}
                    <span style={{
                      padding: "1px 6px", borderRadius: 9999,
                      background: active ? "rgba(255,255,255,.2)" : "#F1F5F9",
                      color: active ? "#fff" : "#64748B",
                      fontSize: 10, fontWeight: 700,
                    }}>
                      {counts[f] ?? 0}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── ORDERS LIST (expandable cards) ─────────────── */}
          {loading ? (
            <SkeletonRows count={6} />
          ) : shown.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60, color: "#94A3B8", fontSize: 14 }}>
              لا توجد طلبات
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {shown.map((o) => {
                const m = merchants.get(o.user_id);
                const open = expanded === o.id;
                const pm = PM_LABEL[o.payment_method];
                return (
                  <div key={o.id} style={{
                    background: "linear-gradient(145deg, #ffffff 0%, #F5F9FF 100%)",
                    borderRadius: 14,
                    border: `1.5px solid ${open ? "rgba(14,165,233,0.30)" : "rgba(14,165,233,0.10)"}`,
                    boxShadow: open ? "0 8px 28px rgba(10,22,40,0.10)" : "0 2px 8px rgba(10,22,40,0.05)",
                    overflow: "hidden",
                  }}>
                    {/* ── Row header ── */}
                    <div
                      onClick={() => setExpanded(open ? null : o.id)}
                      style={{
                        padding: "13px 18px", display: "flex", alignItems: "center",
                        gap: 14, cursor: "pointer", flexWrap: "wrap",
                      }}
                    >
                      <div style={{ minWidth: 90 }}>
                        <div style={{ fontWeight: 800, color: "#0A1628", fontFamily: "Courier New, monospace", direction: "ltr", textAlign: "right", fontSize: 13 }}>
                          #{o.id?.slice(0, 8)}
                        </div>
                        <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>
                          {o.items?.length ?? 0} عنصر · {formatDate(o.created_at)}
                        </div>
                      </div>

                      {/* Merchant identity */}
                      <div style={{ flex: 1, minWidth: 160 }}>
                        <div style={{ fontWeight: 800, color: "#0A1628", fontSize: 13.5 }}>
                          {m?.store_name || "تاجر غير معروف"}
                        </div>
                        <div style={{ fontSize: 11.5, color: "#64748B", display: "flex", gap: 10, marginTop: 2, flexWrap: "wrap" }}>
                          {m?.phone && (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                              <Phone size={10} /> <span dir="ltr">{m.phone}</span>
                            </span>
                          )}
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                            <MapPin size={10} /> {o.address || m?.city || "—"}
                          </span>
                        </div>
                      </div>

                      {pm && (
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 4,
                          fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 9999,
                          background: "#F0F9FF", color: "#0284C7", border: "1px solid rgba(14,165,233,0.18)",
                        }}>
                          {pm.icon} {pm.label}
                        </span>
                      )}

                      <span style={{ fontWeight: 900, color: "#0EA5E9", direction: "ltr", fontSize: 15 }}>
                        {o.total_amount.toFixed(2)} د.ل
                      </span>

                      <OrderStatusBadge status={o.status} />

                      <select
                        value={o.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => handle(o.id, e.target.value)}
                        style={{
                          height: 32, padding: "0 10px",
                          border: "1.5px solid #E2E8F0", borderRadius: 8,
                          fontFamily: "Cairo, sans-serif", fontSize: 12, fontWeight: 600,
                          color: "#475569", background: "#fff", outline: "none", cursor: "pointer",
                        }}
                      >
                        {ORDER_STATUSES.map((s) => (
                          <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                        ))}
                      </select>

                      {open ? <ChevronUp size={16} color="#94A3B8" /> : <ChevronDown size={16} color="#94A3B8" />}
                    </div>

                    {/* ── Expanded details ── */}
                    {open && (
                      <div style={{ borderTop: "1px solid rgba(14,165,233,0.10)", padding: "16px 18px", background: "#FDFEFF" }}>
                        {/* Delivery + note */}
                        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
                          <InfoBox icon={<MapPin size={14} color="#0284C7" />} title="عنوان التوصيل">
                            {o.address || "—"}
                          </InfoBox>
                          {o.note && (
                            <InfoBox icon={<StickyNote size={14} color="#B45309" />} title="ملاحظات التاجر">
                              {o.note}
                            </InfoBox>
                          )}
                          {o.coupon_code && (
                            <InfoBox icon={<Tag size={14} color="#15803D" />} title="كود الخصم">
                              <span dir="ltr">{o.coupon_code}</span> — خصم {o.discount.toFixed(2)} د.ل
                            </InfoBox>
                          )}
                        </div>

                        {/* Items table */}
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
                          <thead>
                            <tr style={{ background: "#F8FBFF", color: "#64748B", fontSize: 11 }}>
                              <th style={thd}>المنتج</th>
                              <th style={thd}>الوحدة</th>
                              <th style={thd}>الكمية</th>
                              <th style={thd}>سعر الوحدة</th>
                              <th style={thd}>الإجمالي</th>
                            </tr>
                          </thead>
                          <tbody>
                            {o.items.map((it, i) => (
                              <tr key={i} style={{ borderTop: "1px solid #F1F5F9" }}>
                                <td style={tdd}>{it.product_name}</td>
                                <td style={tdd}>{it.unit_label || "—"}</td>
                                <td style={{ ...tdd, direction: "ltr", textAlign: "right" }}>{it.qty}</td>
                                <td style={{ ...tdd, direction: "ltr", textAlign: "right" }}>{it.unit_price.toFixed(2)}</td>
                                <td style={{ ...tdd, direction: "ltr", textAlign: "right", fontWeight: 800, color: "#0A1628" }}>{it.total.toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            {o.discount > 0 && (
                              <tr style={{ borderTop: "1px solid #F1F5F9" }}>
                                <td colSpan={4} style={{ ...tdd, color: "#15803D", fontWeight: 700 }}>الخصم ({o.coupon_code})</td>
                                <td style={{ ...tdd, direction: "ltr", textAlign: "right", color: "#15803D", fontWeight: 800 }}>-{o.discount.toFixed(2)}</td>
                              </tr>
                            )}
                            <tr style={{ borderTop: "1.5px solid rgba(14,165,233,0.20)" }}>
                              <td colSpan={4} style={{ ...tdd, fontWeight: 900, color: "#0A1628" }}>الإجمالي</td>
                              <td style={{ ...tdd, direction: "ltr", textAlign: "right", fontWeight: 900, color: "#0EA5E9", fontSize: 14 }}>
                                {o.total_amount.toFixed(2)} د.ل
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

const thd: React.CSSProperties = { padding: "8px 12px", textAlign: "right", fontWeight: 800 };
const tdd: React.CSSProperties = { padding: "8px 12px", textAlign: "right", color: "#334155" };

function InfoBox({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div style={{
      flex: 1, minWidth: 220,
      background: "#fff", borderRadius: 10, padding: "10px 14px",
      border: "1px solid rgba(14,165,233,0.12)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 800, color: "#64748B", marginBottom: 4 }}>
        {icon} {title}
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#0A1628", lineHeight: 1.6 }}>
        {children}
      </div>
    </div>
  );
}

function formatDate(iso?: string): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

function OrderStatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; border: string; dot: string; label: string }> = {
    pending:   { bg: "#FEF3C7", color: "#B45309", border: "rgba(245,158,11,.3)", dot: "#F59E0B", label: "قيد الانتظار" },
    confirmed: { bg: "#E0F2FE", color: "#0284C7", border: "rgba(14,165,233,.3)", dot: "#0EA5E9", label: "مؤكد" },
    shipped:   { bg: "#F5F3FF", color: "#6D28D9", border: "#DDD6FE",             dot: "#7C3AED", label: "تم الشحن" },
    delivered: { bg: "#DCFCE7", color: "#15803D", border: "rgba(34,197,94,.3)",  dot: "#22C55E", label: "تم التسليم" },
    cancelled: { bg: "#FEE2E2", color: "#B91C1C", border: "rgba(239,68,68,.3)",  dot: "#EF4444", label: "ملغي" },
  };
  const s = map[status] ?? { bg: "#F1F5F9", color: "#475569", border: "#E2E8F0", dot: "#94A3B8", label: status };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 9999,
      background: s.bg, color: s.color, border: `1.5px solid ${s.border}`,
      fontSize: 12, fontWeight: 700, whiteSpace: "nowrap",
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
      {s.label}
    </span>
  );
}

"use client";
import { useEffect, useMemo, useState } from "react";
import { getAllOrders, updateOrderStatus } from "@/lib/api";
import { Search } from "lucide-react";

type Order = {
  id: string;
  user_id: string;
  total_amount: number;
  status: string;
  address: string;
  created_at: string;
  items: any[];
};

type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";

const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
];

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "قيد الانتظار",
  confirmed: "مؤكد",
  shipped: "تم الشحن",
  delivered: "تم التسليم",
  cancelled: "ملغي",
};

const FILTER_LABELS: Record<string, string> = {
  all: "الكل",
  ...STATUS_LABELS,
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const load = () => getAllOrders().then(setOrders).catch(() => {});

  useEffect(() => {
    load();
  }, []);

  const handle = async (id: string, status: string) => {
    await updateOrderStatus(id, status);
    load();
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
      list = list.filter(
        (o) =>
          o.id?.toLowerCase().includes(q) ||
          o.address?.toLowerCase().includes(q) ||
          o.user_id?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [orders, filter, search]);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      {/* ── TOOLBAR ─────────────────────────────────── */}
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          border: "1px solid #E2E8F0",
          boxShadow: "0 1px 2px rgba(15,23,42,.05)",
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 16,
        }}
      >
        <div style={{ position: "relative", flex: 1, minWidth: 220, maxWidth: 340 }}>
          <Search
            size={16}
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#94A3B8",
              pointerEvents: "none",
            }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="البحث في الطلبات..."
            style={{
              height: 36,
              width: "100%",
              padding: "0 40px 0 12px",
              border: "1.5px solid #E2E8F0",
              borderRadius: 8,
              fontFamily: "Cairo, sans-serif",
              fontSize: 14,
              color: "#1E293B",
              background: "#F8FAFC",
              outline: "none",
              direction: "rtl",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#0EA5E9";
              e.currentTarget.style.background = "#fff";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(14,165,233,.12)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "#E2E8F0";
              e.currentTarget.style.background = "#F8FAFC";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
        </div>

        <div style={{ width: 1, height: 24, background: "#E2E8F0" }} />

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#64748B" }}>الحالة:</span>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {(["all", ...ORDER_STATUSES] as string[]).map((f) => {
              const active = filter === f;
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    height: 32,
                    padding: "0 12px",
                    borderRadius: 8,
                    border: `1.5px solid ${active ? "#0A1628" : "#E2E8F0"}`,
                    fontFamily: "Cairo, sans-serif",
                    fontSize: 12,
                    fontWeight: 700,
                    color: active ? "#fff" : "#64748B",
                    background: active ? "#0A1628" : "#fff",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    whiteSpace: "nowrap",
                    transition: "all .15s",
                  }}
                >
                  {FILTER_LABELS[f]}
                  <span
                    style={{
                      padding: "1px 6px",
                      borderRadius: 9999,
                      background: active ? "rgba(255,255,255,.2)" : "#F1F5F9",
                      color: active ? "#fff" : "#64748B",
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  >
                    {counts[f] ?? 0}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── TABLE ─────────────────────────────────── */}
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          border: "1px solid #E2E8F0",
          boxShadow: "0 1px 2px rgba(15,23,42,.05)",
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead style={{ background: "#F1F5F9" }}>
              <tr style={{ borderBottom: "1px solid #E2E8F0" }}>
                <Th>رقم الطلب</Th>
                <Th>التاجر</Th>
                <Th width={140}>المبلغ</Th>
                <Th width={140}>الحالة</Th>
                <Th width={140}>التاريخ</Th>
                <Th width={170} center>
                  الإجراء
                </Th>
              </tr>
            </thead>
            <tbody>
              {shown.map((o) => (
                <tr
                  key={o.id}
                  style={{ borderBottom: "1px solid #F1F5F9", transition: "background .1s" }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.background = "#F8FAFC")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.background = "transparent")
                  }
                >
                  <Td>
                    <div
                      style={{
                        fontWeight: 700,
                        color: "#1E293B",
                        fontFamily: "Courier New, monospace",
                        direction: "ltr",
                        textAlign: "right",
                      }}
                    >
                      #{o.id?.slice(0, 8)}
                    </div>
                    <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>
                      {o.items?.length ?? 0} عنصر
                    </div>
                  </Td>
                  <Td>
                    <div style={{ color: "#475569", fontSize: 13 }}>
                      {o.address || "—"}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "#CBD5E1",
                        marginTop: 2,
                        fontFamily: "Courier New, monospace",
                        direction: "ltr",
                      }}
                    >
                      {o.user_id?.slice(0, 12)}
                    </div>
                  </Td>
                  <Td>
                    <span
                      style={{
                        fontWeight: 800,
                        color: "#0EA5E9",
                        direction: "ltr",
                        display: "inline-block",
                      }}
                    >
                      {o.total_amount} د.ل
                    </span>
                  </Td>
                  <Td>
                    <OrderStatusBadge status={o.status} />
                  </Td>
                  <Td>
                    <span
                      style={{
                        fontSize: 12,
                        color: "#94A3B8",
                        direction: "ltr",
                        display: "inline-block",
                      }}
                    >
                      {formatDate(o.created_at)}
                    </span>
                  </Td>
                  <Td center>
                    <select
                      value={o.status}
                      onChange={(e) => handle(o.id, e.target.value)}
                      style={{
                        height: 32,
                        padding: "0 12px",
                        paddingLeft: 28,
                        border: "1.5px solid #E2E8F0",
                        borderRadius: 8,
                        fontFamily: "Cairo, sans-serif",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#475569",
                        background: "#fff",
                        outline: "none",
                        cursor: "pointer",
                        appearance: "none",
                        backgroundImage:
                          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "left 8px center",
                        direction: "rtl",
                      }}
                    >
                      {ORDER_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  </Td>
                </tr>
              ))}
              {shown.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: 48,
                      textAlign: "center",
                      color: "#94A3B8",
                      fontSize: 14,
                    }}
                  >
                    لا توجد طلبات
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function formatDate(iso?: string): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function Th({
  children,
  width,
  center,
}: {
  children: React.ReactNode;
  width?: number;
  center?: boolean;
}) {
  return (
    <th
      style={{
        padding: "12px 16px",
        textAlign: center ? "center" : "right",
        fontSize: 12,
        fontWeight: 700,
        color: "#64748B",
        letterSpacing: ".04em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
        width,
      }}
    >
      {children}
    </th>
  );
}

function Td({ children, center }: { children: React.ReactNode; center?: boolean }) {
  return (
    <td
      style={{
        padding: "12px 16px",
        textAlign: center ? "center" : "right",
        color: "#334155",
        verticalAlign: "middle",
      }}
    >
      {children}
    </td>
  );
}

function OrderStatusBadge({ status }: { status: string }) {
  const map: Record<
    string,
    { bg: string; color: string; border: string; dot: string; label: string }
  > = {
    pending: {
      bg: "#FEF3C7",
      color: "#B45309",
      border: "rgba(245,158,11,.3)",
      dot: "#F59E0B",
      label: "قيد الانتظار",
    },
    confirmed: {
      bg: "#E0F2FE",
      color: "#0284C7",
      border: "rgba(14,165,233,.3)",
      dot: "#0EA5E9",
      label: "مؤكد",
    },
    shipped: {
      bg: "#F5F3FF",
      color: "#6D28D9",
      border: "#DDD6FE",
      dot: "#7C3AED",
      label: "تم الشحن",
    },
    delivered: {
      bg: "#DCFCE7",
      color: "#15803D",
      border: "rgba(34,197,94,.3)",
      dot: "#22C55E",
      label: "تم التسليم",
    },
    cancelled: {
      bg: "#FEE2E2",
      color: "#B91C1C",
      border: "rgba(239,68,68,.3)",
      dot: "#EF4444",
      label: "ملغي",
    },
  };
  const s = map[status] ?? {
    bg: "#F1F5F9",
    color: "#475569",
    border: "#E2E8F0",
    dot: "#94A3B8",
    label: status,
  };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 10px",
        borderRadius: 9999,
        background: s.bg,
        color: s.color,
        border: `1.5px solid ${s.border}`,
        fontSize: 12,
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: s.dot,
          flexShrink: 0,
        }}
      />
      {s.label}
    </span>
  );
}

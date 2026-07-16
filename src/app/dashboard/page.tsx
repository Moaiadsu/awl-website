"use client";
import { useEffect, useState } from "react";
import { getMerchants, getAllOrders } from "@/lib/api";
import { SkeletonStatCards, Skeleton } from "@/components/ui/Skeleton";
import {
  Users,
  ShoppingBag,
  CheckCircle2,
  Clock,
  TrendingUp,
  LayoutDashboard,
  type LucideIcon,
} from "lucide-react";

type Merchant = {
  id: string;
  store_name: string;
  owner_name: string;
  city: string;
  phone: string;
  status: string;
};

export default function DashboardPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.allSettled([
      getMerchants().then(setMerchants),
      getAllOrders().then(setOrders),
    ]).then(() => setLoaded(true));
  }, []);

  const pending = merchants.filter((m) => m.status === "pending").length;
  const approved = merchants.filter((m) => m.status === "approved").length;
  const pendingOrders = orders.filter((o) => o.status === "pending").length;

  const stats: StatCardProps[] = [
    {
      label: "إجمالي التجار",
      value: merchants.length,
      icon: Users,
      iconBg: "#E0F2FE",
      iconColor: "#0284C7",
      valueColor: "#0A1628",
      sub: "+3 هذا الشهر",
      subBg: "#DCFCE7",
      subColor: "#15803D",
      subIcon: TrendingUp,
    },
    {
      label: "تجار مفعّلون",
      value: approved,
      icon: CheckCircle2,
      iconBg: "#DCFCE7",
      iconColor: "#22C55E",
      valueColor: "#15803D",
      sub: merchants.length
        ? `${Math.round((approved / merchants.length) * 100)}% من الإجمالي`
        : "0% من الإجمالي",
      subBg: "transparent",
      subColor: "#94A3B8",
    },
    {
      label: "قيد المراجعة",
      value: pending,
      icon: Clock,
      iconBg: "#FEF3C7",
      iconColor: "#F59E0B",
      valueColor: "#B45309",
      sub: "يحتاج موافقة",
      subBg: "#FEF3C7",
      subColor: "#B45309",
      borderColor: "rgba(245,158,11,.3)",
    },
    {
      label: "طلبات قيد الانتظار",
      value: pendingOrders,
      icon: ShoppingBag,
      iconBg: "#E0F2FE",
      iconColor: "#0EA5E9",
      valueColor: "#0A1628",
      sub: `${orders.length} طلب إجمالاً`,
      subBg: "transparent",
      subColor: "#94A3B8",
    },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>

      {/* ── PAGE HEADER ─────────────────────────────────── */}
      <div style={{
        background: "linear-gradient(145deg, #ffffff 0%, #EEF5FF 100%)",
        borderRadius: 16, border: "1px solid rgba(14,165,233,0.12)",
        boxShadow: "0 4px 20px rgba(10,22,40,0.07)",
        padding: "20px 24px", marginBottom: 24,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 16, overflow: "hidden", position: "relative",
      }}>
        <div style={{ position: "absolute", top: -30, right: -30, width: 180, height: 180, background: "radial-gradient(circle, rgba(14,165,233,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 46, height: 46, borderRadius: 13, background: "rgba(14,165,233,0.10)", border: "1.5px solid rgba(14,165,233,0.20)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <LayoutDashboard size={22} color="#0EA5E9" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "#0A1628", letterSpacing: "-.02em", lineHeight: 1.2 }}>
              لوحة التحكم
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, color: "#94A3B8" }}>نظرة عامة على الطلبات والتجار</span>
              {merchants.length > 0 && (
                <span style={{ fontSize: 11, fontWeight: 700, background: "rgba(14,165,233,0.08)", color: "#0284C7", border: "1px solid rgba(14,165,233,0.18)", padding: "2px 8px", borderRadius: 9999 }}>
                  {merchants.length} تاجر
                </span>
              )}
              {pendingOrders > 0 && (
                <span style={{ fontSize: 11, fontWeight: 700, background: "rgba(245,158,11,0.08)", color: "#B45309", border: "1px solid rgba(245,158,11,0.18)", padding: "2px 8px", borderRadius: 9999 }}>
                  {pendingOrders} طلب معلق
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── STAT CARDS ─────────────────────────────────── */}
      {!loaded ? (
        <div style={{ marginBottom: 24 }}>
          <SkeletonStatCards count={4} />
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 16,
            marginBottom: 24,
          }}
        >
          {stats.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </div>
      )}

      {/* ── RECENT MERCHANTS TABLE ──────────────────────── */}
      <div
        style={{
          background: "linear-gradient(145deg, #ffffff 0%, #F4F8FF 100%)",
          borderRadius: 14,
          border: "1px solid rgba(14,165,233,0.10)",
          boxShadow: "0 2px 10px rgba(10,22,40,0.07)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #E2E8F0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#0A1628" }}>
              أحدث التجار
            </div>
            <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
              آخر التجار المسجلين في النظام
            </div>
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead style={{ background: "rgba(10,22,40,0.03)" }}>
              <tr style={{ borderBottom: "1px solid rgba(14,165,233,0.08)" }}>
                <Th>المتجر</Th>
                <Th>المالك</Th>
                <Th>المدينة</Th>
                <Th>الحالة</Th>
              </tr>
            </thead>
            <tbody>
              {!loaded ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={4} style={{ padding: "12px 16px" }}>
                      <Skeleton width="100%" height={16} />
                    </td>
                  </tr>
                ))
              ) : (
              merchants.slice(0, 5).map((m) => (
                <tr
                  key={m.id}
                  style={{ borderBottom: "1px solid rgba(14,165,233,0.05)", transition: "background .12s" }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.background = "rgba(14,165,233,0.03)")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.background = "transparent")
                  }
                >
                  <Td>
                    <div style={{ fontWeight: 700, color: "#1E293B" }}>{m.store_name}</div>
                  </Td>
                  <Td>
                    <span style={{ color: "#475569" }}>{m.owner_name}</span>
                  </Td>
                  <Td>
                    <span style={{ color: "#64748B" }}>{m.city}</span>
                  </Td>
                  <Td>
                    <StatusBadge status={m.status} />
                  </Td>
                </tr>
              ))
              )}
              {loaded && merchants.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    style={{ padding: 32, textAlign: "center", color: "#94A3B8", fontSize: 14 }}
                  >
                    لا يوجد تجار بعد
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

/* ── Sub components ────────────────────────────────── */

type StatCardProps = {
  label: string;
  value: number | string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  valueColor: string;
  sub?: string;
  subBg?: string;
  subColor?: string;
  subIcon?: LucideIcon;
  borderColor?: string;
};

function StatCard({
  label,
  value,
  icon: Icon,
  iconBg,
  iconColor,
  valueColor,
  sub,
  subBg,
  subColor,
  subIcon: SubIcon,
  borderColor,
}: StatCardProps) {
  return (
    <div
      style={{
        background: "linear-gradient(145deg, #ffffff 0%, #F4F8FF 100%)",
        borderRadius: 14,
        border: `1px solid ${borderColor ?? "rgba(14,165,233,0.10)"}`,
        boxShadow: "0 2px 10px rgba(10,22,40,0.07)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Color accent top strip */}
      <div style={{ height: 3, background: iconColor, opacity: 0.55 }} />
      <div style={{ padding: 20, display: "flex", alignItems: "flex-start", gap: 16 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: iconBg,
            border: `1px solid ${iconColor}28`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon size={22} color={iconColor} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: valueColor, lineHeight: 1 }}>
            {value}
          </div>
          <div style={{ fontSize: 12, color: "#64748B", marginTop: 4, fontWeight: 600 }}>
            {label}
          </div>
          {sub && (
            <div style={{ marginTop: 8 }}>
              {subBg && subBg !== "transparent" ? (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "2px 8px",
                    borderRadius: 9999,
                    background: subBg,
                    color: subColor,
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                >
                  {SubIcon && <SubIcon size={10} color={subColor} />}
                  {sub}
                </span>
              ) : (
                <span style={{ fontSize: 11, color: subColor ?? "#94A3B8" }}>{sub}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      style={{
        padding: "12px 16px",
        textAlign: "right",
        fontSize: 12,
        fontWeight: 700,
        color: "#64748B",
        letterSpacing: ".04em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return (
    <td
      style={{
        padding: "12px 16px",
        textAlign: "right",
        color: "#334155",
        verticalAlign: "middle",
      }}
    >
      {children}
    </td>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; border: string; dot: string; label: string }> = {
    pending: {
      bg: "#FEF3C7",
      color: "#B45309",
      border: "rgba(245,158,11,.3)",
      dot: "#F59E0B",
      label: "قيد الانتظار",
    },
    approved: {
      bg: "#DCFCE7",
      color: "#15803D",
      border: "rgba(34,197,94,.3)",
      dot: "#22C55E",
      label: "مقبول",
    },
    rejected: {
      bg: "#FEE2E2",
      color: "#B91C1C",
      border: "rgba(239,68,68,.3)",
      dot: "#EF4444",
      label: "مرفوض",
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

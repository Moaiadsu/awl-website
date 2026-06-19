"use client";
import { useEffect, useMemo, useState } from "react";
import { getMerchants, updateMerchantStatus } from "@/lib/api";
import {
  Check,
  X,
  RotateCcw,
  Search,
  Users,
  CheckCircle2,
  Clock,
  XCircle,
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

type FilterKey = "all" | "pending" | "approved" | "rejected";

const FILTER_LABELS: Record<FilterKey, string> = {
  all: "الكل",
  pending: "قيد الانتظار",
  approved: "مقبول",
  rejected: "مرفوض",
};

export default function MerchantsPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () =>
    getMerchants()
      .then(setMerchants)
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const handle = async (id: string, status: "approved" | "rejected" | "pending") => {
    await updateMerchantStatus(id, status);
    load();
  };

  const counts = useMemo(() => {
    const c = { all: merchants.length, pending: 0, approved: 0, rejected: 0 } as Record<
      FilterKey,
      number
    >;
    merchants.forEach((m) => {
      if (m.status === "pending") c.pending++;
      else if (m.status === "approved") c.approved++;
      else if (m.status === "rejected") c.rejected++;
    });
    return c;
  }, [merchants]);

  const shown = useMemo(() => {
    let list = filter === "all" ? merchants : merchants.filter((m) => m.status === filter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (m) =>
          (m.store_name ?? "").toLowerCase().includes(q) ||
          (m.owner_name ?? "").toLowerCase().includes(q) ||
          (m.phone ?? "").toLowerCase().includes(q) ||
          (m.city ?? "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [merchants, filter, search]);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      {/* ── STAT CARDS ─────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <MiniStat
          icon={Users}
          iconBg="#E0F2FE"
          iconColor="#0284C7"
          value={counts.all}
          label="إجمالي التجار"
          valueColor="#0A1628"
        />
        <MiniStat
          icon={CheckCircle2}
          iconBg="#DCFCE7"
          iconColor="#22C55E"
          value={counts.approved}
          label="مقبول"
          valueColor="#15803D"
        />
        <MiniStat
          icon={Clock}
          iconBg="#FEF3C7"
          iconColor="#F59E0B"
          value={counts.pending}
          label="قيد الانتظار"
          valueColor="#B45309"
          borderColor="rgba(245,158,11,.3)"
        />
        <MiniStat
          icon={XCircle}
          iconBg="#FEE2E2"
          iconColor="#EF4444"
          value={counts.rejected}
          label="مرفوض"
          valueColor="#B91C1C"
          borderColor="rgba(239,68,68,.3)"
        />
      </div>

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
        {/* Search */}
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
            placeholder="البحث في التجار..."
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

        {/* Status filter chips */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#64748B" }}>الحالة:</span>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {(["all", "pending", "approved", "rejected"] as FilterKey[]).map((f) => {
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
                    {counts[f]}
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
                <Th>المتجر</Th>
                <Th>المالك</Th>
                <Th>المدينة</Th>
                <Th width={150}>الهاتف</Th>
                <Th width={140}>الحالة</Th>
                <Th width={220} center>
                  الإجراءات
                </Th>
              </tr>
            </thead>
            <tbody>
              {shown.map((m) => (
                <tr
                  key={m.id}
                  style={{ borderBottom: "1px solid #F1F5F9", transition: "background .1s" }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.background = "#F8FAFC")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.background = "transparent")
                  }
                >
                  <Td>
                    <div style={{ fontWeight: 700, color: "#1E293B" }}>{m.store_name}</div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "#CBD5E1",
                        marginTop: 2,
                        fontFamily: "Courier New, monospace",
                        direction: "ltr",
                      }}
                    >
                      {m.id?.slice(0, 12)}
                    </div>
                  </Td>
                  <Td>
                    <span style={{ color: "#475569" }}>{m.owner_name}</span>
                  </Td>
                  <Td>
                    <span style={{ color: "#64748B" }}>{m.city}</span>
                  </Td>
                  <Td>
                    <span
                      style={{
                        direction: "ltr",
                        display: "inline-block",
                        color: "#334155",
                        fontSize: 14,
                      }}
                    >
                      {m.phone}
                    </span>
                  </Td>
                  <Td>
                    <StatusBadge status={m.status} />
                  </Td>
                  <Td center>
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        justifyContent: "center",
                      }}
                    >
                      {m.status !== "approved" && (
                        <RowAction
                          icon={Check}
                          label="قبول"
                          color="#15803D"
                          hoverBg="#DCFCE7"
                          onClick={() => handle(m.id, "approved")}
                        />
                      )}
                      {m.status !== "rejected" && (
                        <RowAction
                          icon={X}
                          label="رفض"
                          color="#B91C1C"
                          hoverBg="#FEE2E2"
                          onClick={() => handle(m.id, "rejected")}
                        />
                      )}
                      {m.status !== "pending" && (
                        <RowAction
                          icon={RotateCcw}
                          label="إعادة"
                          color="#B45309"
                          hoverBg="#FEF3C7"
                          onClick={() => handle(m.id, "pending")}
                        />
                      )}
                    </div>
                  </Td>
                </tr>
              ))}
              {shown.length === 0 && !loading && (
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
                    لا يوجد تجار يطابقون البحث
                  </td>
                </tr>
              )}
              {loading && (
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
                    جاري التحميل...
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

function MiniStat({
  icon: Icon,
  iconBg,
  iconColor,
  value,
  label,
  valueColor,
  borderColor,
}: {
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  value: number | string;
  label: string;
  valueColor: string;
  borderColor?: string;
}) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        border: `1px solid ${borderColor ?? "#E2E8F0"}`,
        boxShadow: "0 1px 2px rgba(15,23,42,.05)",
        padding: 20,
        display: "flex",
        alignItems: "center",
        gap: 16,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: iconBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={22} color={iconColor} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 24, fontWeight: 900, color: valueColor, lineHeight: 1 }}>
          {value}
        </div>
        <div style={{ fontSize: 12, color: "#64748B", marginTop: 4, fontWeight: 600 }}>
          {label}
        </div>
      </div>
    </div>
  );
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

function RowAction({
  icon: Icon,
  label,
  color,
  hoverBg,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  color: string;
  hoverBg: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "5px 10px",
        borderRadius: 6,
        fontSize: 12,
        fontWeight: 700,
        color,
        background: "transparent",
        border: "none",
        cursor: "pointer",
        transition: "background .12s",
        whiteSpace: "nowrap",
        fontFamily: "Cairo, sans-serif",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = hoverBg)}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <Icon size={12} />
      {label}
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
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

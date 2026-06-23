"use client";
import React, { useEffect, useMemo, useState } from "react";
import { getMerchants, updateMerchantStatus, createOdooContact } from "@/lib/api";
import {
  Check,
  X,
  RotateCcw,
  Search,
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  Database,
  Loader2,
  User,
  Phone,
  MapPin,
  ChevronDown,
  ChevronUp,
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

const AVATAR_PALETTES = [
  { bg: "#DBEAFE", color: "#1D4ED8" },
  { bg: "#D1FAE5", color: "#065F46" },
  { bg: "#F3E8FF", color: "#7E22CE" },
  { bg: "#FEF3C7", color: "#92400E" },
  { bg: "#FFE4E6", color: "#9F1239" },
  { bg: "#CCFBF1", color: "#0F766E" },
  { bg: "#E0E7FF", color: "#3730A3" },
  { bg: "#FFF7ED", color: "#C2410C" },
];
function avatarPal(name: string) {
  return AVATAR_PALETTES[(name || " ").charCodeAt(0) % AVATAR_PALETTES.length];
}
function initials(name: string): string {
  const p = (name || "?").trim().split(/\s+/);
  return p.length >= 2 ? (p[0][0] + p[p.length - 1][0]).toUpperCase() : (name || "?").slice(0, 2).toUpperCase();
}

export default function MerchantsPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  // per-merchant Odoo sync state — seeded from localStorage on mount
  const [odooState, setOdooState] = useState<Map<string, "loading" | "done" | "error">>(new Map());
  const [bulkSyncing, setBulkSyncing] = useState(false);

  const LS_KEY = "awl_odoo_merchants";

  function readDoneIds(): Set<string> {
    try {
      return new Set(JSON.parse(localStorage.getItem(LS_KEY) ?? "[]") as string[]);
    } catch {
      return new Set();
    }
  }

  function markDoneInStorage(id: string) {
    const ids = readDoneIds();
    ids.add(id);
    localStorage.setItem(LS_KEY, JSON.stringify(Array.from(ids)));
  }

  const load = () =>
    getMerchants()
      .then((list) => {
        setMerchants(list);
        // Pre-mark any merchant already in localStorage as "done"
        const done = readDoneIds();
        if (done.size > 0) {
          setOdooState((prev) => {
            const m = new Map(prev);
            list.forEach((merchant) => { if (done.has(merchant.id)) m.set(merchant.id, "done"); });
            return m;
          });
        }
      })
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handle = async (id: string, status: "approved" | "rejected" | "pending") => {
    await updateMerchantStatus(id, status);
    load();
  };

  const addToOdoo = async (m: Merchant) => {
    setOdooState((prev) => new Map(prev).set(m.id, "loading"));
    try {
      const res = await createOdooContact({
        name:         m.store_name,
        phone:        m.phone || undefined,
        city:         m.city  || undefined,
        company_type: "company",
        is_customer:  true,
      });
      if (res.error) {
        setOdooState((prev) => new Map(prev).set(m.id, "error"));
      } else {
        // alreadyExists or freshly created — both count as done
        setOdooState((prev) => new Map(prev).set(m.id, "done"));
        markDoneInStorage(m.id);
      }
    } catch {
      setOdooState((prev) => new Map(prev).set(m.id, "error"));
    }
  };

  const bulkSync = async () => {
    const pending = merchants.filter(
      (m) => m.status === "approved" && odooState.get(m.id) !== "done",
    );
    if (!pending.length) return;
    setBulkSyncing(true);
    for (const m of pending) {
      await addToOdoo(m);
    }
    setBulkSyncing(false);
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

  const unsyncedCount = merchants.filter(
    (m) => m.status === "approved" && odooState.get(m.id) !== "done",
  ).length;

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
            <Users size={22} color="#0EA5E9" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "#0A1628", letterSpacing: "-.02em", lineHeight: 1.2 }}>
              إدارة التجار
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, color: "#94A3B8" }}>قائمة وإدارة التجار المسجلين</span>
              {merchants.length > 0 && (
                <span style={{ fontSize: 11, fontWeight: 700, background: "rgba(14,165,233,0.08)", color: "#0284C7", border: "1px solid rgba(14,165,233,0.18)", padding: "2px 8px", borderRadius: 9999 }}>
                  {merchants.length} تاجر
                </span>
              )}
              {counts.pending > 0 && (
                <span style={{ fontSize: 11, fontWeight: 700, background: "rgba(245,158,11,0.08)", color: "#B45309", border: "1px solid rgba(245,158,11,0.18)", padding: "2px 8px", borderRadius: 9999 }}>
                  {counts.pending} قيد الانتظار
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={bulkSync}
          disabled={bulkSyncing || unsyncedCount === 0}
          style={{
            height: 36, padding: "0 16px", borderRadius: 9,
            border: `1.5px solid ${unsyncedCount > 0 ? "rgba(14,165,233,0.25)" : "rgba(14,165,233,0.08)"}`,
            fontFamily: "Cairo, sans-serif", fontSize: 13, fontWeight: 700,
            color: unsyncedCount > 0 ? "#0EA5E9" : "#94A3B8",
            background: unsyncedCount > 0 ? "rgba(14,165,233,0.08)" : "rgba(14,165,233,0.03)",
            cursor: bulkSyncing || unsyncedCount === 0 ? "default" : "pointer",
            display: "inline-flex", alignItems: "center", gap: 7,
            transition: "all .15s", opacity: bulkSyncing ? 0.65 : 1,
          }}
          onMouseEnter={(e) => { if (!bulkSyncing && unsyncedCount > 0) { e.currentTarget.style.background = "rgba(14,165,233,0.16)"; e.currentTarget.style.borderColor = "rgba(14,165,233,0.45)"; } }}
          onMouseLeave={(e) => { e.currentTarget.style.background = unsyncedCount > 0 ? "rgba(14,165,233,0.08)" : "rgba(14,165,233,0.03)"; e.currentTarget.style.borderColor = unsyncedCount > 0 ? "rgba(14,165,233,0.25)" : "rgba(14,165,233,0.08)"; }}
        >
          <Database size={14} />
          {bulkSyncing ? "جاري المزامنة..." : unsyncedCount === 0 ? "تمت المزامنة ✓" : `مزامنة المقبولين → Odoo (${unsyncedCount})`}
        </button>
      </div>

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
          background: "linear-gradient(145deg, #ffffff 0%, #F4F8FF 100%)",
          borderRadius: 14,
          border: "1px solid rgba(14,165,233,0.10)",
          boxShadow: "0 2px 8px rgba(10,22,40,0.05)",
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

        <div style={{ display: "flex", gap: 3, background: "#F8FAFC", padding: 3, borderRadius: 10, border: "1px solid #F1F5F9" }}>
          {(["all", "pending", "approved", "rejected"] as FilterKey[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "5px 12px", borderRadius: 8, border: "none",
                fontFamily: "Cairo, sans-serif", fontSize: 12, fontWeight: 700,
                cursor: "pointer",
                background: filter === f ? "#fff" : "transparent",
                color: filter === f ? "#0A1628" : "#94A3B8",
                boxShadow: filter === f ? "0 1px 3px rgba(0,0,0,.06)" : "none",
                transition: "all .12s",
                display: "inline-flex", alignItems: "center", gap: 5,
              }}
            >
              {FILTER_LABELS[f]}
              <span style={{
                fontSize: 10, fontWeight: 800,
                background: filter === f ? "#EFF6FF" : "#E2E8F0",
                color: filter === f ? "#3B82F6" : "#94A3B8",
                padding: "1px 6px", borderRadius: 9999,
              }}>
                {counts[f]}
              </span>
            </button>
          ))}
        </div>

        {shown.length > 0 && (
          <span style={{ marginRight: "auto", fontSize: 11, color: "#94A3B8", fontWeight: 600 }}>
            {shown.length} تاجر
          </span>
        )}
      </div>

      {/* ── CARD LIST ─────────────────────────────────── */}
      {loading && shown.length === 0 && (
        <div style={{ textAlign: "center", padding: "72px 20px" }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: "rgba(14,165,233,0.07)", border: "1.5px solid rgba(14,165,233,0.14)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <Users size={36} color="#0EA5E9" style={{ opacity: 0.55 }} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#1E293B", marginBottom: 8 }}>جاري تحميل البيانات...</div>
        </div>
      )}
      {!loading && shown.length === 0 && (
        <div style={{ textAlign: "center", padding: "72px 20px" }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: "rgba(14,165,233,0.07)", border: "1.5px solid rgba(14,165,233,0.14)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <Users size={36} color="#0EA5E9" style={{ opacity: 0.55 }} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#1E293B", marginBottom: 8 }}>لا يوجد تجار</div>
          <div style={{ fontSize: 13, color: "#94A3B8" }}>لا توجد نتائج تطابق البحث الحالي</div>
        </div>
      )}
      {shown.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {shown.map((m) => (
            <MerchantCard
              key={m.id}
              merchant={m}
              odooState={odooState.get(m.id) ?? "idle"}
              onAction={(id, status) => handle(id, status)}
              onAddToOdoo={() => addToOdoo(m)}
            />
          ))}
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ── Sub components ────────────────────────────────── */

function MerchantCard({
  merchant: m,
  odooState,
  onAction,
  onAddToOdoo,
}: {
  merchant: Merchant;
  odooState: "idle" | "loading" | "done" | "error";
  onAction: (id: string, status: "approved" | "rejected" | "pending") => void;
  onAddToOdoo: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const pal = avatarPal(m.store_name);
  return (
    <div style={{
      background: "linear-gradient(145deg, #ffffff 0%, #F5F9FF 100%)",
      borderRadius: 14,
      border: `1.5px solid ${open ? "rgba(14,165,233,0.32)" : "rgba(14,165,233,0.10)"}`,
      boxShadow: open ? "0 8px 28px rgba(10,22,40,0.10)" : "0 2px 10px rgba(10,22,40,0.05)",
      overflow: "hidden",
      transition: "border-color .15s, box-shadow .15s",
    }}>
      {/* Main row */}
      <div
        style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer", userSelect: "none" }}
        onClick={() => setOpen((o) => !o)}
      >
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: pal.bg, color: pal.color,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 900, fontSize: 15, flexShrink: 0, fontFamily: "Cairo, sans-serif",
        }}>
          {initials(m.store_name)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 5 }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: "#0A1628" }}>{m.store_name}</span>
            <StatusBadge status={m.status} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            {m.owner_name && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <User size={11} color="#CBD5E1" />
                <span style={{ fontSize: 12, color: "#64748B" }}>{m.owner_name}</span>
              </span>
            )}
            {m.phone && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <Phone size={11} color="#CBD5E1" />
                <span style={{ fontSize: 12, color: "#64748B", direction: "ltr", display: "inline-block" }}>{m.phone}</span>
              </span>
            )}
            {m.city && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <MapPin size={11} color="#CBD5E1" />
                <span style={{ fontSize: 12, color: "#64748B" }}>{m.city}</span>
              </span>
            )}
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
          style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${open ? "#BFDBFE" : "#E2E8F0"}`, background: open ? "#EFF6FF" : "#F8FAFC", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
        >
          {open ? <ChevronUp size={14} color="#3B82F6" /> : <ChevronDown size={14} color="#94A3B8" />}
        </button>
      </div>
      {/* Expanded actions */}
      {open && (
        <div style={{ borderTop: "1px dashed #E2E8F0", padding: "12px 18px 14px", background: "#F8FAFC" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            {m.status !== "approved" && <RowAction icon={Check} label="قبول" color="#15803D" hoverBg="#DCFCE7" onClick={() => onAction(m.id, "approved")} />}
            {m.status !== "rejected" && <RowAction icon={X} label="رفض" color="#B91C1C" hoverBg="#FEE2E2" onClick={() => onAction(m.id, "rejected")} />}
            {m.status !== "pending" && <RowAction icon={RotateCcw} label="إعادة للانتظار" color="#B45309" hoverBg="#FEF3C7" onClick={() => onAction(m.id, "pending")} />}
            <OdooButton state={odooState} onClick={onAddToOdoo} />
          </div>
        </div>
      )}
    </div>
  );
}

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
        background: "linear-gradient(145deg, #ffffff 0%, #F4F8FF 100%)",
        borderRadius: 14,
        border: `1px solid ${borderColor ?? "rgba(14,165,233,0.10)"}`,
        boxShadow: "0 2px 10px rgba(10,22,40,0.07)",
        padding: 20,
        display: "flex",
        alignItems: "center",
        gap: 16,
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div style={{
        position: "absolute", top: 0, right: 0,
        width: 80, height: 80,
        background: `radial-gradient(circle at top right, ${iconColor}12 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />
      <div
        style={{
          width: 46,
          height: 46,
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
      </div>
    </div>
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

type OdooState = "idle" | "loading" | "done" | "error";

function OdooButton({ state, onClick }: { state: OdooState; onClick: () => void }) {
  const isDone    = state === "done";
  const isLoading = state === "loading";
  const isError   = state === "error";

  const bg     = isDone ? "rgba(34,197,94,0.08)" : isError ? "rgba(239,68,68,0.08)" : "rgba(14,165,233,0.08)";
  const color  = isDone ? "#15803D" : isError ? "#B91C1C" : "#0EA5E9";
  const border = isDone ? "rgba(34,197,94,0.25)" : isError ? "rgba(239,68,68,0.25)" : "rgba(14,165,233,0.25)";

  return (
    <button
      onClick={onClick}
      disabled={isLoading || isDone}
      title={isDone ? "تمت الإضافة إلى Odoo" : isError ? "فشل — انقر للمحاولة مجدداً" : "حفظ هذا التاجر في Odoo"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "4px 10px",
        borderRadius: 8,
        fontSize: 12,
        fontWeight: 700,
        color,
        background: bg,
        border: `1.5px solid ${border}`,
        cursor: isDone ? "default" : isLoading ? "not-allowed" : "pointer",
        fontFamily: "Cairo, sans-serif",
        whiteSpace: "nowrap",
        transition: "all .15s",
        opacity: isLoading ? 0.65 : 1,
      }}
      onMouseEnter={(e) => {
        if (!isDone && !isLoading && !isError) {
          e.currentTarget.style.background = "rgba(14,165,233,0.16)";
          e.currentTarget.style.borderColor = "rgba(14,165,233,0.45)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isDone && !isLoading && !isError) {
          e.currentTarget.style.background = "rgba(14,165,233,0.08)";
          e.currentTarget.style.borderColor = "rgba(14,165,233,0.25)";
        }
      }}
    >
      {isLoading ? (
        <Loader2 size={12} style={{ animation: "spin 0.8s linear infinite" }} />
      ) : (
        <Database size={12} />
      )}
      {isDone ? "في Odoo ✓" : isError ? "خطأ — أعد المحاولة" : isLoading ? "جاري الحفظ..." : "→ Odoo"}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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

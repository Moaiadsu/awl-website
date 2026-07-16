"use client";
import React, { useEffect, useMemo, useState } from "react";
import {
  RefreshCw, Search, Users, Building2, User, Plus, X,
  Trash2, CheckCheck, Mail, Phone, MapPin, Globe,
  ChevronDown, ChevronUp,
} from "lucide-react";
import {
  type OdooContactRow,
  type NewContactPayload,
  syncOdooContacts,
  createOdooContact,
  deleteOdooContact,
} from "@/lib/api";
import { SkeletonRows } from "@/components/ui/Skeleton";

const LANG_LABEL: Record<string, string> = {
  ar_001: "العربية",
  ar:     "العربية",
  en_US:  "English",
  en:     "English",
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
  return AVATAR_PALETTES[name.charCodeAt(0) % AVATAR_PALETTES.length];
}

function initials(name: string): string {
  const p = name.trim().split(/\s+/);
  return p.length >= 2 ? (p[0][0] + p[p.length - 1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
}

export default function OdooContactsPage() {
  const [contacts, setContacts] = useState<OdooContactRow[]>([]);
  const [search, setSearch]     = useState("");
  const [syncing, setSyncing]   = useState(false);
  const [error, setError]       = useState("");
  const [syncedAt, setSyncedAt] = useState("");
  const [expanded, setExpanded]   = useState<number | null>(null);
  const [filter, setFilter]       = useState<"all" | "customer" | "vendor">("all");
  const [showForm, setShowForm]   = useState(false);
  const [deleteState, setDeleteState] = useState<Map<number, "confirming" | "deleting">>(new Map());

  useEffect(() => {
    try {
      const raw = localStorage.getItem("awl_odoo_contacts");
      if (raw) { const { data, synced_at } = JSON.parse(raw); setContacts(data ?? []); setSyncedAt(synced_at ?? ""); }
    } catch {}
  }, []);

  async function onSync() {
    setSyncing(true);
    setError("");
    try {
      const json = await syncOdooContacts();
      if (json.error) { setError(json.error); return; }
      setContacts(json.data ?? []);
      setSyncedAt(json.synced_at ?? "");
      try { localStorage.setItem("awl_odoo_contacts", JSON.stringify({ data: json.data, synced_at: json.synced_at })); } catch {}
    } catch {
      setError("فشلت المزامنة — تحقق من إعدادات Odoo");
    } finally {
      setSyncing(false);
    }
  }

  function startConfirmDelete(id: number) {
    setDeleteState((prev) => new Map(prev).set(id, "confirming"));
  }

  function cancelDelete(id: number) {
    setDeleteState((prev) => { const m = new Map(prev); m.delete(id); return m; });
  }

  async function confirmDelete(id: number) {
    setDeleteState((prev) => new Map(prev).set(id, "deleting"));
    try {
      const res = await deleteOdooContact(id);
      if (res.error) {
        alert(`خطأ في الحذف: ${res.error}`);
        cancelDelete(id);
      } else {
        // Optimistically remove from local state
        setContacts((prev) => prev.filter((c) => c.id !== id));
        setDeleteState((prev) => { const m = new Map(prev); m.delete(id); return m; });
        if (expanded === id) setExpanded(null);
      }
    } catch {
      alert("تعذّر الحذف — تحقق من الاتصال");
      cancelDelete(id);
    }
  }

  const shown = useMemo(() => {
    let list = contacts;
    if (filter === "customer") list = list.filter((c) => c.customer_rank > 0);
    if (filter === "vendor")   list = list.filter((c) => c.supplier_rank > 0);
    if (!search.trim()) return list;
    const q = search.trim().toLowerCase();
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) ||
        c.country_name.toLowerCase().includes(q) ||
        c.vat.toLowerCase().includes(q),
    );
  }, [contacts, search, filter]);

  const customerCount = contacts.filter((c) => c.customer_rank > 0).length;
  const vendorCount   = contacts.filter((c) => c.supplier_rank > 0).length;

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }} dir="rtl">

      {/* PAGE HEADER */}
      <div style={{
        background: "linear-gradient(145deg, #ffffff 0%, #F8F4F7 100%)",
        borderRadius: 16, border: "1px solid rgba(113,75,103,0.18)",
        boxShadow: "0 4px 20px rgba(10,22,40,0.07)",
        padding: "20px 24px", marginBottom: 24,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 16, overflow: "hidden", position: "relative",
      }}>
        <div style={{ position: "absolute", top: -30, right: -30, width: 180, height: 180, background: "radial-gradient(circle, rgba(113,75,103,0.09) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 46, height: 46, borderRadius: 13, background: "rgba(113,75,103,0.10)", border: "1.5px solid rgba(113,75,103,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Users size={22} color="#714B67" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "#0A1628", letterSpacing: "-.02em", lineHeight: 1.2 }}>
                جهات الاتصال
              </h1>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                fontSize: 10, fontWeight: 900, letterSpacing: "0.03em",
                background: "rgba(113,75,103,0.10)", color: "#714B67",
                border: "1px solid rgba(113,75,103,0.22)",
                padding: "2px 7px", borderRadius: 5,
              }}>
                <svg width="10" height="7" viewBox="0 0 10 7" fill="none">
                  <circle cx="3" cy="3.5" r="2.8" fill="#714B67" />
                  <circle cx="7" cy="3.5" r="2.8" fill="#714B67" />
                </svg>
                Odoo
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, color: "#94A3B8", fontFamily: "monospace", direction: "ltr" }}>res.partner</span>
              {syncedAt && (
                <>
                  <span style={{ width: 3, height: 3, borderRadius: "50%", background: "#CBD5E1", flexShrink: 0 }} />
                  <span style={{ fontSize: 11, fontWeight: 600, background: "rgba(34,197,94,0.08)", color: "#15803D", border: "1px solid rgba(34,197,94,0.18)", padding: "2px 8px", borderRadius: 9999 }}>
                    {new Date(syncedAt).toLocaleDateString("ar", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" } as Intl.DateTimeFormatOptions)}
                  </span>
                </>
              )}
              {contacts.length > 0 && (
                <span style={{ fontSize: 11, fontWeight: 700, background: "rgba(113,75,103,0.08)", color: "#714B67", border: "1px solid rgba(113,75,103,0.18)", padding: "2px 8px", borderRadius: 9999 }}>
                  {contacts.length} جهة
                </span>
              )}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <SyncBtn syncing={syncing} onClick={onSync} />
          <button
            onClick={() => setShowForm(true)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              height: 36, padding: "0 16px",
              background: "#0A1628", color: "#fff",
              border: "none", borderRadius: 9,
              fontFamily: "Cairo, sans-serif", fontSize: 13, fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(10,22,40,0.20)",
            }}
          >
            <Plus size={15} />
            إضافة جهة اتصال
          </button>
        </div>
      </div>

      {/* STAT CARDS */}
      {contacts.length > 0 && (
        <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
          <StatCard label="إجمالي جهات الاتصال" value={contacts.length} color="#6366F1" icon={<Users size={18} color="#6366F1" />} />
          <StatCard label="العملاء" value={customerCount} color="#10B981" icon={<User size={18} color="#10B981" />} />
          <StatCard label="الموردون" value={vendorCount} color="#F59E0B" icon={<Building2 size={18} color="#F59E0B" />} />
        </div>
      )}

      {/* TOOLBAR */}
      <div style={{
        background: "linear-gradient(145deg, #ffffff 0%, #F4F8FF 100%)",
        borderRadius: 14, border: "1px solid rgba(14,165,233,0.10)",
        padding: "10px 14px", display: "flex", alignItems: "center",
        gap: 8, flexWrap: "wrap", marginBottom: 16,
        boxShadow: "0 2px 8px rgba(10,22,40,0.05)",
      }}>
        <div style={{ display: "flex", gap: 3, background: "#F8FAFC", padding: 3, borderRadius: 10, border: "1px solid #F1F5F9" }}>
          {(["all", "customer", "vendor"] as const).map((f) => {
            const labels = { all: "الكل", customer: "العملاء", vendor: "الموردون" };
            const counts = { all: contacts.length, customer: customerCount, vendor: vendorCount };
            return (
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
                {labels[f]}
                <span style={{
                  fontSize: 10, fontWeight: 800,
                  background: filter === f ? "#EFF6FF" : "#E2E8F0",
                  color: filter === f ? "#3B82F6" : "#94A3B8",
                  padding: "1px 6px", borderRadius: 9999,
                }}>
                  {counts[f]}
                </span>
              </button>
            );
          })}
        </div>

        <div style={{ position: "relative", flex: 1, minWidth: 200, maxWidth: 380 }}>
          <Search size={13} style={{ position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", color: "#CBD5E1", pointerEvents: "none" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالاسم، البريد، الهاتف، المدينة..."
            style={{
              height: 36, width: "100%", padding: "0 34px 0 12px",
              border: "1.5px solid #E2E8F0", borderRadius: 9,
              fontFamily: "Cairo, sans-serif", fontSize: 13,
              color: "#1E293B", background: "#F8FAFC",
              outline: "none", direction: "rtl", boxSizing: "border-box",
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "#0EA5E9"; e.currentTarget.style.background = "#fff"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(14,165,233,.1)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.background = "#F8FAFC"; e.currentTarget.style.boxShadow = "none"; }}
          />
        </div>

        {shown.length > 0 && (
          <span style={{ marginRight: "auto", fontSize: 11, color: "#94A3B8", fontWeight: 600 }}>
            {shown.length} نتيجة
          </span>
        )}
      </div>

      {/* CONTENT */}
      {error && <ErrorBanner message={error} />}

      {syncing && contacts.length === 0 && <SkeletonRows count={6} />}

      {!syncing && !error && shown.length === 0 && (
        <EmptyState
          icon={<Users size={36} color="#0EA5E9" style={{ opacity: 0.55 }} />}
          title={contacts.length === 0 ? "لم يتم جلب البيانات بعد" : "لا توجد نتائج"}
          subtitle={contacts.length === 0 ? "اضغط مزامنة لجلب جهات الاتصال من Odoo" : "لا توجد جهات اتصال تطابق بحثك"}
          action={contacts.length === 0 ? <SyncBtn syncing={syncing} onClick={onSync} size="lg" /> : undefined}
        />
      )}

      {!error && shown.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {shown.map((c) => (
            <ContactCard
              key={c.id}
              contact={c}
              expanded={expanded === c.id}
              onToggle={() => setExpanded(expanded === c.id ? null : c.id)}
              deleteStatus={deleteState.get(c.id)}
              onDelete={() => startConfirmDelete(c.id)}
              onDeleteCancel={() => cancelDelete(c.id)}
              onDeleteConfirm={() => confirmDelete(c.id)}
            />
          ))}
        </div>
      )}

      {showForm && (
        <NewContactModal
          onClose={() => setShowForm(false)}
          onCreated={() => { setShowForm(false); onSync(); }}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Shared sync helpers ────────────────────────────────────────

function SyncBtn({
  syncing,
  onClick,
  size = "sm",
}: {
  syncing: boolean;
  onClick: () => void;
  size?: "sm" | "lg";
}) {
  const h = size === "lg" ? 42 : 36;
  const px = size === "lg" ? 20 : 16;
  const fs = size === "lg" ? 14 : 13;
  return (
    <button
      onClick={onClick}
      disabled={syncing}
      style={{
        display: "inline-flex", alignItems: "center", gap: 7,
        height: h, padding: `0 ${px}px`,
        background: "rgba(14,165,233,0.08)",
        color: "#0EA5E9",
        border: "1.5px solid rgba(14,165,233,0.25)",
        borderRadius: size === "lg" ? 11 : 9,
        fontFamily: "Cairo, sans-serif", fontSize: fs, fontWeight: 700,
        cursor: syncing ? "not-allowed" : "pointer",
        opacity: syncing ? 0.65 : 1,
        transition: "all .15s",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        if (!syncing) {
          e.currentTarget.style.background = "rgba(14,165,233,0.16)";
          e.currentTarget.style.borderColor = "rgba(14,165,233,0.45)";
        }
      }}
      onMouseLeave={(e) => {
        if (!syncing) {
          e.currentTarget.style.background = "rgba(14,165,233,0.08)";
          e.currentTarget.style.borderColor = "rgba(14,165,233,0.25)";
        }
      }}
    >
      <RefreshCw size={size === "lg" ? 16 : 14} style={{ animation: syncing ? "spin 0.8s linear infinite" : "none" }} />
      {syncing ? "جاري المزامنة..." : "مزامنة من Odoo"}
    </button>
  );
}

function EmptyState({
  icon,
  title,
  subtitle,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) {
  return (
    <div style={{ textAlign: "center", padding: "72px 20px" }}>
      <div style={{
        width: 72, height: 72, borderRadius: 20,
        background: "rgba(14,165,233,0.07)",
        border: "1.5px solid rgba(14,165,233,0.14)",
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 20px",
      }}>
        {icon}
      </div>
      <div style={{ fontSize: 16, fontWeight: 800, color: "#1E293B", marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 13, color: "#94A3B8", marginBottom: action ? 24 : 0 }}>{subtitle}</div>
      {action}
    </div>
  );
}

// ── ContactCard ────────────────────────────────────────────────

function ContactCard({
  contact: c,
  expanded,
  onToggle,
  deleteStatus,
  onDelete,
  onDeleteCancel,
  onDeleteConfirm,
}: {
  contact: OdooContactRow;
  expanded: boolean;
  onToggle: () => void;
  deleteStatus: "confirming" | "deleting" | undefined;
  onDelete: () => void;
  onDeleteCancel: () => void;
  onDeleteConfirm: () => void;
}) {
  const pal = avatarPal(c.name);
  return (
    <div style={{
      background: "linear-gradient(145deg, #ffffff 0%, #F5F9FF 100%)",
      borderRadius: 14,
      border: `1.5px solid ${expanded ? "rgba(14,165,233,0.32)" : "rgba(14,165,233,0.10)"}`,
      boxShadow: expanded ? "0 8px 28px rgba(10,22,40,0.10)" : "0 2px 10px rgba(10,22,40,0.05)",
      overflow: "hidden",
      transition: "border-color .15s, box-shadow .15s",
    }}>
      {/* Main row */}
      <div
        style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer", userSelect: "none" }}
        onClick={onToggle}
      >
        {/* Avatar */}
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: pal.bg, color: pal.color,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 900, fontSize: 15, flexShrink: 0,
          fontFamily: "Cairo, sans-serif",
        }}>
          {initials(c.name)}
        </div>

        {/* Identity */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap", marginBottom: 5 }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: "#0A1628" }}>{c.name}</span>
            <TypeChip type={c.company_type} />
            {c.customer_rank > 0 && <RoleBadge label="عميل" bg="#D1FAE5" color="#065F46" />}
            {c.supplier_rank > 0 && <RoleBadge label="مورّد" bg="#FEF3C7" color="#92400E" />}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            {c.email && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <Mail size={11} color="#CBD5E1" />
                <a href={`mailto:${c.email}`} onClick={(e) => e.stopPropagation()} style={{ fontSize: 12, color: "#3B82F6", textDecoration: "none" }}>
                  {c.email}
                </a>
              </span>
            )}
            {c.phone && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <Phone size={11} color="#CBD5E1" />
                <span style={{ fontSize: 12, color: "#64748B", direction: "ltr", display: "inline-block" }}>{c.phone}</span>
              </span>
            )}
            {(c.city || c.country_name) && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <MapPin size={11} color="#CBD5E1" />
                <span style={{ fontSize: 12, color: "#64748B" }}>
                  {[c.city, c.country_name].filter(Boolean).join("، ")}
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
          {deleteStatus === "deleting" ? (
            <div style={{ width: 14, height: 14, border: "2px solid #F1F5F9", borderTopColor: "#EF4444", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
          ) : deleteStatus === "confirming" ? (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 9, padding: "5px 8px" }}>
              <span style={{ fontSize: 11, color: "#B91C1C", fontWeight: 700, whiteSpace: "nowrap" }}>تأكيد الحذف؟</span>
              <button onClick={onDeleteConfirm} style={{ width: 24, height: 24, borderRadius: 6, border: "none", background: "#FEE2E2", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CheckCheck size={12} color="#DC2626" />
              </button>
              <button onClick={onDeleteCancel} style={{ width: 24, height: 24, borderRadius: 6, border: "none", background: "#F1F5F9", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={12} color="#94A3B8" />
              </button>
            </div>
          ) : (
            <button
              onClick={onDelete}
              title="حذف من Odoo"
              style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #E2E8F0", background: "#F8FAFC", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .12s" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#FEF2F2"; e.currentTarget.style.borderColor = "#FECACA"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#F8FAFC"; e.currentTarget.style.borderColor = "#E2E8F0"; }}
            >
              <Trash2 size={13} color="#CBD5E1" />
            </button>
          )}
          <button
            onClick={onToggle}
            style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${expanded ? "#BFDBFE" : "#E2E8F0"}`, background: expanded ? "#EFF6FF" : "#F8FAFC", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            {expanded ? <ChevronUp size={14} color="#3B82F6" /> : <ChevronDown size={14} color="#94A3B8" />}
          </button>
        </div>
      </div>

      {/* Expanded detail strip */}
      {expanded && (
        <div style={{ borderTop: "1px dashed #E2E8F0", padding: "12px 18px 14px", background: "#F8FAFC" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
            {c.street    && <DetailPill label="الشارع"              value={c.street} />}
            {c.state_name && <DetailPill label="الولاية"            value={c.state_name} />}
            {c.vat        && <DetailPill label="رقم الضريبة (VAT)"  value={c.vat} mono />}
            {c.salesperson && <DetailPill label="مندوب المبيعات"    value={c.salesperson} />}
            {c.lang       && <DetailPill label="اللغة"              value={LANG_LABEL[c.lang] ?? (c.lang || "—")} />}
            {c.website    && (
              <DetailPill
                label="الموقع الإلكتروني"
                value={c.website}
                link={c.website.startsWith("http") ? c.website : `https://${c.website}`}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Shared sub-components ──────────────────────────────────────

function TypeChip({ type }: { type: "company" | "person" }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 3,
      fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 9999,
      background: type === "company" ? "#DBEAFE" : "#F3E8FF",
      color: type === "company" ? "#1D4ED8" : "#7E22CE",
    }}>
      {type === "company" ? <Building2 size={9} /> : <User size={9} />}
      {type === "company" ? "شركة" : "فرد"}
    </span>
  );
}

function RoleBadge({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 9999, background: bg, color }}>
      {label}
    </span>
  );
}

function DetailPill({ label, value, link, mono }: { label: string; value: string; link?: string; mono?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 9, fontWeight: 700, color: "#CBD5E1", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 3 }}>
        {label}
      </div>
      {link ? (
        <a href={link} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "#3B82F6", fontWeight: 600, textDecoration: "none" }}>
          <Globe size={11} />
          {value}
        </a>
      ) : (
        <div style={{
          fontSize: 12, fontWeight: 600, color: "#1E293B",
          ...(mono ? { fontFamily: "monospace", background: "#EFF6FF", color: "#1D4ED8", padding: "2px 7px", borderRadius: 5, display: "inline-block" } : {}),
        }}>
          {value}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: React.ReactNode }) {
  return (
    <div style={{
      background: "linear-gradient(145deg, #ffffff 0%, #F4F8FF 100%)",
      borderRadius: 14,
      border: `1.5px solid ${color}22`,
      padding: "14px 18px",
      display: "flex", alignItems: "center", gap: 12,
      boxShadow: "0 2px 10px rgba(10,22,40,0.07)",
      flex: 1, minWidth: 150,
      overflow: "hidden", position: "relative",
    }}>
      <div style={{
        position: "absolute", top: 0, right: 0,
        width: 90, height: 90,
        background: `radial-gradient(circle at top right, ${color}14 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />
      <div style={{
        width: 42, height: 42, borderRadius: 11,
        background: color + "18", border: `1px solid ${color}30`,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 900, color: "#0A1628", lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 3, fontWeight: 600 }}>{label}</div>
      </div>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div style={{ padding: 56, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <div style={{ width: 48, height: 48, borderRadius: 14, background: "#FEE2E2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>⚠</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#B91C1C" }}>خطأ في الاتصال</div>
      <div style={{ fontSize: 12, color: "#94A3B8", maxWidth: 400 }}>{message}</div>
    </div>
  );
}

// ── New Contact Modal ─────────────────────────────────────────────────────────

const EMPTY_FORM: NewContactPayload = {
  name: "",
  email: "",
  phone: "",
  street: "",
  street2: "",
  city: "",
  zip: "",
  vat: "",
  website: "",
  lang: "en_US",
  job_position: "",
  comment: "",
  ref: "",
  company_type: "person",
  is_customer: true,
  is_vendor: false,
};

type ContactTab = "identity" | "address" | "info" | "notes";

const CONTACT_TABS: { id: ContactTab; label: string }[] = [
  { id: "identity", label: "الهوية" },
  { id: "address",  label: "العنوان" },
  { id: "info",     label: "جهة الاتصال" },
  { id: "notes",    label: "الملاحظات" },
];

function NewContactModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm]     = useState<NewContactPayload>(EMPTY_FORM);
  const [tab, setTab]       = useState<ContactTab>("identity");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [error, setError]   = useState("");

  function set<K extends keyof NewContactPayload>(key: K, value: NewContactPayload[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit() {
    if (!form.name.trim()) {
      setError("الاسم مطلوب");
      setTab("identity");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await createOdooContact(form);
      if (res.error) { setError(res.error); return; }
      setSaved(true);
      setTimeout(() => onCreated(), 1800);
    } catch {
      setError("حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(10,22,40,.55)",
          backdropFilter: "blur(3px)",
          zIndex: 50,
        }}
      />

      {/* Centered modal */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          width: "min(620px, calc(100vw - 32px))",
          maxHeight: "min(700px, calc(100vh - 48px))",
          background: "#fff",
          borderRadius: 16,
          zIndex: 51,
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 24px 64px rgba(10,22,40,.22)",
          overflow: "hidden",
        }}
      >
        {/* Success overlay */}
        {saved && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "#fff",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 14,
              zIndex: 10,
              borderRadius: 16,
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "#DCFCE7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CheckCheck size={30} color="#15803D" />
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, color: "#15803D", fontFamily: "Cairo, sans-serif" }}>
              تم الحفظ في Odoo بنجاح
            </div>
            <div style={{ fontSize: 13, color: "#94A3B8", fontFamily: "Cairo, sans-serif" }}>جاري تحديث القائمة...</div>
          </div>
        )}

        {/* Header */}
        <div
          style={{
            padding: "20px 24px 14px",
            borderBottom: "1px solid #E2E8F0",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 14,
            }}
          >
            <div>
              <div style={{ fontSize: 17, fontWeight: 900, color: "#0A1628" }}>
                جهة اتصال جديدة
              </div>
              <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>
                ستُحفظ مباشرة في Odoo
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                border: "1px solid #E2E8F0",
                background: "#F8FAFC",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <X size={16} color="#64748B" />
            </button>
          </div>

          {/* Tab bar */}
          <div style={{ display: "flex", gap: 4 }}>
            {CONTACT_TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  padding: "5px 14px",
                  borderRadius: 7,
                  border: "none",
                  fontFamily: "Cairo, sans-serif",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  background: tab === t.id ? "#0A1628" : "#F1F5F9",
                  color: tab === t.id ? "#fff" : "#64748B",
                  transition: "all .15s",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Form body */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
          dir="rtl"
        >
          {/* ── Identity ── */}
          {tab === "identity" && (
            <>
              <div>
                <FieldLabel>نوع جهة الاتصال</FieldLabel>
                <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                  {(["person", "company"] as const).map((t) => {
                    const active = form.company_type === t;
                    const labels = { person: "فرد", company: "شركة" };
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => set("company_type", t)}
                        style={{
                          flex: 1,
                          height: 38,
                          borderRadius: 8,
                          border: `2px solid ${active ? "#0A1628" : "#E2E8F0"}`,
                          background: active ? "#0A1628" : "#fff",
                          color: active ? "#fff" : "#64748B",
                          fontFamily: "Cairo, sans-serif",
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: "pointer",
                          transition: "all .15s",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                        }}
                      >
                        {t === "company" ? <Building2 size={14} /> : <User size={14} />}
                        {labels[t]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <FieldLabel required>الاسم</FieldLabel>
                <FormInput
                  value={form.name}
                  onChange={(v) => set("name", v)}
                  placeholder="اسم الشركة أو الشخص"
                  autoFocus
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <FieldLabel>البريد الإلكتروني</FieldLabel>
                  <FormInput
                    value={form.email ?? ""}
                    onChange={(v) => set("email", v)}
                    placeholder="example@email.com"
                    type="email"
                    dir="ltr"
                  />
                </div>
                <div>
                  <FieldLabel>الهاتف</FieldLabel>
                  <FormInput
                    value={form.phone ?? ""}
                    onChange={(v) => set("phone", v)}
                    placeholder="+218 91 000 0000"
                    type="tel"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <FieldLabel>الصفة</FieldLabel>
                <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
                  <CheckOption
                    checked={!!form.is_customer}
                    onChange={(v) => set("is_customer", v)}
                    label="عميل"
                    color="#15803D"
                    bg="#DCFCE7"
                  />
                  <CheckOption
                    checked={!!form.is_vendor}
                    onChange={(v) => set("is_vendor", v)}
                    label="مورّد"
                    color="#B45309"
                    bg="#FEF3C7"
                  />
                </div>
              </div>
            </>
          )}

          {/* ── Address ── */}
          {tab === "address" && (
            <>
              <div>
                <FieldLabel>الشارع</FieldLabel>
                <FormInput
                  value={form.street ?? ""}
                  onChange={(v) => set("street", v)}
                  placeholder="اسم الشارع ورقم المبنى"
                />
              </div>
              <div>
                <FieldLabel>الشارع 2</FieldLabel>
                <FormInput
                  value={form.street2 ?? ""}
                  onChange={(v) => set("street2", v)}
                  placeholder="الطابق، الشقة، التقاطع..."
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <FieldLabel>المدينة</FieldLabel>
                  <FormInput
                    value={form.city ?? ""}
                    onChange={(v) => set("city", v)}
                    placeholder="طرابلس، بنغازي..."
                  />
                </div>
                <div>
                  <FieldLabel>الرمز البريدي / المنطقة</FieldLabel>
                  <FormInput
                    value={form.zip ?? ""}
                    onChange={(v) => set("zip", v)}
                    placeholder="الرمز البريدي"
                    dir="ltr"
                  />
                </div>
              </div>
            </>
          )}

          {/* ── Contact info ── */}
          {tab === "info" && (
            <>
              <div>
                <FieldLabel>المنصب الوظيفي</FieldLabel>
                <FormInput
                  value={form.job_position ?? ""}
                  onChange={(v) => set("job_position", v)}
                  placeholder="مثلاً: مدير مبيعات"
                />
              </div>
              <div>
                <FieldLabel>معرّف الضريبة (VAT)</FieldLabel>
                <FormInput
                  value={form.vat ?? ""}
                  onChange={(v) => set("vat", v)}
                  placeholder="رقم التسجيل الضريبي"
                  dir="ltr"
                />
              </div>
              <div>
                <FieldLabel>الموقع الإلكتروني</FieldLabel>
                <FormInput
                  value={form.website ?? ""}
                  onChange={(v) => set("website", v)}
                  placeholder="https://..."
                  type="url"
                  dir="ltr"
                />
              </div>
              <div>
                <FieldLabel>الرقم المرجعي</FieldLabel>
                <FormInput
                  value={form.ref ?? ""}
                  onChange={(v) => set("ref", v)}
                  placeholder="رقم مرجعي داخلي"
                  dir="ltr"
                />
              </div>
              <div>
                <FieldLabel>اللغة</FieldLabel>
                <FormSelect
                  value={form.lang ?? "en_US"}
                  onChange={(v) => set("lang", v)}
                  options={[
                    { value: "en_US",  label: "English (US)" },
                    { value: "ar_001", label: "Arabic / العربية" },
                  ]}
                />
              </div>
            </>
          )}

          {/* ── Notes ── */}
          {tab === "notes" && (
            <div>
              <FieldLabel>ملاحظات داخلية</FieldLabel>
              <FormTextarea
                value={form.comment ?? ""}
                onChange={(v) => set("comment", v)}
                placeholder="ملاحظات خاصة لا تظهر للعميل..."
                rows={6}
              />
            </div>
          )}

          {error && (
            <div
              style={{
                padding: "10px 14px",
                background: "#FEE2E2",
                borderRadius: 8,
                color: "#B91C1C",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid #E2E8F0",
            display: "flex",
            gap: 10,
            flexShrink: 0,
          }}
        >
          <button
            onClick={onSubmit}
            disabled={saving || saved}
            style={{
              flex: 1,
              height: 42,
              background: saving ? "#7DD3FC" : "#0EA5E9",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontFamily: "Cairo, sans-serif",
              fontSize: 14,
              fontWeight: 700,
              cursor: saving || saved ? "not-allowed" : "pointer",
              transition: "background .15s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            {saving ? (
              <>
                <div
                  style={{
                    width: 14,
                    height: 14,
                    border: "2px solid rgba(255,255,255,.4)",
                    borderTopColor: "#fff",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
                جاري الحفظ...
              </>
            ) : (
              <>
                <Plus size={14} />
                حفظ في Odoo
              </>
            )}
          </button>
          <button
            onClick={onClose}
            style={{
              height: 42,
              padding: "0 20px",
              background: "#F1F5F9",
              color: "#475569",
              border: "none",
              borderRadius: 10,
              fontFamily: "Cairo, sans-serif",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            إلغاء
          </button>
        </div>
      </div>
    </>
  );
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>
      {children}
      {required && <span style={{ color: "#EF4444", marginRight: 3 }}>*</span>}
    </div>
  );
}

function FormInput({
  value,
  onChange,
  placeholder,
  type = "text",
  dir,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  dir?: string;
  autoFocus?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
      dir={dir ?? "rtl"}
      style={{
        width: "100%",
        height: 40,
        padding: "0 12px",
        border: "1.5px solid #E2E8F0",
        borderRadius: 8,
        fontFamily: "Cairo, sans-serif",
        fontSize: 14,
        color: "#1E293B",
        background: "#F8FAFC",
        outline: "none",
        boxSizing: "border-box",
        transition: "border-color .15s, box-shadow .15s",
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
  );
}

function CheckOption({
  checked,
  onChange,
  label,
  color,
  bg,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  color: string;
  bg: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        padding: "6px 14px",
        borderRadius: 8,
        border: `2px solid ${checked ? color : "#E2E8F0"}`,
        background: checked ? bg : "#fff",
        cursor: "pointer",
        fontFamily: "Cairo, sans-serif",
        fontSize: 13,
        fontWeight: 700,
        color: checked ? color : "#94A3B8",
        transition: "all .15s",
      }}
    >
      <div
        style={{
          width: 16,
          height: 16,
          borderRadius: 4,
          border: `2px solid ${checked ? color : "#CBD5E1"}`,
          background: checked ? color : "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          transition: "all .15s",
        }}
      >
        {checked && (
          <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
            <path d="M1 3.5L3.5 6L8 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      {label}
    </button>
  );
}

function FormTextarea({
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      dir="rtl"
      style={{
        width: "100%",
        padding: "10px 12px",
        border: "1.5px solid #E2E8F0",
        borderRadius: 8,
        fontFamily: "Cairo, sans-serif",
        fontSize: 14,
        color: "#1E293B",
        background: "#F8FAFC",
        outline: "none",
        resize: "vertical",
        boxSizing: "border-box",
        transition: "border-color .15s, box-shadow .15s",
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
  );
}

function FormSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%",
        height: 40,
        padding: "0 12px",
        border: "1.5px solid #E2E8F0",
        borderRadius: 8,
        fontFamily: "Cairo, sans-serif",
        fontSize: 14,
        color: "#1E293B",
        background: "#F8FAFC",
        outline: "none",
        cursor: "pointer",
        boxSizing: "border-box",
        appearance: "none",
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

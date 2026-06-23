"use client";
import React, { useEffect, useMemo, useState } from "react";
import {
  RefreshCw, Search, Package, TrendingUp, ShoppingCart,
  Archive, ChevronDown, ChevronUp, Tag,
} from "lucide-react";
import { type OdooProductRow, syncOdooProducts } from "@/lib/api";

const TYPE_LABEL: Record<string, string> = {
  product: "بضاعة",
  consu:   "استهلاكي",
  service: "خدمة",
  combo:   "مجموعة",
};

const TYPE_PAL: Record<string, { bg: string; color: string }> = {
  product: { bg: "#DBEAFE", color: "#1D4ED8" },
  consu:   { bg: "#FEF3C7", color: "#B45309" },
  service: { bg: "#D1FAE5", color: "#065F46" },
  combo:   { bg: "#F3E8FF", color: "#7E22CE" },
};

export default function OdooProductsPage() {
  const [products, setProducts] = useState<OdooProductRow[]>([]);
  const [search, setSearch]     = useState("");
  const [syncing, setSyncing]   = useState(false);
  const [error, setError]       = useState("");
  const [syncedAt, setSyncedAt] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("awl_odoo_products");
      if (raw) { const { data, synced_at } = JSON.parse(raw); setProducts(data ?? []); setSyncedAt(synced_at ?? ""); }
    } catch {}
  }, []);

  async function onSync() {
    setSyncing(true);
    setError("");
    try {
      const json = await syncOdooProducts();
      if (json.error) { setError(json.error); return; }
      setProducts(json.data ?? []);
      setSyncedAt(json.synced_at ?? "");
      try { localStorage.setItem("awl_odoo_products", JSON.stringify({ data: json.data, synced_at: json.synced_at })); } catch {}
    } catch {
      setError("فشلت المزامنة — تحقق من إعدادات Odoo");
    } finally {
      setSyncing(false);
    }
  }

  const shown = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.trim().toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.barcode.toLowerCase().includes(q) ||
        p.default_code.toLowerCase().includes(q) ||
        p.categ_name.toLowerCase().includes(q),
    );
  }, [products, search]);

  const inStock    = products.filter((p) => p.qty_available > 10).length;
  const lowStock   = products.filter((p) => p.qty_available > 0 && p.qty_available <= 10).length;
  const outOfStock = products.filter((p) => p.qty_available <= 0).length;

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto" }} dir="rtl">

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
            <Package size={22} color="#714B67" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "#0A1628", letterSpacing: "-.02em", lineHeight: 1.2 }}>
                المنتجات
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
              <span style={{ fontSize: 11, color: "#94A3B8", fontFamily: "monospace", direction: "ltr" }}>product.template</span>
              {syncedAt && (
                <>
                  <span style={{ width: 3, height: 3, borderRadius: "50%", background: "#CBD5E1", flexShrink: 0 }} />
                  <span style={{ fontSize: 11, fontWeight: 600, background: "rgba(34,197,94,0.08)", color: "#15803D", border: "1px solid rgba(34,197,94,0.18)", padding: "2px 8px", borderRadius: 9999 }}>
                    {new Date(syncedAt).toLocaleDateString("ar", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" } as Intl.DateTimeFormatOptions)}
                  </span>
                </>
              )}
              {products.length > 0 && (
                <span style={{ fontSize: 11, fontWeight: 700, background: "rgba(113,75,103,0.08)", color: "#714B67", border: "1px solid rgba(113,75,103,0.18)", padding: "2px 8px", borderRadius: 9999 }}>
                  {products.length} منتج
                </span>
              )}
            </div>
          </div>
        </div>
        <SyncBtn syncing={syncing} onClick={onSync} />
      </div>

      {/* STAT CARDS */}
      {products.length > 0 && (
        <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
          <StatCard label="إجمالي المنتجات" value={products.length} color="#6366F1" icon={<Package size={18} color="#6366F1" />} />
          <StatCard label="متوفر بالمخزون" value={inStock} color="#10B981" icon={<TrendingUp size={18} color="#10B981" />} />
          <StatCard label="مخزون منخفض" value={lowStock} color="#F59E0B" icon={<ShoppingCart size={18} color="#F59E0B" />} />
          <StatCard label="نفذ من المخزون" value={outOfStock} color="#EF4444" icon={<Archive size={18} color="#EF4444" />} />
        </div>
      )}

      {/* SEARCH BAR */}
      <div style={{
        background: "linear-gradient(145deg, #ffffff 0%, #F4F8FF 100%)",
        borderRadius: 14, border: "1px solid rgba(14,165,233,0.10)",
        padding: "10px 14px", display: "flex", alignItems: "center", gap: 10,
        marginBottom: 16, boxShadow: "0 2px 8px rgba(10,22,40,0.05)",
      }}>
        <div style={{ position: "relative", flex: 1, maxWidth: 440 }}>
          <Search size={13} style={{ position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", color: "#CBD5E1", pointerEvents: "none" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالاسم، الفئة، الرقم المرجعي، الباركود..."
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
          <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600 }}>{shown.length} منتج</span>
        )}
      </div>

      {/* CONTENT */}
      {error && <ErrorBanner message={error} />}

      {syncing && products.length === 0 && (
        <div style={{ padding: 80 }}><Spinner label="جاري المزامنة..." /></div>
      )}

      {!syncing && !error && shown.length === 0 && (
        <EmptyState
          icon={<Package size={36} color="#0EA5E9" style={{ opacity: 0.55 }} />}
          title={products.length === 0 ? "لم يتم جلب البيانات بعد" : "لا توجد نتائج"}
          subtitle={products.length === 0 ? "اضغط مزامنة لجلب المنتجات من Odoo" : "لا توجد منتجات تطابق بحثك"}
          action={products.length === 0 ? <SyncBtn syncing={syncing} onClick={onSync} size="lg" /> : undefined}
        />
      )}

      {!error && shown.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(288px, 1fr))", gap: 14 }}>
          {shown.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              expanded={expanded === p.id}
              onToggle={() => setExpanded(expanded === p.id ? null : p.id)}
            />
          ))}
        </div>
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

// ── ProductCard ────────────────────────────────────────────────

function ProductCard({
  product: p,
  expanded,
  onToggle,
}: {
  product: OdooProductRow;
  expanded: boolean;
  onToggle: () => void;
}) {
  const pal   = TYPE_PAL[p.type]   ?? { bg: "#F1F5F9", color: "#475569" };
  const label = TYPE_LABEL[p.type] ?? p.type;

  const stockZero  = p.qty_available <= 0;
  const stockLow   = !stockZero && p.qty_available <= 10;
  const stockColor = stockZero ? "#B91C1C" : stockLow ? "#92400E" : "#065F46";
  const stockBg    = stockZero ? "#FEE2E2" : stockLow ? "#FEF3C7" : "#D1FAE5";
  const stockLabel = stockZero ? "نفذ" : stockLow ? "منخفض" : "متوفر";

  return (
    <div
      style={{
        background: "linear-gradient(145deg, #ffffff 0%, #F5F9FF 100%)",
        borderRadius: 16,
        border: `1.5px solid ${expanded ? "rgba(14,165,233,0.32)" : "rgba(14,165,233,0.10)"}`,
        boxShadow: expanded
          ? "0 10px 36px rgba(10,22,40,0.12)"
          : "0 2px 10px rgba(10,22,40,0.06)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        transition: "box-shadow .2s, border-color .2s, transform .2s",
      }}
      onMouseEnter={(e) => {
        if (!expanded) {
          const el = e.currentTarget as HTMLElement;
          el.style.transform = "translateY(-2px)";
          el.style.boxShadow = "0 8px 24px rgba(10,22,40,0.10)";
          el.style.borderColor = "rgba(14,165,233,0.22)";
        }
      }}
      onMouseLeave={(e) => {
        if (!expanded) {
          const el = e.currentTarget as HTMLElement;
          el.style.transform = "translateY(0)";
          el.style.boxShadow = "0 2px 10px rgba(10,22,40,0.06)";
          el.style.borderColor = "rgba(14,165,233,0.10)";
        }
      }}
    >
      {/* Image area */}
      <div
        style={{
          height: 148,
          background: p.image_128
            ? "#F8FAFC"
            : `linear-gradient(145deg, ${pal.bg} 0%, #ffffff 100%)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderBottom: "1px solid #F1F5F9",
          position: "relative",
        }}
      >
        {p.image_128 ? (
          <img
            src={`data:image/png;base64,${p.image_128}`}
            alt={p.name}
            style={{ maxHeight: 116, maxWidth: "80%", objectFit: "contain" }}
          />
        ) : (
          <div style={{ textAlign: "center", opacity: 0.45 }}>
            <Package size={40} color={pal.color} />
            <div style={{ fontSize: 9, fontWeight: 800, color: pal.color, marginTop: 6, letterSpacing: ".1em", textTransform: "uppercase" }}>
              {label}
            </div>
          </div>
        )}
        {/* Type chip */}
        <span
          style={{
            position: "absolute", top: 10, right: 10,
            fontSize: 10, fontWeight: 800, padding: "3px 9px",
            borderRadius: 9999, background: pal.bg, color: pal.color,
            boxShadow: "0 1px 4px rgba(0,0,0,.08)",
          }}
        >
          {label}
        </span>
        {/* Stock dot */}
        <span
          style={{
            position: "absolute", top: 10, left: 10,
            display: "inline-flex", alignItems: "center", gap: 4,
            fontSize: 10, fontWeight: 800, padding: "3px 9px",
            borderRadius: 9999, background: stockBg, color: stockColor,
            boxShadow: "0 1px 4px rgba(0,0,0,.07)",
          }}
        >
          <span style={{ fontFamily: "monospace", direction: "ltr" }}>{p.qty_available}</span>
          {stockLabel}
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: "14px 16px", flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
        {/* Name */}
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#0A1628", lineHeight: 1.35, marginBottom: 6 }}>
            {p.name}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {p.categ_name && (
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 3,
                fontSize: 10, fontWeight: 700, padding: "2px 8px",
                borderRadius: 9999, background: "#F1F5F9", color: "#64748B",
              }}>
                <Tag size={9} />
                {p.categ_name}
              </span>
            )}
          </div>
          {p.description_sale && (
            <div style={{
              fontSize: 11, color: "#94A3B8", marginTop: 6, lineHeight: 1.6,
              display: "-webkit-box", overflow: "hidden",
              WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
            }}>
              {p.description_sale}
            </div>
          )}
        </div>

        <div style={{ height: 1, background: "#F1F5F9" }} />

        {/* Prices */}
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#CBD5E1", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 3 }}>سعر البيع</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#0EA5E9", direction: "ltr", lineHeight: 1 }}>
              {p.list_price.toFixed(2)}
              <span style={{ fontSize: 11, fontWeight: 600, color: "#64748B", marginRight: 2 }}>د.ل</span>
            </div>
          </div>
          {p.standard_price > 0 && (
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#CBD5E1", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 3 }}>التكلفة</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#94A3B8", direction: "ltr", lineHeight: 1 }}>
                {p.standard_price.toFixed(2)}
                <span style={{ fontSize: 10, fontWeight: 600, marginRight: 2 }}>د.ل</span>
              </div>
            </div>
          )}
        </div>

        {/* Ref + Barcode + expand */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {p.default_code && (
              <span style={{ fontSize: 10, fontFamily: "monospace", background: "#F1F5F9", color: "#475569", padding: "2px 7px", borderRadius: 5, direction: "ltr" }}>
                {p.default_code}
              </span>
            )}
            {p.barcode && (
              <span style={{ fontSize: 10, fontFamily: "monospace", background: "#F0FDF4", color: "#15803D", padding: "2px 7px", borderRadius: 5, direction: "ltr" }}>
                {p.barcode}
              </span>
            )}
          </div>
          <button
            onClick={onToggle}
            style={{
              display: "inline-flex", alignItems: "center", gap: 3,
              fontSize: 11, fontWeight: 700,
              color: expanded ? "#3B82F6" : "#94A3B8",
              background: "transparent", border: "none", cursor: "pointer",
              padding: 0, fontFamily: "Cairo, sans-serif",
            }}
          >
            {expanded ? "إخفاء" : "تفاصيل"}
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div style={{ borderTop: "1px dashed #E2E8F0", padding: "12px 16px", background: "#F8FAFC", display: "flex", flexWrap: "wrap", gap: 18 }}>
          <MiniField label="يُباع" value={p.sale_ok ? "✓ نعم" : "لا"} />
          <MiniField label="يُشترى" value={p.purchase_ok ? "✓ نعم" : "لا"} />
          {p.weight > 0 && <MiniField label="الوزن (كغ)" value={String(p.weight)} />}
          {p.volume > 0 && <MiniField label="الحجم (م³)" value={String(p.volume)} />}
        </div>
      )}
    </div>
  );
}

// ── Shared helpers ─────────────────────────────────────────────

function MiniField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 9, fontWeight: 700, color: "#CBD5E1", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#1E293B" }}>{value}</div>
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
      flex: 1, minWidth: 140,
      overflow: "hidden", position: "relative",
    }}>
      <div style={{
        position: "absolute", top: 0, right: 0,
        width: 90, height: 90,
        background: `radial-gradient(circle at top right, ${color}12 0%, transparent 70%)`,
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

function Spinner({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <div style={{ width: 28, height: 28, border: "3px solid #F1F5F9", borderTopColor: "#0EA5E9", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <span style={{ fontSize: 13, color: "#CBD5E1" }}>{label}</span>
    </div>
  );
}

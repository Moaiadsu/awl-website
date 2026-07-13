"use client";
import { useEffect, useMemo, useState } from "react";
import {
  getProducts,
  getTrending, setTrending, removeTrending,
  getOffers,   setOffer,   removeOffer,
} from "@/lib/api";
import {
  TrendingUp, TrendingDown, Package, Tag, X, Percent,
} from "lucide-react";

type Product = {
  id: string;
  name: string;
  name_ar: string;
  category: string;
  price: number;
  unit: string;
  stock: number;
  min_qty: number;
  image_url: string;
  barcode: string;
};

type Tab = "trending" | "offers";

const CAT_PALETTE: Record<string, { bg: string; fg: string; accent: string }> = {
  wholesale: { bg: "#EFF6FF", fg: "#1D4ED8", accent: "#3B82F6" },
  retail:    { bg: "#F5F3FF", fg: "#6D28D9", accent: "#7C3AED" },
  vip:       { bg: "#FFFBEB", fg: "#92400E", accent: "#F59E0B" },
  standard:  { bg: "#F0FDF4", fg: "#166534", accent: "#22C55E" },
};
const DEFAULT_CAT = { bg: "#E0F2FE", fg: "#0284C7", accent: "#0EA5E9" };

export default function TrendingOffersPage() {
  const [products, setProducts]     = useState<Product[]>([]);
  const [trendMap, setTrendMap]     = useState<Map<string, number>>(new Map());
  const [offersMap, setOffersMap]   = useState<Map<string, number>>(new Map());
  const [tab, setTab]               = useState<Tab>("trending");
  const [search, setSearch]         = useState("");

  const reload = () => {
    getProducts().then(setProducts).catch(() => {});
    getTrending().then(setTrendMap).catch(() => {});
    getOffers().then(setOffersMap).catch(() => {});
  };

  useEffect(() => { reload(); }, []);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        (p.name_ar ?? "").toLowerCase().includes(q) ||
        (p.name    ?? "").toLowerCase().includes(q) ||
        (p.barcode ?? "").toLowerCase().startsWith(q),
    );
  }, [products, search]);

  // ── Trending handlers ──────────────────────────────────────────────────────

  const onSetTrending = async (p: Product) => {
    const current = trendMap.get(p.id);
    const raw = window.prompt(
      `نسبة التغيّر ٪ للمنتج "${p.name_ar || p.name}"\n(موجبة = صاعد ▲ ، سالبة = هابط ▼)`,
      current !== undefined ? String(current) : "",
    );
    if (raw === null) return;
    const percent = parseFloat(raw.replace(",", "."));
    if (isNaN(percent)) { window.alert("أدخل رقماً صحيحاً، مثال: 12.5 أو -3"); return; }
    try { await setTrending(p.id, percent); reload(); }
    catch (e) { window.alert(e instanceof Error ? e.message : "فشل الحفظ"); }
  };

  const onRemoveTrending = async (p: Product) => {
    try { await removeTrending(p.id); reload(); }
    catch (e) { window.alert(e instanceof Error ? e.message : "فشل الحذف"); }
  };

  // ── Offers handlers ────────────────────────────────────────────────────────

  const onSetOffer = async (p: Product) => {
    const current = offersMap.get(p.id);
    const raw = window.prompt(
      `نسبة الخصم ٪ للمنتج "${p.name_ar || p.name}"\n(مثال: 20 يعني خصم 20%)`,
      current !== undefined ? String(current) : "",
    );
    if (raw === null) return;
    const percent = parseFloat(raw.replace(",", "."));
    if (isNaN(percent) || percent < 0) { window.alert("أدخل رقماً موجباً، مثال: 20"); return; }
    try { await setOffer(p.id, percent); reload(); }
    catch (e) { window.alert(e instanceof Error ? e.message : "فشل الحفظ"); }
  };

  const onRemoveOffer = async (p: Product) => {
    try { await removeOffer(p.id); reload(); }
    catch (e) { window.alert(e instanceof Error ? e.message : "فشل الحذف"); }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }} dir="rtl">

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
            <TrendingUp size={22} color="#0EA5E9" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "#0A1628", letterSpacing: "-.02em", lineHeight: 1.2 }}>
              الرائج والعروض
            </h1>
            <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 5 }}>
              إدارة المنتجات الرائجة والعروض الخاصة
            </div>
          </div>
        </div>

        {/* Stat badges */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, fontWeight: 700, background: "rgba(16,185,129,0.08)", color: "#065F46", border: "1px solid rgba(16,185,129,0.20)", padding: "4px 12px", borderRadius: 9999 }}>
            <TrendingUp size={11} style={{ verticalAlign: "middle", marginLeft: 4 }} />
            {trendMap.size} رائج
          </span>
          <span style={{ fontSize: 12, fontWeight: 700, background: "rgba(249,115,22,0.08)", color: "#9A3412", border: "1px solid rgba(249,115,22,0.20)", padding: "4px 12px", borderRadius: 9999 }}>
            <Percent size={11} style={{ verticalAlign: "middle", marginLeft: 4 }} />
            {offersMap.size} عرض
          </span>
        </div>
      </div>

      {/* ── TABS ─────────────────────────────────── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {([ ["trending", "المنتجات الرائجة", TrendingUp, "#10B981"], ["offers", "العروض", Percent, "#F97316"] ] as const).map(([key, label, Icon, color]) => (
          <button
            key={key}
            onClick={() => setTab(key as Tab)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "8px 20px", borderRadius: 10, cursor: "pointer",
              fontSize: 14, fontWeight: 700,
              background: tab === key ? color + "18" : "#F8FAFC",
              color: tab === key ? color : "#64748B",
              border: `1.5px solid ${tab === key ? color + "44" : "#E2E8F0"}`,
              transition: "all .15s",
            }}
          >
            <Icon size={15} />
            {label}
            <span style={{
              fontSize: 11, fontWeight: 800, padding: "1px 7px", borderRadius: 9999,
              background: tab === key ? color + "22" : "#E2E8F0",
              color: tab === key ? color : "#94A3B8",
            }}>
              {key === "trending" ? trendMap.size : offersMap.size}
            </span>
          </button>
        ))}
      </div>

      {/* ── SEARCH ─────────────────────────────────── */}
      <div style={{
        background: "linear-gradient(145deg, #ffffff 0%, #F4F8FF 100%)",
        borderRadius: 14, border: "1px solid rgba(14,165,233,0.10)",
        boxShadow: "0 2px 8px rgba(10,22,40,0.05)",
        padding: "12px 20px", marginBottom: 18,
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="البحث في المنتجات..."
          style={{
            flex: 1, height: 36, padding: "0 12px",
            border: "1.5px solid rgba(14,165,233,0.12)", borderRadius: 9,
            fontFamily: "Cairo, sans-serif", fontSize: 14, color: "#1E293B",
            background: "#F8FBFF", outline: "none", direction: "rtl",
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = "#0EA5E9"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(14,165,233,.10)"; }}
          onBlur={(e)  => { e.currentTarget.style.borderColor = "rgba(14,165,233,0.12)"; e.currentTarget.style.boxShadow = "none"; }}
        />
        <span style={{ fontSize: 12, color: "#64748B", fontWeight: 700, background: "rgba(14,165,233,0.07)", border: "1px solid rgba(14,165,233,0.12)", padding: "4px 12px", borderRadius: 9999, whiteSpace: "nowrap" }}>
          {shown.length} منتج
        </span>
      </div>

      {/* ── CARD GRID ─────────────────────────────────── */}
      {shown.length === 0 ? (
        <div style={{ textAlign: "center", padding: 80, color: "#CBD5E1" }}>
          <Package size={48} style={{ margin: "0 auto 16px", opacity: 0.2 }} />
          <div style={{ fontSize: 15, fontWeight: 700, color: "#94A3B8" }}>لا توجد منتجات</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
          {shown.map((p) =>
            tab === "trending" ? (
              <TrendingCard
                key={p.id}
                product={p}
                percent={trendMap.get(p.id)}
                onSet={() => onSetTrending(p)}
                onRemove={() => onRemoveTrending(p)}
              />
            ) : (
              <OfferCard
                key={p.id}
                product={p}
                percent={offersMap.get(p.id)}
                onSet={() => onSetOffer(p)}
                onRemove={() => onRemoveOffer(p)}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}

/* ── Shared banner ─────────────────────────────────── */

function ProductBanner({ product: p }: { product: Product }) {
  const cat = CAT_PALETTE[(p.category ?? "").toLowerCase()] ?? DEFAULT_CAT;
  const stockZero = p.stock <= 0;
  const stockLow  = !stockZero && p.stock <= 10;

  return (
    <div style={{
      height: 120,
      background: `linear-gradient(145deg, ${cat.bg} 0%, #ffffff 100%)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      borderBottom: "1px solid #F1F5F9", position: "relative", overflow: "hidden",
    }}>
      {p.image_url ? (
        <img
          src={p.image_url}
          alt={p.name_ar || p.name}
          style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }}
        />
      ) : (
        <div style={{ textAlign: "center", opacity: 0.5 }}>
          <Package size={38} color={cat.accent} />
        </div>
      )}
      {/* Category chip */}
      <span style={{
        position: "absolute", top: 10, right: 10,
        display: "inline-flex", alignItems: "center", gap: 3,
        fontSize: 10, fontWeight: 800, padding: "3px 9px",
        borderRadius: 9999, background: cat.bg, color: cat.fg,
        boxShadow: "0 1px 4px rgba(0,0,0,.08)",
      }}>
        <Tag size={8} />
        {p.category || "—"}
      </span>
      {/* Stock dot */}
      <span style={{
        position: "absolute", top: 10, left: 10,
        display: "inline-flex", alignItems: "center", gap: 4,
        fontSize: 10, fontWeight: 800, padding: "3px 9px",
        borderRadius: 9999,
        background: stockZero ? "#FEE2E2" : stockLow ? "#FEF3C7" : "#D1FAE5",
        color: stockZero ? "#B91C1C" : stockLow ? "#92400E" : "#065F46",
        boxShadow: "0 1px 4px rgba(0,0,0,.08)",
      }}>
        <span style={{ width: 5, height: 5, borderRadius: "50%", background: stockZero ? "#EF4444" : stockLow ? "#F59E0B" : "#22C55E" }} />
        {stockZero ? "نفذ" : stockLow ? "منخفض" : "متوفر"}
      </span>
    </div>
  );
}

/* ── TrendingCard ─────────────────────────────────── */

function TrendingCard({
  product: p, percent, onSet, onRemove,
}: { product: Product; percent?: number; onSet: () => void; onRemove: () => void }) {
  const isTrending = percent !== undefined;
  const trendUp    = (percent ?? 0) >= 0;

  return (
    <div style={{
      background: "linear-gradient(145deg, #ffffff 0%, #F5F9FF 100%)",
      borderRadius: 16, border: "1.5px solid rgba(14,165,233,0.10)",
      boxShadow: "0 2px 10px rgba(10,22,40,0.06)", overflow: "hidden",
      display: "flex", flexDirection: "column",
    }}>
      <ProductBanner product={p} />
      <div style={{ padding: "14px 16px", flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#0A1628", lineHeight: 1.35 }}>
          {p.name_ar || p.name}
        </div>
        <div style={{ fontSize: 20, fontWeight: 900, color: "#0EA5E9", lineHeight: 1 }}>
          {p.price.toFixed(2)}
          <span style={{ fontSize: 11, fontWeight: 600, color: "#64748B", marginRight: 3 }}>د.ل</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, paddingTop: 8, borderTop: "1px dashed rgba(14,165,233,0.08)", marginTop: "auto" }}>
          {isTrending ? (
            <>
              <span
                onClick={onSet}
                title="انقر لتعديل النسبة"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 4, cursor: "pointer",
                  fontSize: 12, fontWeight: 900, padding: "4px 10px", borderRadius: 9999,
                  direction: "ltr",
                  background: trendUp ? "#D1FAE5" : "#FEE2E2",
                  color: trendUp ? "#065F46" : "#B91C1C",
                  border: `1px solid ${trendUp ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}`,
                }}
              >
                {trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {trendUp ? "+" : ""}{percent}%
              </span>
              <button
                onClick={onRemove}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 3, cursor: "pointer",
                  fontSize: 11, fontWeight: 700, padding: "4px 8px", borderRadius: 8,
                  background: "#F8FAFC", color: "#64748B", border: "1px solid #E2E8F0",
                }}
              >
                <X size={11} /> إزالة
              </button>
            </>
          ) : (
            <button
              onClick={onSet}
              style={{
                display: "inline-flex", alignItems: "center", gap: 4, cursor: "pointer",
                fontSize: 11, fontWeight: 800, padding: "5px 10px", borderRadius: 8,
                background: "rgba(14,165,233,0.07)", color: "#0284C7",
                border: "1px solid rgba(14,165,233,0.20)",
              }}
            >
              <TrendingUp size={12} /> إضافة للرائج
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── OfferCard ─────────────────────────────────── */

function OfferCard({
  product: p, percent, onSet, onRemove,
}: { product: Product; percent?: number; onSet: () => void; onRemove: () => void }) {
  const hasOffer = percent !== undefined;

  return (
    <div style={{
      background: "linear-gradient(145deg, #ffffff 0%, #FFF8F5 100%)",
      borderRadius: 16, border: `1.5px solid ${hasOffer ? "rgba(249,115,22,0.20)" : "rgba(14,165,233,0.10)"}`,
      boxShadow: "0 2px 10px rgba(10,22,40,0.06)", overflow: "hidden",
      display: "flex", flexDirection: "column",
    }}>
      <ProductBanner product={p} />
      <div style={{ padding: "14px 16px", flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#0A1628", lineHeight: 1.35 }}>
          {p.name_ar || p.name}
        </div>
        <div style={{ fontSize: 20, fontWeight: 900, color: "#0EA5E9", lineHeight: 1 }}>
          {p.price.toFixed(2)}
          <span style={{ fontSize: 11, fontWeight: 600, color: "#64748B", marginRight: 3 }}>د.ل</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, paddingTop: 8, borderTop: "1px dashed rgba(249,115,22,0.10)", marginTop: "auto" }}>
          {hasOffer ? (
            <>
              <span
                onClick={onSet}
                title="انقر لتعديل نسبة الخصم"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 4, cursor: "pointer",
                  fontSize: 12, fontWeight: 900, padding: "4px 10px", borderRadius: 9999,
                  direction: "ltr",
                  background: "#FFF0E6", color: "#9A3412",
                  border: "1px solid rgba(249,115,22,0.30)",
                }}
              >
                <Percent size={12} />
                -{percent}%
              </span>
              <button
                onClick={onRemove}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 3, cursor: "pointer",
                  fontSize: 11, fontWeight: 700, padding: "4px 8px", borderRadius: 8,
                  background: "#F8FAFC", color: "#64748B", border: "1px solid #E2E8F0",
                }}
              >
                <X size={11} /> إزالة
              </button>
            </>
          ) : (
            <button
              onClick={onSet}
              style={{
                display: "inline-flex", alignItems: "center", gap: 4, cursor: "pointer",
                fontSize: 11, fontWeight: 800, padding: "5px 10px", borderRadius: 8,
                background: "rgba(249,115,22,0.07)", color: "#C2410C",
                border: "1px solid rgba(249,115,22,0.20)",
              }}
            >
              <Percent size={12} /> إضافة عرض
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

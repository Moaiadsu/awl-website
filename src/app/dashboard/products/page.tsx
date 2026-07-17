"use client";
import { useEffect, useMemo, useState } from "react";
import { getProducts } from "@/lib/api";
import { Search, Tag, Package, TrendingUp, ShoppingCart, Archive, Layers, Boxes } from "lucide-react";
import { SkeletonCards } from "@/components/ui/Skeleton";

type ProductVariant = {
  id: string;
  label: string;
  label_ar: string;
  price: number;
  stock: number;
  barcode: string;
  image_url: string; // variant photo; "" = falls back to the product image
};

// Sellable pack size from Odoo's product.packaging (e.g. name_ar="حزمة x
// صندوق" qty=60) — no price of its own, just a quantity shortcut.
type ProductPackaging = {
  id: string;
  name: string;
  name_ar: string;
  qty: number;
};

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
  variants: ProductVariant[];
  packagings: ProductPackaging[];
};

const CAT_PALETTE: Record<string, { bg: string; fg: string; accent: string }> = {
  wholesale: { bg: "#EFF6FF", fg: "#1D4ED8", accent: "#3B82F6" },
  retail:    { bg: "#F5F3FF", fg: "#6D28D9", accent: "#7C3AED" },
  vip:       { bg: "#FFFBEB", fg: "#92400E", accent: "#F59E0B" },
  standard:  { bg: "#F0FDF4", fg: "#166534", accent: "#22C55E" },
};
const DEFAULT_CAT = { bg: "#E0F2FE", fg: "#0284C7", accent: "#0EA5E9" };

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [variantsOnly, setVariantsOnly] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProducts().then(setProducts).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const variantCount = useMemo(
    () => products.filter((p) => (p.variants?.length ?? 0) > 0).length,
    [products],
  );

  const shown = useMemo(() => {
    let list = products;
    if (variantsOnly) list = list.filter((p) => (p.variants?.length ?? 0) > 0);
    if (!search.trim()) return list;
    const q = search.trim().toLowerCase();
    return list.filter(
      (p) =>
        (p.name_ar ?? "").toLowerCase().includes(q) ||
        (p.name ?? "").toLowerCase().includes(q) ||
        (p.category ?? "").toLowerCase().includes(q),
    );
  }, [products, search, variantsOnly]);

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
            <Package size={22} color="#0EA5E9" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "#0A1628", letterSpacing: "-.02em", lineHeight: 1.2 }}>
              المنتجات
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, color: "#94A3B8" }}>منتجات التطبيق المتاحة للتجار</span>
              {products.length > 0 && (
                <span style={{ fontSize: 11, fontWeight: 700, background: "rgba(14,165,233,0.08)", color: "#0284C7", border: "1px solid rgba(14,165,233,0.18)", padding: "2px 8px", borderRadius: 9999 }}>
                  {products.length} منتج
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── STAT CARDS ─────────────────────────────────── */}
      {products.length > 0 && (
        <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
          {[
            { label: "إجمالي المنتجات", value: products.length, color: "#6366F1", icon: <Package size={18} color="#6366F1" /> },
            { label: "متوفر بالمخزون", value: products.filter((p) => p.stock > 10).length, color: "#10B981", icon: <TrendingUp size={18} color="#10B981" /> },
            { label: "مخزون منخفض", value: products.filter((p) => p.stock > 0 && p.stock <= 10).length, color: "#F59E0B", icon: <ShoppingCart size={18} color="#F59E0B" /> },
            { label: "نفذ من المخزون", value: products.filter((p) => p.stock <= 0).length, color: "#EF4444", icon: <Archive size={18} color="#EF4444" /> },
            { label: "منتجات بمتغيرات", value: variantCount, color: "#7C3AED", icon: <Layers size={18} color="#7C3AED" /> },
          ].map((s) => (
            <div key={s.label} style={{
              background: "linear-gradient(145deg, #ffffff 0%, #F4F8FF 100%)",
              borderRadius: 14, border: `1.5px solid ${s.color}22`,
              padding: "14px 18px", display: "flex", alignItems: "center", gap: 12,
              boxShadow: "0 2px 10px rgba(10,22,40,0.07)", flex: 1, minWidth: 150,
              overflow: "hidden", position: "relative",
            }}>
              <div style={{ position: "absolute", top: 0, right: 0, width: 90, height: 90, background: `radial-gradient(circle at top right, ${s.color}14 0%, transparent 70%)`, pointerEvents: "none" }} />
              <div style={{ width: 42, height: 42, borderRadius: 11, background: s.color + "18", border: `1px solid ${s.color}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {s.icon}
              </div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 900, color: "#0A1628", lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 3, fontWeight: 600 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── TOOLBAR ─────────────────────────────────── */}
      <div
        style={{
          background: "linear-gradient(145deg, #ffffff 0%, #F4F8FF 100%)",
          borderRadius: 14,
          border: "1px solid rgba(14,165,233,0.10)",
          boxShadow: "0 2px 8px rgba(10,22,40,0.05)",
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 18,
        }}
      >
        <div style={{ position: "relative", flex: 1, minWidth: 220, maxWidth: 360 }}>
          <Search
            size={15}
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
            placeholder="البحث في المنتجات..."
            style={{
              height: 36,
              width: "100%",
              padding: "0 40px 0 12px",
              border: "1.5px solid rgba(14,165,233,0.12)",
              borderRadius: 9,
              fontFamily: "Cairo, sans-serif",
              fontSize: 14,
              color: "#1E293B",
              background: "#F8FBFF",
              outline: "none",
              direction: "rtl",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#0EA5E9";
              e.currentTarget.style.background = "#fff";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(14,165,233,.10)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "rgba(14,165,233,0.12)";
              e.currentTarget.style.background = "#F8FBFF";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
        </div>

        {/* Variants-only filter */}
        <button
          onClick={() => setVariantsOnly((v) => !v)}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 12, fontWeight: 800, padding: "6px 14px",
            borderRadius: 9999, cursor: "pointer",
            fontFamily: "Cairo, sans-serif",
            background: variantsOnly ? "#7C3AED" : "#F5F3FF",
            color: variantsOnly ? "#fff" : "#6D28D9",
            border: `1.5px solid ${variantsOnly ? "#7C3AED" : "rgba(124,58,237,0.25)"}`,
            transition: "background .15s, color .15s",
          }}
        >
          <Layers size={13} />
          المتغيرات فقط
        </button>

        <div
          style={{
            marginRight: "auto",
            fontSize: 12,
            color: "#64748B",
            fontWeight: 700,
            background: "rgba(14,165,233,0.07)",
            border: "1px solid rgba(14,165,233,0.12)",
            padding: "4px 12px",
            borderRadius: 9999,
          }}
        >
          {shown.length} منتج
        </div>
      </div>

      {/* ── CARD GRID ─────────────────────────────────── */}
      {loading ? (
        <SkeletonCards count={8} />
      ) : shown.length === 0 ? (
        <div style={{ textAlign: "center", padding: 80, color: "#CBD5E1" }}>
          <Package size={48} style={{ margin: "0 auto 16px", opacity: 0.2 }} />
          <div style={{ fontSize: 15, fontWeight: 700, color: "#94A3B8" }}>لا توجد منتجات</div>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 14,
          }}
        >
          {shown.map((p) => (
            <AppProductCard
              key={p.id}
              product={p}
              onOpen={() => setSelected(p)}
            />
          ))}
        </div>
      )}

      {selected && (
        <ProductDialog product={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

/* ── VariantChip ─────────────────────────────────────
   Structured chip: [attribute] [value] [price | نفذ].
   Labels arrive as "attribute: value" from the Odoo sync; the parts are
   split so each gets its own visual weight instead of one flat string.
   Long values (full shampoo descriptions …) truncate with the complete
   text available on hover. */

function VariantChip({
  variant: v,
  selected = false,
  onClick,
}: {
  variant: ProductVariant;
  selected?: boolean;
  onClick?: () => void;
}) {
  const raw = v.label_ar || v.label;
  const sep = raw.indexOf(": ");
  const attr = sep > 0 ? raw.slice(0, sep) : "";
  const value = sep > 0 ? raw.slice(sep + 2) : raw;
  const inStock = v.stock > 0;

  return (
    <span
      title={`${raw} — ${inStock ? `المخزون: ${v.stock}` : "نفذ من المخزون"}`}
      onClick={onClick && ((e) => { e.stopPropagation(); onClick(); })}
      style={{
        display: "inline-flex",
        alignItems: "stretch",
        borderRadius: 8,
        border: selected
          ? "1.5px solid #7C3AED"
          : "1px solid rgba(124,58,237,0.18)",
        boxShadow: selected ? "0 0 0 3px rgba(124,58,237,0.15)" : "none",
        background: "#fff",
        overflow: "hidden",
        fontSize: 10.5,
        lineHeight: "18px",
        opacity: inStock ? 1 : 0.75,
        cursor: onClick ? "pointer" : "default",
      }}
    >
      {/* attribute axis (اللون …) — muted so the value stands out */}
      {attr && (
        <span style={{
          padding: "2px 7px",
          background: "#F5F3FF",
          color: "#6D28D9",
          fontWeight: 800,
          borderLeft: "1px solid rgba(124,58,237,0.14)",
        }}>
          {attr}
        </span>
      )}
      {/* the value itself — the part the buyer chooses */}
      <span style={{
        padding: "2px 8px",
        color: "#0A1628",
        fontWeight: 800,
        maxWidth: 110,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}>
        {value}
      </span>
      {/* price when buyable, an explicit نفذ marker when not */}
      <span style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 7px",
        fontWeight: 800,
        direction: "ltr",
        background: inStock ? "rgba(14,165,233,0.08)" : "#FFF7ED",
        color: inStock ? "#0284C7" : "#9A3412",
        borderRight: "1px solid rgba(124,58,237,0.10)",
      }}>
        <span style={{
          width: 5, height: 5, borderRadius: "50%",
          background: inStock ? "#22C55E" : "#EF4444",
        }} />
        {inStock ? `${v.price.toFixed(2)} د.ل` : "نفذ"}
      </span>
    </span>
  );
}

/* ── ProductDialog ───────────────────────────────────
   Opened by clicking a product card. Shows the full product with a large
   image; clicking a variant chip selects it and swaps the image to that
   variant's own photo (falling back to the product image when the variant
   has none — Odoo variants without a specific photo inherit the parent's). */

function ProductDialog({ product: p, onClose }: { product: Product; onClose: () => void }) {
  const variants = p.variants ?? [];
  const packagings = p.packagings ?? [];
  const [active, setActive] = useState<ProductVariant | null>(null);

  const image = active?.image_url || p.image_url;
  const price = active ? active.price : p.price;
  const stock = active ? active.stock : p.stock;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 60,
        background: "rgba(10,22,40,0.45)", backdropFilter: "blur(3px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 20, width: "100%", maxWidth: 520,
          maxHeight: "88vh", overflowY: "auto", direction: "rtl",
          boxShadow: "0 24px 64px rgba(10,22,40,0.28)",
        }}
      >
        {/* Image — swaps with the selected variant */}
        <div style={{
          height: 260, background: "#F8FBFF", position: "relative",
          display: "flex", alignItems: "center", justifyContent: "center",
          borderBottom: "1px solid #F1F5F9",
        }}>
          {image ? (
            <img
              src={image}
              alt={p.name_ar || p.name}
              style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
            />
          ) : (
            <Package size={64} color="#BAE6FD" />
          )}
          {active && !active.image_url && (
            <span style={{
              position: "absolute", bottom: 10, right: 10,
              fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 9999,
              background: "rgba(10,22,40,0.55)", color: "#fff",
            }}>
              لا توجد صورة خاصة بهذا المتغير — صورة المنتج
            </span>
          )}
          <button
            onClick={onClose}
            style={{
              position: "absolute", top: 12, left: 12, width: 32, height: 32,
              borderRadius: 9999, border: "none", cursor: "pointer",
              background: "rgba(10,22,40,0.55)", color: "#fff",
              fontSize: 16, fontWeight: 800, lineHeight: "32px",
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: "18px 22px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Name + category */}
          <div>
            <div style={{ fontSize: 17, fontWeight: 900, color: "#0A1628", lineHeight: 1.4 }}>
              {p.name_ar || p.name}
            </div>
            {p.category && (
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 4, marginTop: 6,
                fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 9999,
                background: "#E0F2FE", color: "#0284C7",
              }}>
                <Tag size={9} />
                {p.category}
              </span>
            )}
          </div>

          {/* Price + stock for the current selection */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 16px", borderRadius: 14,
            background: "#F8FBFF", border: "1px solid rgba(14,165,233,0.12)",
          }}>
            <div>
              <div style={{ fontSize: 9, color: "#94A3B8", fontWeight: 700, marginBottom: 3 }}>
                {active ? "سعر المتغير" : "السعر"}
              </div>
              <div style={{ fontSize: 24, fontWeight: 900, color: "#0EA5E9", direction: "ltr" }}>
                {price.toFixed(2)}
                <span style={{ fontSize: 12, color: "#64748B", fontWeight: 600, marginRight: 4 }}> د.ل</span>
              </div>
            </div>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 9, color: "#94A3B8", fontWeight: 700, marginBottom: 3 }}>المخزون</div>
              <span style={{
                fontSize: 14, fontWeight: 800, padding: "4px 12px", borderRadius: 8, direction: "ltr",
                background: stock > 0 ? "#D1FAE5" : "#FEE2E2",
                color: stock > 0 ? "#065F46" : "#B91C1C",
                display: "inline-block",
              }}>
                {stock > 0 ? stock : "نفذ"}
              </span>
            </div>
          </div>

          {/* Variants — click to preview that variant's image/price/stock */}
          {variants.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#0A1628", marginBottom: 8 }}>
                المتغيرات ({variants.length}) — اضغط لعرض صورة المتغير
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {variants.map((v) => (
                  <VariantChip
                    key={v.id}
                    variant={v}
                    selected={active?.id === v.id}
                    onClick={() => setActive(active?.id === v.id ? null : v)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Packaging — sellable pack sizes from Odoo's product.packaging */}
          {packagings.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#0A1628", marginBottom: 8 }}>
                أحجام التعبئة ({packagings.length})
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {packagings.map((pk) => (
                  <span
                    key={pk.id}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      fontSize: 11, fontWeight: 700, padding: "4px 10px",
                      borderRadius: 8, background: "#ECFDF5", color: "#047857",
                      border: "1px solid rgba(4,120,87,0.18)",
                    }}
                  >
                    <Boxes size={11} />
                    {pk.name_ar || pk.name}
                    <span style={{ fontFamily: "monospace", direction: "ltr", opacity: 0.75 }}>
                      × {pk.qty}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Meta */}
          <div style={{
            display: "flex", gap: 16, paddingTop: 10,
            borderTop: "1px dashed rgba(14,165,233,0.12)",
            fontSize: 12, color: "#64748B",
          }}>
            <span>الوحدة: <b style={{ color: "#334155" }}>{p.unit || "—"}</b></span>
            <span>الحد الأدنى: <b style={{ color: "#334155" }}>{p.min_qty}</b></span>
            {(active?.barcode || p.barcode) && (
              <span style={{ direction: "ltr" }}>
                <b style={{ color: "#334155" }}>{active?.barcode || p.barcode}</b>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── AppProductCard ─────────────────────────────────── */

function AppProductCard({ product: p, onOpen }: { product: Product; onOpen: () => void }) {
  const cat = CAT_PALETTE[(p.category ?? "").toLowerCase()] ?? DEFAULT_CAT;
  const stockZero = p.stock <= 0;
  const stockLow  = !stockZero && p.stock <= 10;
  const variants  = p.variants ?? [];
  const hasVariants = variants.length > 0;
  const packagings = p.packagings ?? [];
  const hasPackagings = packagings.length > 0;

  return (
    <div
      onClick={onOpen}
      style={{
        cursor: "pointer",
        background: "linear-gradient(145deg, #ffffff 0%, #F5F9FF 100%)",
        borderRadius: 16,
        border: "1.5px solid rgba(14,165,233,0.10)",
        boxShadow: "0 2px 10px rgba(10,22,40,0.06)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        transition: "box-shadow .2s, border-color .2s, transform .2s",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = "translateY(-2px)";
        el.style.boxShadow = "0 8px 24px rgba(10,22,40,0.10)";
        el.style.borderColor = "rgba(14,165,233,0.22)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = "translateY(0)";
        el.style.boxShadow = "0 2px 10px rgba(10,22,40,0.06)";
        el.style.borderColor = "rgba(14,165,233,0.10)";
      }}
    >
      {/* Banner area — matches Odoo ProductCard image area */}
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
        {/* Category chip — top right */}
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
        {/* Stock dot — top left */}
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
        {/* Variants flag — bottom right, only when the product has variations */}
        {hasVariants && (
          <span style={{
            position: "absolute", bottom: 10, right: 10,
            display: "inline-flex", alignItems: "center", gap: 4,
            fontSize: 10, fontWeight: 800, padding: "3px 9px",
            borderRadius: 9999, background: "#F5F3FF", color: "#6D28D9",
            border: "1px solid rgba(124,58,237,0.20)",
            boxShadow: "0 1px 4px rgba(0,0,0,.08)",
          }}>
            <Layers size={9} />
            {variants.length} خيارات
          </span>
        )}
        {/* Packaging flag — bottom left, only when the product has pack sizes */}
        {hasPackagings && (
          <span style={{
            position: "absolute", bottom: 10, left: 10,
            display: "inline-flex", alignItems: "center", gap: 4,
            fontSize: 10, fontWeight: 800, padding: "3px 9px",
            borderRadius: 9999, background: "#ECFDF5", color: "#047857",
            border: "1px solid rgba(4,120,87,0.20)",
            boxShadow: "0 1px 4px rgba(0,0,0,.08)",
          }}>
            <Boxes size={9} />
            {packagings.length} تعبئات
          </span>
        )}
      </div>

      <div style={{ padding: "16px 18px", flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
        {/* Name */}
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#0A1628", lineHeight: 1.35 }}>
            {p.name_ar || p.name}
          </div>
          {p.name_ar && p.name && p.name !== p.name_ar && (
            <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 3, direction: "ltr" }}>
              {p.name}
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "rgba(14,165,233,0.07)" }} />

        {/* Price + stock row */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 9, color: "#94A3B8", fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 3 }}>
              السعر
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#0EA5E9", lineHeight: 1, direction: "ltr", display: "inline-block" }}>
              {p.price.toFixed(2)}
              <span style={{ fontSize: 11, fontWeight: 600, color: "#64748B", marginRight: 3 }}>د.ل</span>
            </div>
          </div>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 9, color: "#94A3B8", fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 3 }}>
              المخزون
            </div>
            <span
              style={{
                fontSize: 13,
                fontWeight: 800,
                padding: "4px 10px",
                borderRadius: 8,
                background: stockZero ? "#FEE2E2" : stockLow ? "#FEF3C7" : "#D1FAE5",
                color: stockZero ? "#B91C1C" : stockLow ? "#92400E" : "#065F46",
                border: `1px solid ${stockZero ? "rgba(239,68,68,0.2)" : stockLow ? "rgba(245,158,11,0.2)" : "rgba(34,197,94,0.2)"}`,
                display: "inline-block",
                direction: "ltr",
              }}
            >
              {p.stock}
            </span>
          </div>
        </div>

        {/* Variants — structured chips: attribute badge · value · price/stock */}
        {hasVariants && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {variants.slice(0, 3).map((v) => (
              <VariantChip key={v.id} variant={v} />
            ))}
            {variants.length > 3 && (
              <span style={{
                alignSelf: "center",
                fontSize: 10.5, fontWeight: 800, padding: "3px 8px",
                borderRadius: 8, background: "rgba(124,58,237,0.08)", color: "#6D28D9",
              }}>
                +{variants.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer meta */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "auto",
            paddingTop: 6,
            borderTop: "1px dashed rgba(14,165,233,0.08)",
          }}
        >
          <span style={{ fontSize: 11, color: "#64748B" }}>
            الوحدة: <b style={{ color: "#334155" }}>{p.unit || "—"}</b>
          </span>
          <span style={{ fontSize: 11, color: "#64748B" }}>
            الحد الأدنى: <b style={{ color: "#334155" }}>{p.min_qty}</b>
          </span>
        </div>

      </div>
    </div>
  );
}

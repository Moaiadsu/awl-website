"use client";
import { useEffect, useMemo, useState } from "react";
import { getProducts } from "@/lib/api";
import { Search, Tag } from "lucide-react";

type Product = {
  id: string;
  name: string;
  name_ar: string;
  category: string;
  price: number;
  unit: string;
  stock: number;
  min_qty: number;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getProducts().then(setProducts).catch(() => {});
  }, []);

  const shown = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.trim().toLowerCase();
    return products.filter(
      (p) =>
        (p.name_ar ?? "").toLowerCase().includes(q) ||
        (p.name ?? "").toLowerCase().includes(q) ||
        (p.category ?? "").toLowerCase().includes(q),
    );
  }, [products, search]);

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
            placeholder="البحث في المنتجات..."
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

        <div style={{ marginRight: "auto", fontSize: 12, color: "#64748B", fontWeight: 600 }}>
          {shown.length} منتج
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
                <Th>الاسم</Th>
                <Th width={150}>الفئة</Th>
                <Th width={130}>السعر</Th>
                <Th width={110}>الوحدة</Th>
                <Th width={110}>المخزون</Th>
                <Th width={110}>الحد الأدنى</Th>
              </tr>
            </thead>
            <tbody>
              {shown.map((p) => (
                <tr
                  key={p.id}
                  style={{ borderBottom: "1px solid #F1F5F9", transition: "background .1s" }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.background = "#F8FAFC")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.background = "transparent")
                  }
                >
                  <Td>
                    <div style={{ fontWeight: 700, color: "#1E293B" }}>{p.name_ar}</div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "#94A3B8",
                        marginTop: 2,
                        direction: "ltr",
                      }}
                    >
                      {p.name}
                    </div>
                  </Td>
                  <Td>
                    <CategoryBadge category={p.category} />
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
                      {p.price} د.ل
                    </span>
                  </Td>
                  <Td>
                    <span style={{ color: "#64748B", fontSize: 13 }}>{p.unit}</span>
                  </Td>
                  <Td>
                    <StockCell stock={p.stock} />
                  </Td>
                  <Td>
                    <span style={{ color: "#64748B" }}>{p.min_qty}</span>
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
                    لا توجد منتجات
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

function CategoryBadge({ category }: { category: string }) {
  // Map common category strings to design-system palette colors.
  const palette: Record<string, { bg: string; fg: string; bdr: string }> = {
    wholesale: { bg: "#EFF6FF", fg: "#1D4ED8", bdr: "#BFDBFE" },
    retail: { bg: "#F5F3FF", fg: "#6D28D9", bdr: "#DDD6FE" },
    vip: { bg: "#FFFBEB", fg: "#92400E", bdr: "#FDE68A" },
    standard: { bg: "#F0FDF4", fg: "#166534", bdr: "#BBF7D0" },
  };

  const c =
    palette[(category ?? "").toLowerCase()] ?? {
      bg: "#E0F2FE",
      fg: "#0284C7",
      bdr: "rgba(14,165,233,.3)",
    };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 10px",
        borderRadius: 9999,
        background: c.bg,
        color: c.fg,
        border: `1.5px solid ${c.bdr}`,
        fontSize: 12,
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      <Tag size={11} />
      {category || "—"}
    </span>
  );
}

function StockCell({ stock }: { stock: number }) {
  const low = stock <= 10;
  return (
    <span
      style={{
        fontWeight: 700,
        color: low ? "#B91C1C" : "#1E293B",
        direction: "ltr",
        display: "inline-block",
      }}
    >
      {stock}
    </span>
  );
}

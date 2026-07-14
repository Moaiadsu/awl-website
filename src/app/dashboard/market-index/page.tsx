"use client";
import { useEffect, useMemo, useState } from "react";
import {
  getProducts, getMarketIndexConfig, setMarketIndex, getMarketIndexHistory,
} from "@/lib/api";
import {
  LineChart, Search, Trash2, CheckCircle2, TrendingUp, TrendingDown, Check,
} from "lucide-react";

// Basket weights: quarter steps from 0.25 to 3.0 (validated server-side too).
const WEIGHTS = Array.from({ length: 12 }, (_, i) => (i + 1) * 0.25);

type Product = { id: string; name: string; name_ar: string; price: number };
type Row = {
  product_id: string;
  name: string;
  price: number;       // catalog (old) price, reference
  manualPrice: string; // admin-entered market price (kept as text for typing)
  weight: number;
};

export default function MarketIndexPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedValue, setSavedValue] = useState<number | null>(null);
  const [history, setHistory] = useState<{ value: number; created_at: string }[]>([]);

  const load = () => {
    getProducts().then(setProducts).catch(() => {});
    getMarketIndexConfig()
      .then((cfg) => {
        setRows(cfg.components.map((c) => ({
          product_id: c.product_id,
          name: c.product_name,
          price: c.price,
          manualPrice: (c.manual_price || c.price).toFixed(2),
          weight: c.weight,
        })));
        setSavedValue(cfg.current_value || null);
      })
      .catch(() => {});
    getMarketIndexHistory().then((h) => setHistory([...h.history].reverse())).catch(() => {});
  };
  useEffect(load, []);

  // The would-be index value: Σ manual price × weight.
  const newValue = useMemo(
    () => rows.reduce((s, r) => s + (parseFloat(r.manualPrice) || 0) * r.weight, 0),
    [rows],
  );
  const allPricesValid = rows.every((r) => (parseFloat(r.manualPrice) || 0) > 0);

  const inBasket = useMemo(
    () => new Set(rows.map((r) => r.product_id)),
    [rows],
  );

  // Product picker list: basket members first, then the rest; searchable.
  const pickList = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = products;
    if (q) {
      list = list.filter((p) =>
        (p.name_ar ?? "").toLowerCase().includes(q) ||
        (p.name ?? "").toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => {
      const ai = inBasket.has(a.id) ? 0 : 1;
      const bi = inBasket.has(b.id) ? 0 : 1;
      return ai - bi;
    }).slice(0, 60);
  }, [products, search, inBasket]);

  const toggleProduct = (p: Product) => {
    if (inBasket.has(p.id)) {
      setRows((rs) => rs.filter((r) => r.product_id !== p.id));
    } else {
      setRows((rs) => [...rs, {
        product_id: p.id,
        name: p.name_ar || p.name,
        price: p.price,
        manualPrice: p.price.toFixed(2), // starts at the catalog price
        weight: 1,
      }]);
    }
  };

  const confirm = async () => {
    setSaving(true);
    try {
      await setMarketIndex(rows.map((r) => ({
        product_id: r.product_id,
        weight: r.weight,
        manual_price: parseFloat(r.manualPrice) || 0,
      })));
      setSearch("");
      load();
    } catch (e) {
      console.error(e);
      alert("فشل حفظ المؤشر");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      {/* ── Header ── */}
      <div style={{
        background: "linear-gradient(145deg, #ffffff 0%, #EEF5FF 100%)",
        borderRadius: 16, border: "1px solid rgba(14,165,233,0.12)",
        boxShadow: "0 4px 20px rgba(10,22,40,0.07)",
        padding: "20px 24px", marginBottom: 20,
        display: "flex", alignItems: "center", gap: 14,
      }}>
        <div style={{ width: 46, height: 46, borderRadius: 13, background: "rgba(14,165,233,0.10)", border: "1.5px solid rgba(14,165,233,0.20)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <LineChart size={22} color="#0EA5E9" />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "#0A1628" }}>مؤشر السوق</h1>
          <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>
            اختر المنتجات من القائمة وحدد وزن كل منها — قيمة المؤشر = مجموع (السعر × الوزن). التطبيق يعرض المؤشر فقط.
          </div>
        </div>
      </div>

      {/* ── THE INDEX: current vs new ── */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <ValueCard label="قيمة المؤشر الحالية" value={savedValue} color="#64748B" />
        <ValueCard
          label="القيمة الجديدة (غير محفوظة)"
          value={rows.length ? newValue : null}
          color={savedValue != null && rows.length
            ? newValue > savedValue ? "#10B981" : newValue < savedValue ? "#EF4444" : "#0EA5E9"
            : "#0EA5E9"}
        />
      </div>

      {/* ── Basket: chosen products, old price → weighted new price ── */}
      <div style={{
        background: "linear-gradient(145deg, #ffffff 0%, #F4F8FF 100%)",
        borderRadius: 14, border: "1px solid rgba(14,165,233,0.10)",
        boxShadow: "0 2px 8px rgba(10,22,40,0.05)", padding: 20, marginBottom: 20,
      }}>
        <div style={{ fontWeight: 900, fontSize: 15, color: "#0A1628", marginBottom: 12 }}>
          سلة المؤشر ({rows.length})
        </div>

        {rows.length === 0 ? (
          <div style={{ textAlign: "center", padding: 26, color: "#94A3B8", fontSize: 13 }}>
            لم تُختَر منتجات بعد — اضغط على المنتجات في القائمة بالأسفل لإضافتها
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#F8FBFF", color: "#64748B", fontSize: 11 }}>
                <th style={th}>المنتج</th>
                <th style={th}>السعر القديم</th>
                <th style={th}>السعر الجديد (يُدخل يدوياً)</th>
                <th style={th}>الوزن</th>
                <th style={th}>المساهمة (السعر × الوزن)</th>
                <th style={{ ...th, width: 40 }} />
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.product_id} style={{ borderTop: "1px solid #F1F5F9" }}>
                  <td style={td}>{r.name}</td>
                  <td style={{ ...td, direction: "ltr", textAlign: "right", color: "#64748B" }}>
                    {r.price.toFixed(2)} د.ل
                  </td>
                  <td style={td}>
                    <input
                      value={r.manualPrice}
                      onChange={(e) =>
                        setRows((rs) => rs.map((x, j) =>
                          j === i ? { ...x, manualPrice: e.target.value } : x))}
                      inputMode="decimal"
                      placeholder="0.00"
                      style={{
                        width: 100, height: 30, padding: "0 10px", borderRadius: 7,
                        border: `1.5px solid ${(parseFloat(r.manualPrice) || 0) > 0 ? "rgba(14,165,233,0.25)" : "rgba(239,68,68,0.45)"}`,
                        fontFamily: "Cairo, sans-serif", fontSize: 12.5,
                        fontWeight: 800, color: "#0A1628", background: "#FFFDF5",
                        outline: "none", direction: "ltr", textAlign: "center",
                      }}
                    />
                  </td>
                  <td style={td}>
                    <select
                      value={r.weight}
                      onChange={(e) =>
                        setRows((rs) => rs.map((x, j) =>
                          j === i ? { ...x, weight: parseFloat(e.target.value) } : x))}
                      style={{
                        height: 30, padding: "0 8px", borderRadius: 7,
                        border: "1.5px solid rgba(14,165,233,0.20)",
                        fontFamily: "Cairo, sans-serif", fontSize: 12.5,
                        fontWeight: 700, color: "#0284C7", background: "#F0F9FF",
                        cursor: "pointer", direction: "ltr",
                      }}
                    >
                      {WEIGHTS.map((w) => (
                        <option key={w} value={w}>{w.toFixed(2)}×</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ ...td, direction: "ltr", textAlign: "right", fontWeight: 800, color: "#0A1628" }}>
                    {((parseFloat(r.manualPrice) || 0) * r.weight).toFixed(2)} د.ل
                  </td>
                  <td style={td}>
                    <button
                      onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}
                      style={{ border: "none", background: "none", cursor: "pointer", color: "#EF4444" }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
              <tr style={{ borderTop: "1.5px solid rgba(14,165,233,0.25)" }}>
                <td colSpan={4} style={{ ...td, fontWeight: 900, color: "#0A1628" }}>قيمة المؤشر الجديدة</td>
                <td style={{ ...td, direction: "ltr", textAlign: "right", fontWeight: 900, color: "#0EA5E9", fontSize: 15 }}>
                  {newValue.toFixed(2)}
                </td>
                <td />
              </tr>
            </tbody>
          </table>
        )}

        <div style={{ marginTop: 16 }}>
          <button
            onClick={confirm}
            disabled={saving || rows.length === 0 || !allPricesValid}
            style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              fontSize: 13.5, fontWeight: 800, padding: "10px 26px", borderRadius: 10,
              cursor: "pointer", fontFamily: "Cairo, sans-serif",
              background: "#0EA5E9", color: "#fff", border: "none",
              opacity: saving || rows.length === 0 || !allPricesValid ? 0.5 : 1,
            }}
          >
            <CheckCircle2 size={16} /> تأكيد وتحديث المؤشر
          </button>
        </div>
      </div>

      {/* ── Product list: click to add/remove ── */}
      <div style={{
        background: "linear-gradient(145deg, #ffffff 0%, #F4F8FF 100%)",
        borderRadius: 14, border: "1px solid rgba(14,165,233,0.10)",
        boxShadow: "0 2px 8px rgba(10,22,40,0.05)", padding: 20, marginBottom: 20,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
          <div style={{ fontWeight: 900, fontSize: 15, color: "#0A1628" }}>
            اختر من المنتجات
          </div>
          <div style={{ position: "relative", flex: 1, minWidth: 220, maxWidth: 360 }}>
            <Search size={15} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="البحث في المنتجات..."
              style={{
                height: 36, width: "100%", padding: "0 40px 0 12px",
                border: "1.5px solid rgba(14,165,233,0.15)", borderRadius: 9,
                fontFamily: "Cairo, sans-serif", fontSize: 13,
                background: "#F8FBFF", outline: "none", direction: "rtl",
              }}
            />
          </div>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))",
          gap: 8, maxHeight: 420, overflowY: "auto",
        }}>
          {pickList.map((p) => {
            const selected = inBasket.has(p.id);
            return (
              <div
                key={p.id}
                onClick={() => toggleProduct(p)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 12px", borderRadius: 10, cursor: "pointer",
                  background: selected ? "rgba(14,165,233,0.08)" : "#fff",
                  border: `1.5px solid ${selected ? "#0EA5E9" : "#EEF2F7"}`,
                  transition: "all .12s",
                }}
              >
                <div style={{
                  width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: selected ? "#0EA5E9" : "#F1F5F9",
                  border: `1.5px solid ${selected ? "#0EA5E9" : "#E2E8F0"}`,
                }}>
                  {selected && <Check size={13} color="#fff" />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 12.5, fontWeight: 700, color: "#0A1628",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {p.name_ar || p.name}
                  </div>
                  <div dir="ltr" style={{ fontSize: 11, fontWeight: 800, color: "#0284C7", textAlign: "right" }}>
                    {p.price.toFixed(2)} د.ل
                  </div>
                </div>
              </div>
            );
          })}
          {pickList.length === 0 && (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: 30, color: "#94A3B8", fontSize: 13 }}>
              لا توجد منتجات مطابقة
            </div>
          )}
        </div>
      </div>

      {/* ── History (dashboard-only summary) ── */}
      {history.length > 0 && (
        <div style={{
          background: "#fff", borderRadius: 14,
          border: "1.5px solid rgba(14,165,233,0.10)",
          boxShadow: "0 2px 10px rgba(10,22,40,0.05)", overflow: "hidden",
        }}>
          <div style={{ padding: "12px 18px", fontWeight: 800, fontSize: 14, color: "#0A1628", borderBottom: "1px solid #F1F5F9" }}>
            سجل التغييرات
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <tbody>
              {history.map((h, i) => {
                const prev = history[i + 1]?.value;
                const up = prev != null && h.value > prev;
                const down = prev != null && h.value < prev;
                return (
                  <tr key={i} style={{ borderTop: "1px solid #F1F5F9" }}>
                    <td style={{ ...td, direction: "ltr", textAlign: "right", color: "#64748B", fontSize: 12 }}>
                      {h.created_at ? new Date(h.created_at).toLocaleString("ar-LY") : "—"}
                    </td>
                    <td style={{ ...td, direction: "ltr", textAlign: "right", fontWeight: 900, color: "#0A1628" }}>
                      {h.value.toFixed(2)}
                    </td>
                    <td style={{ ...td, width: 120 }}>
                      {prev != null && (
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 4,
                          fontSize: 11.5, fontWeight: 800,
                          color: up ? "#10B981" : down ? "#EF4444" : "#94A3B8",
                        }}>
                          {up ? <TrendingUp size={13} /> : down ? <TrendingDown size={13} /> : null}
                          <span dir="ltr">
                            {prev !== 0 ? `${(((h.value - prev) / prev) * 100).toFixed(1)}%` : "—"}
                          </span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const th: React.CSSProperties = { padding: "8px 12px", textAlign: "right", fontWeight: 800 };
const td: React.CSSProperties = { padding: "9px 12px", textAlign: "right", color: "#334155" };

function ValueCard({ label, value, color }: { label: string; value: number | null; color: string }) {
  return (
    <div style={{
      flex: 1, minWidth: 220,
      background: "linear-gradient(145deg, #ffffff 0%, #F4F8FF 100%)",
      borderRadius: 14, border: `1.5px solid ${color}22`,
      padding: "16px 20px", boxShadow: "0 2px 10px rgba(10,22,40,0.06)",
    }}>
      <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 700, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 900, color, direction: "ltr" }}>
        {value == null ? "—" : value.toFixed(2)}
      </div>
    </div>
  );
}

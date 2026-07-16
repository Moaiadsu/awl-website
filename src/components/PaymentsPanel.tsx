"use client";
import { useCallback, useEffect, useState } from "react";
import {
  getPayments, confirmPayment, rejectPayment, type PaymentRow,
} from "@/lib/api";
import { Wallet, CheckCircle2, XCircle, Receipt, Smartphone, Banknote } from "lucide-react";
import { SkeletonRows } from "@/components/ui/Skeleton";

const METHOD_LABEL: Record<string, string> = {
  cod: "عند الاستلام",
  sadad: "سداد",
  check: "تحويل مصرفي",
};
const METHOD_ICON: Record<string, React.ReactNode> = {
  cod: <Banknote size={14} />,
  sadad: <Smartphone size={14} />,
  check: <Receipt size={14} />,
};
const STATUS_STYLE: Record<string, { bg: string; fg: string; label: string }> = {
  pending:   { bg: "#FEF3C7", fg: "#92400E", label: "قيد المراجعة" },
  confirmed: { bg: "#D1FAE5", fg: "#065F46", label: "مؤكد" },
  rejected:  { bg: "#FEE2E2", fg: "#B91C1C", label: "مرفوض" },
};

export default function PaymentsPanel() {
  // The full history is always loaded — payments are permanent records, and
  // filtering happens client-side so the counts per status stay visible.
  // Default view is "الكل": settled payments never disappear after handling.
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [filter, setFilter] = useState<"pending" | "confirmed" | "rejected" | "all">("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<string | null>(null);
  const [imgState, setImgState] = useState<Record<string, "loading" | "loaded" | "error">>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    getPayments().then(setPayments).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const counts = {
    all: payments.length,
    pending: payments.filter((p) => p.status === "pending").length,
    confirmed: payments.filter((p) => p.status === "confirmed").length,
    rejected: payments.filter((p) => p.status === "rejected").length,
  };
  const shown =
    filter === "all" ? payments : payments.filter((p) => p.status === filter);

  const onConfirm = async (p: PaymentRow) => {
    const amount = parseFloat(amounts[p.id] ?? "");
    if (!amount || amount <= 0) return;
    setBusy(p.id);
    try {
      await confirmPayment(p.id, amount);
      load();
    } catch (e) {
      console.error(e);
      alert("فشل تأكيد الدفعة");
    } finally {
      setBusy(null);
    }
  };

  const onReject = async (p: PaymentRow) => {
    if (!confirm("رفض هذه الدفعة؟")) return;
    setBusy(p.id);
    try {
      await rejectPayment(p.id);
      load();
    } catch (e) {
      console.error(e);
      alert("فشل رفض الدفعة");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      {/* ── Status filter ── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
        {([["all", "الكل"], ["pending", "قيد المراجعة"], ["confirmed", "مؤكدة"], ["rejected", "مرفوضة"]] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              fontSize: 12.5, fontWeight: 800, padding: "7px 16px",
              borderRadius: 9999, cursor: "pointer", fontFamily: "Cairo, sans-serif",
              background: filter === key ? "#0EA5E9" : "#F0F9FF",
              color: filter === key ? "#fff" : "#0284C7",
              border: `1.5px solid ${filter === key ? "#0EA5E9" : "rgba(14,165,233,0.20)"}`,
            }}
          >
            {label}
            <span style={{
              padding: "1px 7px", borderRadius: 9999, fontSize: 10.5, fontWeight: 800,
              background: filter === key ? "rgba(255,255,255,.25)" : "rgba(14,165,233,0.10)",
            }}>
              {counts[key]}
            </span>
          </button>
        ))}
      </div>

      {/* ── List ── */}
      {loading ? (
        <SkeletonRows count={5} />
      ) : shown.length === 0 ? (
        <div style={{ textAlign: "center", padding: 70, color: "#CBD5E1" }}>
          <Wallet size={44} style={{ margin: "0 auto 14px", opacity: 0.25 }} />
          <div style={{ fontSize: 14, fontWeight: 700, color: "#94A3B8" }}>لا توجد مدفوعات</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {shown.map((p) => {
            const st = STATUS_STYLE[p.status] ?? STATUS_STYLE.pending;
            return (
              <div key={p.id} style={{
                background: "linear-gradient(145deg, #ffffff 0%, #F5F9FF 100%)",
                borderRadius: 14, border: "1.5px solid rgba(14,165,233,0.10)",
                boxShadow: "0 2px 10px rgba(10,22,40,0.05)",
                padding: "14px 18px",
                display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
              }}>
                {/* Transfer receipt thumbnail (click to zoom) */}
                {p.image_url ? (
                  <div style={{ position: "relative", width: 72, height: 52, flexShrink: 0 }}>
                    {imgState[p.id] !== "loaded" && (
                      <div style={{
                        position: "absolute", inset: 0, borderRadius: 8, background: "#F1F5F9",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: imgState[p.id] === "error" ? "#EF4444" : "#94A3B8",
                      }}>
                        {imgState[p.id] === "error" ? (
                          <Receipt size={16} />
                        ) : (
                          <span style={{
                            width: 16, height: 16, borderRadius: "50%",
                            border: "2px solid rgba(14,165,233,0.25)", borderTopColor: "#0EA5E9",
                            animation: "awl-spin 0.7s linear infinite",
                          }} />
                        )}
                      </div>
                    )}
                    <img
                      src={p.image_url}
                      alt="صورة إيصال التحويل"
                      onClick={() => imgState[p.id] === "loaded" && setPreview(p.image_url)}
                      onLoad={() => setImgState((s) => ({ ...s, [p.id]: "loaded" }))}
                      onError={() => setImgState((s) => ({ ...s, [p.id]: "error" }))}
                      style={{
                        width: 72, height: 52, objectFit: "cover", borderRadius: 8,
                        border: "1px solid rgba(14,165,233,0.20)",
                        cursor: imgState[p.id] === "loaded" ? "zoom-in" : "default",
                        opacity: imgState[p.id] === "loaded" ? 1 : 0,
                        position: imgState[p.id] === "loaded" ? "static" : "absolute",
                      }}
                    />
                  </div>
                ) : (
                  <div style={{
                    width: 72, height: 52, borderRadius: 8, background: "#F1F5F9",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#94A3B8", flexShrink: 0,
                  }}>
                    {METHOD_ICON[p.method] ?? <Wallet size={16} />}
                  </div>
                )}

                {/* Details */}
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: "#0A1628" }}>
                      {p.store_name || p.user_id.slice(0, 8)}
                    </span>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      fontSize: 10.5, fontWeight: 800, padding: "2px 9px", borderRadius: 9999,
                      background: "#F0F9FF", color: "#0284C7", border: "1px solid rgba(14,165,233,0.18)",
                    }}>
                      {METHOD_ICON[p.method]} {METHOD_LABEL[p.method] ?? p.method}
                    </span>
                    <span style={{
                      fontSize: 10.5, fontWeight: 800, padding: "2px 9px", borderRadius: 9999,
                      background: st.bg, color: st.fg,
                    }}>
                      {st.label}
                    </span>
                  </div>
                  <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 5, display: "flex", gap: 14, flexWrap: "wrap" }}>
                    {p.order_id && <span>طلب: <b style={{ direction: "ltr", display: "inline-block" }}>{p.order_id.split("-")[0]}</b></span>}
                    {p.reference && <span>مرجع سداد: <b style={{ direction: "ltr", display: "inline-block" }}>{p.reference}</b></span>}
                    {p.created_at && <span dir="ltr">{new Date(p.created_at).toLocaleString("ar-LY")}</span>}
                    {p.status === "confirmed" && <span>المبلغ: <b>{p.amount.toFixed(2)} د.ل</b></span>}
                  </div>
                </div>

                {/* Actions — pending only */}
                {p.status === "pending" && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input
                      value={amounts[p.id] ?? ""}
                      onChange={(e) => setAmounts((a) => ({ ...a, [p.id]: e.target.value }))}
                      placeholder="المبلغ المحوَّل"
                      inputMode="decimal"
                      style={{
                        width: 120, height: 36, padding: "0 12px",
                        border: "1.5px solid rgba(14,165,233,0.20)", borderRadius: 9,
                        fontFamily: "Cairo, sans-serif", fontSize: 13, direction: "ltr",
                        textAlign: "center", outline: "none", background: "#F8FBFF",
                      }}
                    />
                    <button
                      onClick={() => onConfirm(p)}
                      disabled={busy === p.id || !parseFloat(amounts[p.id] ?? "")}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        fontSize: 12.5, fontWeight: 800, padding: "8px 14px", borderRadius: 9,
                        cursor: "pointer", fontFamily: "Cairo, sans-serif",
                        background: "#10B981", color: "#fff", border: "none",
                        opacity: busy === p.id || !parseFloat(amounts[p.id] ?? "") ? 0.5 : 1,
                      }}
                    >
                      <CheckCircle2 size={14} /> تأكيد
                    </button>
                    <button
                      onClick={() => onReject(p)}
                      disabled={busy === p.id}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        fontSize: 12.5, fontWeight: 800, padding: "8px 14px", borderRadius: 9,
                        cursor: "pointer", fontFamily: "Cairo, sans-serif",
                        background: "#FEE2E2", color: "#B91C1C", border: "1px solid rgba(239,68,68,0.25)",
                      }}
                    >
                      <XCircle size={14} /> رفض
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Check image zoom ── */}
      {preview && (
        <div
          onClick={() => setPreview(null)}
          style={{
            position: "fixed", inset: 0, zIndex: 70,
            background: "rgba(10,22,40,0.65)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 30,
            cursor: "zoom-out",
          }}
        >
          <img src={preview} alt="صورة الصك" style={{ maxWidth: "90%", maxHeight: "90%", borderRadius: 12 }} />
        </div>
      )}
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import { getOtpLogs, type OtpLogRow } from "@/lib/api";
import { MessageSquareText, RefreshCw, CheckCircle2, XCircle, Send, AlertTriangle } from "lucide-react";

const EVENT_STYLE: Record<string, { bg: string; fg: string; label: string; icon: React.ReactNode }> = {
  sent:          { bg: "#E0F2FE", fg: "#0284C7", label: "أُرسل",        icon: <Send size={12} /> },
  send_failed:   { bg: "#FEE2E2", fg: "#B91C1C", label: "فشل الإرسال",  icon: <AlertTriangle size={12} /> },
  verified:      { bg: "#D1FAE5", fg: "#065F46", label: "تم التحقق",    icon: <CheckCircle2 size={12} /> },
  verify_failed: { bg: "#FEF3C7", fg: "#92400E", label: "رمز خاطئ",     icon: <XCircle size={12} /> },
};

export default function OtpLogsPage() {
  const [logs, setLogs] = useState<OtpLogRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = () => {
    setLoading(true);
    getOtpLogs().then(setLogs).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, []);

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      {/* ── Header ── */}
      <div style={{
        background: "linear-gradient(145deg, #ffffff 0%, #EEF5FF 100%)",
        borderRadius: 16, border: "1px solid rgba(14,165,233,0.12)",
        boxShadow: "0 4px 20px rgba(10,22,40,0.07)",
        padding: "20px 24px", marginBottom: 20,
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 46, height: 46, borderRadius: 13, background: "rgba(14,165,233,0.10)", border: "1.5px solid rgba(14,165,233,0.20)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <MessageSquareText size={22} color="#0EA5E9" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "#0A1628" }}>سجل رموز التحقق</h1>
            <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>
              كل عمليات إرسال OTP والتحقق منها — عبر خدمة رسالة (Resala) أو الرموز المحلية
            </div>
          </div>
        </div>
        <button
          onClick={load}
          disabled={loading}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 12.5, fontWeight: 800, padding: "8px 16px", borderRadius: 9,
            cursor: "pointer", fontFamily: "Cairo, sans-serif",
            background: "#0EA5E9", color: "#fff", border: "none",
            opacity: loading ? 0.6 : 1,
          }}
        >
          <RefreshCw size={14} style={loading ? { animation: "spin 1s linear infinite" } : undefined} />
          تحديث
        </button>
      </div>

      {/* ── Table ── */}
      {logs.length === 0 ? (
        <div style={{ textAlign: "center", padding: 70, color: "#CBD5E1" }}>
          <MessageSquareText size={44} style={{ margin: "0 auto 14px", opacity: 0.25 }} />
          <div style={{ fontSize: 14, fontWeight: 700, color: "#94A3B8" }}>لا توجد سجلات بعد</div>
        </div>
      ) : (
        <div style={{
          background: "#fff", borderRadius: 14,
          border: "1.5px solid rgba(14,165,233,0.10)",
          boxShadow: "0 2px 10px rgba(10,22,40,0.05)", overflow: "hidden",
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#F8FBFF", color: "#64748B", fontSize: 11.5 }}>
                <th style={{ padding: "10px 16px", textAlign: "right", fontWeight: 800 }}>الهاتف</th>
                <th style={{ padding: "10px 16px", textAlign: "right", fontWeight: 800 }}>الحدث</th>
                <th style={{ padding: "10px 16px", textAlign: "right", fontWeight: 800 }}>المزوّد</th>
                <th style={{ padding: "10px 16px", textAlign: "right", fontWeight: 800 }}>البيئة</th>
                <th style={{ padding: "10px 16px", textAlign: "right", fontWeight: 800 }}>التفاصيل</th>
                <th style={{ padding: "10px 16px", textAlign: "right", fontWeight: 800 }}>التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => {
                const ev = EVENT_STYLE[l.event] ?? EVENT_STYLE.sent;
                return (
                  <tr key={l.id} style={{ borderTop: "1px solid #F1F5F9" }}>
                    <td style={{ padding: "10px 16px", fontWeight: 700, color: "#0A1628", direction: "ltr", textAlign: "right" }}>
                      {l.phone}
                    </td>
                    <td style={{ padding: "10px 16px" }}>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        fontSize: 11, fontWeight: 800, padding: "3px 10px",
                        borderRadius: 9999, background: ev.bg, color: ev.fg,
                      }}>
                        {ev.icon} {ev.label}
                      </span>
                    </td>
                    <td style={{ padding: "10px 16px", fontWeight: 700, color: l.provider === "resala" ? "#0284C7" : "#94A3B8" }}>
                      {l.provider === "resala" ? "رسالة (Resala)" : "محلي"}
                    </td>
                    <td style={{ padding: "10px 16px" }}>
                      <span style={{
                        fontSize: 10.5, fontWeight: 800, padding: "2px 9px", borderRadius: 9999,
                        background: l.env === "live" ? "#D1FAE5" : "#F1F5F9",
                        color: l.env === "live" ? "#065F46" : "#64748B",
                      }}>
                        {l.env === "live" ? "فعلية" : "تجريبية"}
                      </span>
                    </td>
                    <td style={{ padding: "10px 16px", color: "#B91C1C", fontSize: 11.5, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={l.detail}>
                      {l.detail || "—"}
                    </td>
                    <td style={{ padding: "10px 16px", color: "#64748B", fontSize: 11.5, direction: "ltr", textAlign: "right" }}>
                      {l.created_at ? new Date(l.created_at).toLocaleString("ar-LY") : "—"}
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

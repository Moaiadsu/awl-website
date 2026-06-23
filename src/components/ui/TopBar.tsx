"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { Bell, Clock, LogOut } from "lucide-react";
import { adminLogout } from "@/lib/api";

const PAGE_META: Record<string, { title: string; crumb: string }> = {
  "/dashboard":               { title: "الرئيسية",       crumb: "الرئيسية" },
  "/dashboard/merchants":     { title: "إدارة التجار",   crumb: "التجار" },
  "/dashboard/orders":        { title: "إدارة الطلبات",  crumb: "الطلبات" },
  "/dashboard/products":      { title: "المنتجات",        crumb: "المنتجات" },
  "/dashboard/odoo/contacts": { title: "جهات الاتصال",   crumb: "Odoo / جهات الاتصال" },
  "/dashboard/odoo/products": { title: "منتجات Odoo",    crumb: "Odoo / المنتجات" },
};


function decodeJwt(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split(".")[1];
    const b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

function formatCountdown(seconds: number): string {
  if (seconds <= 0) return "انتهت";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function TopBar() {
  const path = usePathname();
  const router = useRouter();
  const meta = PAGE_META[path] ?? { title: "لوحة التحكم", crumb: "—" };

  const [remaining, setRemaining] = useState<number | null>(null);
  const [adminLabel, setAdminLabel] = useState("المدير");

  useEffect(() => {
    const token = Cookies.get("token");
    if (!token) { router.replace("/login"); return; }

    const payload = decodeJwt(token);
    if (!payload) { adminLogout(); return; }

    const label =
      (payload.name as string) ||
      (payload.email as string) ||
      (payload.sub as string) ||
      "المدير";
    setAdminLabel(String(label).slice(0, 24));

    const exp = payload.exp as number | undefined;
    if (exp) {
      const tick = () => {
        const left = exp - Math.floor(Date.now() / 1000);
        setRemaining(left);
        if (left <= 0) adminLogout();
      };
      tick();
      const id = setInterval(tick, 1000);
      return () => clearInterval(id);
    }
  }, [router]);

  const urgent = remaining !== null && remaining > 0 && remaining < 300;

  const avatarLetters = adminLabel
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "AD";

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        right: "var(--sidebar-w)",
        left: 0,
        height: "var(--topbar-h)",
        background: "#0A1628",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        padding: "0 28px",
        zIndex: 90,
        display: "flex",
        alignItems: "center",
        gap: 16,
        direction: "rtl",
      }}
    >
      {/* Brand chip + breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "0 10px",
            height: 28,
            borderRadius: 7,
            background: "rgba(14,165,233,0.12)",
            border: "1px solid rgba(14,165,233,0.22)",
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 900, color: "#0EA5E9", letterSpacing: "0.08em" }}>
            AWL
          </span>
          <span style={{ fontSize: 10, color: "rgba(125,211,252,0.55)", fontWeight: 500 }}>
            Wholesale
          </span>
        </div>

        <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.10)" }} />

        <div>
          <div style={{ fontSize: 11, color: "rgba(148,163,184,0.6)", lineHeight: 1.2 }}>{meta.crumb}</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", lineHeight: 1.2, marginTop: 1 }}>
            {meta.title}
          </div>
        </div>
      </div>

      <div style={{ flex: 1 }} />

      {/* Right cluster */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {/* Session countdown */}
        {remaining !== null && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "0 10px",
              height: 30,
              borderRadius: 8,
              background: urgent ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.05)",
              border: `1px solid ${urgent ? "rgba(239,68,68,0.35)" : "rgba(255,255,255,0.10)"}`,
              transition: "background 0.3s, border-color 0.3s",
            }}
          >
            <Clock size={12} color={urgent ? "#FCA5A5" : "rgba(148,163,184,0.55)"} />
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: urgent ? "#FCA5A5" : "rgba(148,163,184,0.75)",
                fontVariantNumeric: "tabular-nums",
                direction: "ltr",
                display: "inline-block",
                minWidth: 40,
              }}
            >
              {formatCountdown(remaining)}
            </span>
          </div>
        )}

        <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.08)" }} />

        {/* Notification bell — coming soon */}
        <div style={{ position: "relative" }}>
          <button
            title="الإشعارات — قريباً"
            style={{
              width: 34, height: 34, borderRadius: 8,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.10)",
              cursor: "default",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "rgba(148,163,184,0.40)",
            }}
          >
            <Bell size={15} />
          </button>
          <span style={{
            position: "absolute", top: -5, right: -6,
            fontSize: 8, fontWeight: 800,
            background: "rgba(14,165,233,0.18)",
            color: "#38BDF8",
            border: "1px solid rgba(14,165,233,0.28)",
            padding: "1px 4px", borderRadius: 4,
            lineHeight: 1.5, whiteSpace: "nowrap",
            pointerEvents: "none",
          }}>
            قريباً
          </span>
        </div>

        {/* Admin user pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            padding: "0 10px 0 8px",
            height: 34,
            borderRadius: 8,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.10)",
          }}
        >
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              background: "rgba(14,165,233,0.18)",
              border: "1px solid rgba(14,165,233,0.32)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 9,
              fontWeight: 800,
              color: "#38BDF8",
              flexShrink: 0,
            }}
          >
            {avatarLetters}
          </div>
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "rgba(255,255,255,0.72)",
              maxWidth: 130,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {adminLabel}
          </span>
        </div>

        {/* Logout */}
        <button
          onClick={adminLogout}
          title="تسجيل الخروج"
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.10)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "rgba(148,163,184,0.5)",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.12)";
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(239,68,68,0.35)";
            (e.currentTarget as HTMLElement).style.color = "#FCA5A5";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.10)";
            (e.currentTarget as HTMLElement).style.color = "rgba(148,163,184,0.5)";
          }}
        >
          <LogOut size={14} />
        </button>
      </div>
    </header>
  );
}

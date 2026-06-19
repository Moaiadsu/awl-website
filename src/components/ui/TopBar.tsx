"use client";
import { usePathname } from "next/navigation";
import { Bell, ChevronLeft } from "lucide-react";

const PAGE_META: Record<string, { title: string; crumb: string }> = {
  "/dashboard":           { title: "الرئيسية",   crumb: "الرئيسية" },
  "/dashboard/merchants": { title: "إدارة التجار", crumb: "التجار" },
  "/dashboard/orders":    { title: "إدارة الطلبات", crumb: "الطلبات" },
  "/dashboard/products":  { title: "المنتجات",    crumb: "المنتجات" },
};

export default function TopBar() {
  const path = usePathname();
  const meta = PAGE_META[path] ?? { title: "لوحة التحكم", crumb: "—" };

  return (
    <header
      className="flex items-center gap-4"
      style={{
        position: "fixed",
        top: 0,
        right: "var(--sidebar-w)",
        left: 0,
        height: "var(--topbar-h)",
        background: "#fff",
        borderBottom: "1px solid #E2E8F0",
        padding: "0 32px",
        zIndex: 90,
        boxShadow: "0 1px 2px rgba(15,23,42,0.05)",
      }}
    >
      {/* Breadcrumb + title */}
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-1.5" style={{ fontSize: 12, color: "#94A3B8" }}>
          <span>AWL Admin</span>
          <ChevronLeft size={12} strokeWidth={2.5} style={{ transform: "scaleX(-1)" }} />
          <span>{meta.crumb}</span>
        </div>
        <div className="font-extrabold" style={{ fontSize: 16, color: "var(--navy-900)", lineHeight: 1 }}>
          {meta.title}
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-3">
        <div style={{ width: 1, height: 24, background: "#E2E8F0" }} />
        <button
          className="flex items-center justify-center relative"
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            border: "1.5px solid #E2E8F0",
            background: "#fff",
            cursor: "pointer",
            color: "#64748B",
          }}
        >
          <Bell size={16} />
        </button>
      </div>
    </header>
  );
}

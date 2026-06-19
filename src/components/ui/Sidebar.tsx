"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminLogout } from "@/lib/api";
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  Package,
  LogOut,
  Settings,
  BarChart3,
  Bell,
  BookUser,
  Database,
} from "lucide-react";

// ── Nav structure ────────────────────────────────────────────────────────────

const MAIN_NAV = [
  { href: "/dashboard",           label: "الرئيسية",    icon: LayoutDashboard },
  { href: "/dashboard/merchants", label: "التجار",      icon: Users },
  { href: "/dashboard/orders",    label: "الطلبات",     icon: ShoppingBag },
  { href: "/dashboard/products",  label: "المنتجات",    icon: Package },
];

const ODOO_NAV = [
  { href: "/dashboard/odoo/contacts", label: "جهات الاتصال", icon: BookUser },
  { href: "/dashboard/odoo/products", label: "منتجات Odoo",  icon: Database },
];

const SECONDARY_NAV = [
  { href: null, label: "التقارير",    icon: BarChart3, soon: true },
  { href: null, label: "الإشعارات",  icon: Bell,      soon: true },
  { href: null, label: "الإعدادات",  icon: Settings,  soon: true },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function NavGroup({ label }: { label: string }) {
  return (
    <div
      style={{
        fontSize: 10,
        fontWeight: 700,
        color: "rgba(255,255,255,0.28)",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        padding: "20px 20px 6px",
      }}
    >
      {label}
    </div>
  );
}

function NavItem({
  href,
  label,
  icon: Icon,
  active = false,
  soon = false,
}: {
  href: string | null;
  label: string;
  icon: React.ElementType;
  active?: boolean;
  soon?: boolean;
}) {
  const inner = (
    <>
      {/* Active accent bar */}
      {active && (
        <span
          style={{
            position: "absolute",
            left: 0,
            top: 7,
            bottom: 7,
            width: 3,
            borderRadius: "0 3px 3px 0",
            background: "var(--sky-500)",
          }}
        />
      )}

      {/* Icon */}
      <span
        style={{
          width: 30,
          height: 30,
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          background: active
            ? "rgba(14,165,233,0.20)"
            : "rgba(255,255,255,0.04)",
          color: active ? "var(--sky-400)" : "rgba(255,255,255,0.45)",
          transition: "all 0.15s",
        }}
      >
        <Icon size={15} strokeWidth={active ? 2.2 : 1.8} />
      </span>

      {/* Label */}
      <span style={{ flex: 1, lineHeight: 1 }}>{label}</span>

      {/* Soon badge */}
      {soon && (
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            color: "rgba(255,255,255,0.35)",
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 4,
            padding: "2px 5px",
            letterSpacing: "0.04em",
          }}
        >
          قريباً
        </span>
      )}
    </>
  );

  const sharedStyle: React.CSSProperties = {
    position: "relative",
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "0 16px 0 20px",
    minHeight: 40,
    fontSize: 13,
    fontWeight: 600,
    color: active ? "#fff" : "rgba(255,255,255,0.5)",
    background: active ? "rgba(14,165,233,0.10)" : "transparent",
    textDecoration: "none",
    transition: "all 0.15s",
    cursor: soon ? "default" : "pointer",
    opacity: soon ? 0.65 : 1,
  };

  if (!href) {
    return (
      <div style={sharedStyle}>
        {inner}
      </div>
    );
  }

  return (
    <Link
      href={href}
      style={sharedStyle}
      onMouseEnter={(e) => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.85)";
          (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.5)";
          (e.currentTarget as HTMLElement).style.background = "transparent";
        }
      }}
    >
      {inner}
    </Link>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Sidebar() {
  const path = usePathname();

  return (
    <aside
      style={{
        width: "var(--sidebar-w)",
        background: "var(--navy-900)",
        position: "fixed",
        right: 0,
        top: 0,
        height: "100vh",
        zIndex: 100,
        borderLeft: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
      }}
    >
      {/* ── Logo ─────────────────────────────────────────────────────── */}
      <div
        style={{
          height: "var(--topbar-h)",
          padding: "0 20px",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            overflow: "hidden",
          }}
        >
          <Image
            src="/logo.png"
            alt="AWL"
            width={30}
            height={30}
            style={{ objectFit: "contain" }}
          />
        </div>
        <div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 800,
              color: "#fff",
              lineHeight: 1.2,
              letterSpacing: "-0.01em",
            }}
          >
            AWL Admin
          </div>
          <div style={{ fontSize: 11, color: "var(--sky-300)", marginTop: 1 }}>
            منصة الجملة
          </div>
        </div>
      </div>

      {/* ── Nav ──────────────────────────────────────────────────────── */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
        <NavGroup label="الإدارة" />
        {MAIN_NAV.map(({ href, label, icon }) => (
          <NavItem
            key={href}
            href={href}
            label={label}
            icon={icon}
            active={path === href}
          />
        ))}

        <NavGroup label="Odoo" />
        {ODOO_NAV.map(({ href, label, icon }) => (
          <NavItem
            key={href}
            href={href}
            label={label}
            icon={icon}
            active={path === href}
          />
        ))}

        <NavGroup label="الأدوات" />
        {SECONDARY_NAV.map(({ href, label, icon, soon }) => (
          <NavItem
            key={label}
            href={href}
            label={label}
            icon={icon}
            soon={soon}
          />
        ))}
      </nav>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <div
        style={{
          padding: "14px 16px",
          borderTop: "1px solid rgba(255,255,255,0.07)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            background: "var(--navy-700)",
            border: "1.5px solid rgba(14,165,233,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            fontWeight: 800,
            color: "var(--sky-300)",
            flexShrink: 0,
          }}
        >
          AD
        </div>

        {/* Name */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#fff",
              lineHeight: 1.2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            المدير العام
          </div>
          <div style={{ fontSize: 11, color: "var(--sky-300)", marginTop: 1 }}>
            مسؤول النظام
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={adminLogout}
          title="تسجيل الخروج"
          style={{
            width: 30,
            height: 30,
            borderRadius: 7,
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.10)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "rgba(255,255,255,0.4)",
            flexShrink: 0,
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.15)";
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(239,68,68,0.4)";
            (e.currentTarget as HTMLElement).style.color = "#FCA5A5";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.10)";
            (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.4)";
          }}
        >
          <LogOut size={14} />
        </button>
      </div>
    </aside>
  );
}

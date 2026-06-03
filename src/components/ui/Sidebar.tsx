"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminLogout } from "@/lib/api";
import { LayoutDashboard, Users, ShoppingBag, Package, LogOut } from "lucide-react";
import clsx from "clsx";

const nav = [
  { href: "/dashboard",           label: "Dashboard",  icon: LayoutDashboard },
  { href: "/dashboard/merchants", label: "Merchants",  icon: Users },
  { href: "/dashboard/orders",    label: "Orders",     icon: ShoppingBag },
  { href: "/dashboard/products",  label: "Products",   icon: Package },
];

export default function Sidebar() {
  const path = usePathname();

  return (
    <aside className="w-56 flex-shrink-0 bg-[#0A1628] min-h-screen flex flex-col border-r border-[#1E3A5F]">
      <div className="p-5 border-b border-[#1E3A5F]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#0EA5E9] rounded-xl flex items-center justify-center text-white text-lg">🏪</div>
          <div>
            <div className="text-white font-bold text-sm">AWL Admin</div>
            <div className="text-[#7DD3FC] text-xs">Wholesale</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
              path === href
                ? "bg-[#0EA5E9] text-white"
                : "text-slate-400 hover:bg-[#1E3A5F] hover:text-white"
            )}
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}
      </nav>

      <div className="p-3 border-t border-[#1E3A5F]">
        <button
          onClick={adminLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-[#1E3A5F] hover:text-white transition-colors w-full"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

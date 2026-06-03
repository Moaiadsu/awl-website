"use client";
import { useEffect, useState } from "react";
import { getMerchants, getAllOrders } from "@/lib/api";
import { Users, ShoppingBag, CheckCircle, Clock } from "lucide-react";

export default function DashboardPage() {
  const [merchants, setMerchants] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    getMerchants().then(setMerchants).catch(() => {});
    getAllOrders().then(setOrders).catch(() => {});
  }, []);

  const pending   = merchants.filter((m) => m.status === "pending").length;
  const approved  = merchants.filter((m) => m.status === "approved").length;
  const pendingOrders = orders.filter((o) => o.status === "pending").length;

  const stats = [
    { label: "Total Merchants", value: merchants.length, icon: Users,       color: "bg-[#0EA5E9]" },
    { label: "Pending Approval", value: pending,          icon: Clock,       color: "bg-amber-500" },
    { label: "Approved",         value: approved,         icon: CheckCircle, color: "bg-emerald-500" },
    { label: "Pending Orders",   value: pendingOrders,    icon: ShoppingBag, color: "bg-violet-500" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Dashboard</h1>
      <div className="grid grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl p-5 border border-slate-200 flex items-center gap-4">
            <div className={`w-11 h-11 ${color} rounded-xl flex items-center justify-center`}>
              <Icon size={20} className="text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{value}</div>
              <div className="text-xs text-slate-500 font-medium">{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h2 className="text-base font-bold text-slate-900 mb-4">Recent Merchants</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-slate-500 uppercase border-b border-slate-100">
              <th className="text-left pb-3 font-semibold">Store</th>
              <th className="text-left pb-3 font-semibold">Owner</th>
              <th className="text-left pb-3 font-semibold">City</th>
              <th className="text-left pb-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {merchants.slice(0, 5).map((m) => (
              <tr key={m.id} className="border-b border-slate-50">
                <td className="py-3 font-medium">{m.store_name}</td>
                <td className="py-3 text-slate-600">{m.owner_name}</td>
                <td className="py-3 text-slate-500">{m.city}</td>
                <td className="py-3"><StatusBadge status={m.status} /></td>
              </tr>
            ))}
            {merchants.length === 0 && (
              <tr><td colSpan={4} className="py-6 text-center text-slate-400">No merchants yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending:  "bg-amber-100 text-amber-700",
    approved: "bg-emerald-100 text-emerald-700",
    rejected: "bg-red-100 text-red-700",
  };
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${styles[status] ?? "bg-slate-100 text-slate-600"}`}>
      {status}
    </span>
  );
}

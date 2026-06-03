"use client";
import { useEffect, useState } from "react";
import { getAllOrders, updateOrderStatus } from "@/lib/api";

type Order = { id: string; user_id: string; total_amount: number; status: string; address: string; created_at: string; items: any[] };

const ORDER_STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState("all");

  const load = () => getAllOrders().then(setOrders).catch(() => {});
  useEffect(() => { load(); }, []);

  const handle = async (id: string, status: string) => {
    await updateOrderStatus(id, status);
    load();
  };

  const shown = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
        <div className="flex gap-2">
          {["all", ...ORDER_STATUSES].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize transition-colors ${filter === f ? "bg-[#0EA5E9] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {shown.map((o) => (
          <div key={o.id} className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-bold text-slate-900">#{o.id.slice(0, 8)}</span>
                  <StatusBadge status={o.status} />
                </div>
                <div className="text-slate-500 text-sm">{o.address}</div>
                <div className="text-xs text-slate-400 mt-1">{o.items?.length ?? 0} item(s)</div>
              </div>
              <div className="text-right">
                <div className="text-xl font-black text-[#0EA5E9]">{o.total_amount} LYD</div>
                <select
                  value={o.status}
                  onChange={(e) => handle(o.id, e.target.value)}
                  className="mt-2 text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-[#0EA5E9]"
                >
                  {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>
        ))}
        {shown.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">No orders found</div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending:   "bg-amber-100 text-amber-700",
    confirmed: "bg-sky-100 text-sky-700",
    shipped:   "bg-violet-100 text-violet-700",
    delivered: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-red-100 text-red-700",
  };
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${styles[status] ?? "bg-slate-100 text-slate-600"}`}>{status}</span>;
}

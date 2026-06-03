"use client";
import { useEffect, useState } from "react";
import { getMerchants, updateMerchantStatus } from "@/lib/api";
import { Check, X, Clock } from "lucide-react";

type Merchant = { id: string; store_name: string; owner_name: string; city: string; phone: string; status: string };

export default function MerchantsPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [filter, setFilter]     = useState<string>("all");
  const [loading, setLoading]   = useState(true);

  const load = () => getMerchants().then(setMerchants).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handle = async (id: string, status: "approved" | "rejected") => {
    await updateMerchantStatus(id, status);
    load();
  };

  const shown = filter === "all" ? merchants : merchants.filter((m) => m.status === filter);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Merchants</h1>
        <div className="flex gap-2">
          {["all", "pending", "approved", "rejected"].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize transition-colors ${filter === f ? "bg-[#0EA5E9] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-xs text-slate-500 uppercase">
              <th className="text-left p-4 font-semibold">Store</th>
              <th className="text-left p-4 font-semibold">Owner</th>
              <th className="text-left p-4 font-semibold">City</th>
              <th className="text-left p-4 font-semibold">Phone</th>
              <th className="text-left p-4 font-semibold">Status</th>
              <th className="text-left p-4 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((m) => (
              <tr key={m.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                <td className="p-4 font-medium">{m.store_name}</td>
                <td className="p-4 text-slate-600">{m.owner_name}</td>
                <td className="p-4 text-slate-500">{m.city}</td>
                <td className="p-4 text-slate-500 font-mono text-xs">{m.phone}</td>
                <td className="p-4"><StatusBadge status={m.status} /></td>
                <td className="p-4">
                  <div className="flex gap-2">
                    {m.status !== "approved" && (
                      <button onClick={() => handle(m.id, "approved")}
                        className="p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg transition-colors" title="Approve">
                        <Check size={14} />
                      </button>
                    )}
                    {m.status !== "rejected" && (
                      <button onClick={() => handle(m.id, "rejected")}
                        className="p-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors" title="Reject">
                        <X size={14} />
                      </button>
                    )}
                    {m.status !== "pending" && (
                      <button onClick={() => handle(m.id, "pending" as any)}
                        className="p-1.5 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-lg transition-colors" title="Reset to pending">
                        <Clock size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {shown.length === 0 && !loading && (
              <tr><td colSpan={6} className="p-8 text-center text-slate-400">No merchants found</td></tr>
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
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${styles[status] ?? "bg-slate-100 text-slate-600"}`}>{status}</span>;
}

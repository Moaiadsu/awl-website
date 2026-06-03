"use client";
import { useEffect, useState } from "react";
import { getProducts } from "@/lib/api";

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  useEffect(() => { getProducts().then(setProducts).catch(() => {}); }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Products</h1>
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-xs text-slate-500 uppercase">
              <th className="text-left p-4 font-semibold">Name (AR)</th>
              <th className="text-left p-4 font-semibold">Category</th>
              <th className="text-left p-4 font-semibold">Price (LYD)</th>
              <th className="text-left p-4 font-semibold">Unit</th>
              <th className="text-left p-4 font-semibold">Stock</th>
              <th className="text-left p-4 font-semibold">Min Qty</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="p-4">
                  <div className="font-medium">{p.name_ar}</div>
                  <div className="text-xs text-slate-400">{p.name}</div>
                </td>
                <td className="p-4"><span className="px-2 py-0.5 bg-sky-100 text-sky-700 text-xs font-bold rounded-full">{p.category}</span></td>
                <td className="p-4 font-bold text-[#0EA5E9]">{p.price}</td>
                <td className="p-4 text-slate-500 text-xs">{p.unit}</td>
                <td className="p-4">{p.stock}</td>
                <td className="p-4 text-slate-500">{p.min_qty}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

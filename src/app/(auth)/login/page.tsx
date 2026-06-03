"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

export default function LoginPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    if (!token.trim()) { setError("Enter your admin token"); return; }
    Cookies.set("token", token.trim(), { expires: 1 });
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#0A1628] flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-[#0EA5E9] rounded-2xl flex items-center justify-center text-white text-2xl">
            🏪
          </div>
          <div>
            <div className="text-white font-bold text-xl font-[Cairo]">AWL Admin</div>
            <div className="text-[#7DD3FC] text-sm">Wholesale Dashboard</div>
          </div>
        </div>

        <div className="bg-[#1E3A5F] rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-[#7DD3FC] text-sm font-medium mb-2">Admin Token</label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder="Paste your admin JWT token"
              className="w-full bg-[#0D2040] border border-[#2D4E78] rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-[#0EA5E9] text-sm"
            />
            {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
          </div>
          <p className="text-slate-400 text-xs">
            Get your token from the backend startup log (dev_token printed on boot).
          </p>
          <button
            onClick={handleLogin}
            className="w-full bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-bold py-3 rounded-xl transition-colors text-sm"
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
}

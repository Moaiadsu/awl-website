"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminLogin } from "@/lib/api";
import { KeyRound, ShieldCheck } from "lucide-react";

function isJwt(v: string) {
  return v.split(".").length === 3;
}

export default function LoginPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    const t = token.trim();
    if (!t) {
      setError("الرجاء إدخال رمز المسؤول");
      return;
    }
    if (!isJwt(t)) {
      setError("الرمز غير صحيح — تأكد من نسخه كاملاً من سجل الخادم");
      return;
    }
    setError("");
    adminLogin(t);
    router.push("/dashboard");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0A1628",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily: "Cairo, sans-serif",
        direction: "rtl",
      }}
    >
      {/* subtle radial glow */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background:
            "radial-gradient(circle at 50% 0%, rgba(14,165,233,.15), transparent 60%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ width: "100%", maxWidth: 420, position: "relative" }}>
        {/* Brand */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 32,
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "linear-gradient(135deg, #0EA5E9, #0284C7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              fontWeight: 900,
              color: "#fff",
              letterSpacing: "-0.5px",
              boxShadow: "0 8px 24px rgba(14,165,233,.35)",
            }}
          >
            AWL
          </div>
          <div>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: 20, lineHeight: 1.2 }}>
              AWL Admin
            </div>
            <div style={{ color: "#7DD3FC", fontSize: 13 }}>لوحة التحكم</div>
          </div>
        </div>

        {/* Card */}
        <div
          style={{
            background: "#0D2040",
            borderRadius: 16,
            padding: 28,
            border: "1px solid rgba(255,255,255,.07)",
            boxShadow: "0 20px 25px rgba(0,0,0,.4), 0 8px 10px rgba(0,0,0,.2)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 20,
            }}
          >
            <ShieldCheck size={18} color="#7DD3FC" />
            <div style={{ color: "#fff", fontWeight: 800, fontSize: 16 }}>
              تسجيل الدخول
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: "block",
                color: "#7DD3FC",
                fontSize: 13,
                fontWeight: 700,
                marginBottom: 8,
              }}
            >
              رمز المسؤول
            </label>
            <div style={{ position: "relative" }}>
              <KeyRound
                size={16}
                style={{
                  position: "absolute",
                  right: 14,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#4A7AAB",
                  pointerEvents: "none",
                }}
              />
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                placeholder="ألصق رمز JWT الخاص بالمسؤول"
                style={{
                  width: "100%",
                  height: 44,
                  background: "#0A1628",
                  border: "1.5px solid #1A3356",
                  borderRadius: 10,
                  padding: "0 44px 0 16px",
                  color: "#fff",
                  fontSize: 14,
                  fontFamily: "Cairo, sans-serif",
                  outline: "none",
                  direction: "ltr",
                  textAlign: "right",
                  transition: "border-color .15s, box-shadow .15s",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#0EA5E9";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(14,165,233,.18)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#1A3356";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>
            {error && (
              <p style={{ color: "#FCA5A5", fontSize: 12, marginTop: 8, fontWeight: 600 }}>
                {error}
              </p>
            )}
          </div>

          <p
            style={{
              color: "#4A7AAB",
              fontSize: 12,
              lineHeight: 1.6,
              marginBottom: 20,
            }}
          >
            انظر إلى نافذة الخادم (terminal) واحصل على السطر المكتوب بعد{" "}
          <span style={{ color: "#7DD3FC", fontFamily: "Courier New, monospace" }}>
            [DEV] Admin token (24h):
          </span>
          {" "}وألصقه هنا.
          </p>

          <button
            onClick={handleLogin}
            style={{
              width: "100%",
              height: 44,
              background: "#0EA5E9",
              color: "#fff",
              fontWeight: 800,
              fontSize: 14,
              borderRadius: 10,
              border: "1.5px solid #0EA5E9",
              cursor: "pointer",
              fontFamily: "Cairo, sans-serif",
              boxShadow: "0 4px 12px rgba(14,165,233,.3)",
              transition: "background .15s, border-color .15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#0284C7";
              e.currentTarget.style.borderColor = "#0284C7";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#0EA5E9";
              e.currentTarget.style.borderColor = "#0EA5E9";
            }}
          >
            دخول
          </button>
        </div>

        <div
          style={{
            textAlign: "center",
            color: "#4A7AAB",
            fontSize: 11,
            marginTop: 20,
            fontFamily: "Courier New, monospace",
            direction: "ltr",
          }}
        >
          AWL Wholesale · Admin Dashboard
        </div>
      </div>
    </div>
  );
}

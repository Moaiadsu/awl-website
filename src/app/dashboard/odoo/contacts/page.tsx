"use client";
import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Search, Users } from "lucide-react";
import { type OdooContactRow, getOdooContacts, syncOdooContacts } from "@/lib/api";

export default function OdooContactsPage() {
  const [contacts, setContacts] = useState<OdooContactRow[]>([]);
  const [search, setSearch]     = useState("");
  const [loading, setLoading]   = useState(true);
  const [syncing, setSyncing]   = useState(false);
  const [error, setError]       = useState("");
  const [syncedAt, setSyncedAt] = useState("");

  async function loadFromDb() {
    try {
      const json = await getOdooContacts();
      if (json.error) { setError(json.error as unknown as string); return; }
      setContacts(json.data ?? []);
      setSyncedAt(json.synced_at ?? "");
    } catch {
      setError("تعذّر الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadFromDb(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function onSync() {
    setSyncing(true);
    setError("");
    try {
      const json = await syncOdooContacts();
      if (json.error) { setError(json.error); return; }
      setContacts(json.data ?? []);
      setSyncedAt(json.synced_at ?? "");
    } catch {
      setError("فشلت المزامنة — تحقق من إعدادات Odoo");
    } finally {
      setSyncing(false);
    }
  }

  const shown = useMemo(() => {
    if (!search.trim()) return contacts;
    const q = search.trim().toLowerCase();
    return contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q),
    );
  }, [contacts, search]);

  const syncedLabel = syncedAt
    ? `آخر مزامنة: ${new Date(syncedAt).toLocaleString("ar")}`
    : "لم تتم المزامنة بعد";

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      {/* ── PAGE HEADER ──────────────────────────── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 900, color: "#0A1628" }}>
          جهات الاتصال — Odoo
        </div>
        <div style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>
          البيانات محفوظة محلياً — اضغط مزامنة لجلب آخر تحديث من res.partner
        </div>
      </div>

      {/* ── TOOLBAR ──────────────────────────────── */}
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          border: "1px solid #E2E8F0",
          boxShadow: "0 1px 2px rgba(15,23,42,.05)",
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 16,
        }}
      >
        {/* Sync button — RTL leading edge */}
        <button
          onClick={onSync}
          disabled={syncing}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            height: 36,
            padding: "0 16px",
            background: syncing ? "#7DD3FC" : "#0EA5E9",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontFamily: "Cairo, sans-serif",
            fontSize: 13,
            fontWeight: 700,
            cursor: syncing ? "not-allowed" : "pointer",
            transition: "background .15s",
            flexShrink: 0,
          }}
        >
          <RefreshCw
            size={14}
            style={{ animation: syncing ? "spin 0.8s linear infinite" : "none" }}
          />
          {syncing ? "جاري المزامنة..." : "مزامنة من Odoo"}
        </button>

        {/* Search */}
        <div style={{ position: "relative", flex: 1, minWidth: 220, maxWidth: 340 }}>
          <Search
            size={15}
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#94A3B8",
              pointerEvents: "none",
            }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="البحث في جهات الاتصال..."
            style={{
              height: 36,
              width: "100%",
              padding: "0 40px 0 12px",
              border: "1.5px solid #E2E8F0",
              borderRadius: 8,
              fontFamily: "Cairo, sans-serif",
              fontSize: 14,
              color: "#1E293B",
              background: "#F8FAFC",
              outline: "none",
              direction: "rtl",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#0EA5E9";
              e.currentTarget.style.background = "#fff";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(14,165,233,.12)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "#E2E8F0";
              e.currentTarget.style.background = "#F8FAFC";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
        </div>

        {/* Count + last-synced */}
        <div style={{ marginRight: "auto", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#64748B", fontWeight: 600 }}>
            <Users size={14} color="#0EA5E9" />
            {loading ? "جاري التحميل..." : `${shown.length} جهة اتصال`}
          </div>
          <div style={{ fontSize: 11, color: "#94A3B8" }}>{syncedLabel}</div>
        </div>
      </div>

      {/* ── TABLE ────────────────────────────────── */}
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          border: "1px solid #E2E8F0",
          boxShadow: "0 1px 2px rgba(15,23,42,.05)",
          overflow: "hidden",
        }}
      >
        {error ? (
          <ErrorState message={error} />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead style={{ background: "#F1F5F9" }}>
                <tr style={{ borderBottom: "1px solid #E2E8F0" }}>
                  <Th width={60}>#</Th>
                  <Th>الاسم</Th>
                  <Th>البريد الإلكتروني</Th>
                  <Th width={180}>الهاتف</Th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={4} style={emptyCell}>
                      <Spinner label="جاري التحميل..." />
                    </td>
                  </tr>
                )}
                {!loading && shown.length === 0 && (
                  <tr>
                    <td colSpan={4} style={emptyCell}>
                      <span>لا توجد جهات اتصال</span>
                      {contacts.length === 0 && (
                        <div style={{ fontSize: 12, color: "#CBD5E1", marginTop: 6 }}>
                          اضغط &quot;مزامنة من Odoo&quot; لجلب البيانات
                        </div>
                      )}
                    </td>
                  </tr>
                )}
                {!loading &&
                  shown.map((c) => (
                    <tr
                      key={c.id}
                      style={{ borderBottom: "1px solid #F1F5F9", transition: "background .1s" }}
                      onMouseEnter={(e) =>
                        ((e.currentTarget as HTMLElement).style.background = "#F8FAFC")
                      }
                      onMouseLeave={(e) =>
                        ((e.currentTarget as HTMLElement).style.background = "transparent")
                      }
                    >
                      <Td>
                        <span style={{ fontFamily: "monospace", color: "#CBD5E1", fontSize: 12 }}>
                          {c.id}
                        </span>
                      </Td>
                      <Td>
                        <span style={{ fontWeight: 700, color: "#1E293B" }}>{c.name}</span>
                      </Td>
                      <Td>
                        {c.email ? (
                          <a
                            href={`mailto:${c.email}`}
                            style={{ color: "#0EA5E9", textDecoration: "none", fontSize: 13 }}
                          >
                            {c.email}
                          </a>
                        ) : (
                          <span style={{ color: "#CBD5E1" }}>—</span>
                        )}
                      </Td>
                      <Td>
                        <span style={{ direction: "ltr", display: "inline-block", color: "#475569" }}>
                          {c.phone || <span style={{ color: "#CBD5E1" }}>—</span>}
                        </span>
                      </Td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const emptyCell: React.CSSProperties = {
  padding: 56,
  textAlign: "center",
  color: "#94A3B8",
  fontSize: 14,
};

function Th({ children, width }: { children: React.ReactNode; width?: number }) {
  return (
    <th
      style={{
        padding: "12px 16px",
        textAlign: "right",
        fontSize: 12,
        fontWeight: 700,
        color: "#64748B",
        letterSpacing: ".04em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
        width,
      }}
    >
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return (
    <td style={{ padding: "12px 16px", textAlign: "right", color: "#334155", verticalAlign: "middle" }}>
      {children}
    </td>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div
      style={{
        padding: 48,
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: "#FEE2E2",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 20,
        }}
      >
        ⚠
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#B91C1C" }}>خطأ في الاتصال</div>
      <div style={{ fontSize: 12, color: "#94A3B8", maxWidth: 380 }}>{message}</div>
    </div>
  );
}

function Spinner({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <div
        style={{
          width: 28,
          height: 28,
          border: "3px solid #E2E8F0",
          borderTopColor: "#0EA5E9",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <span style={{ fontSize: 13, color: "#94A3B8" }}>{label}</span>
    </div>
  );
}

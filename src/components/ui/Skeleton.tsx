"use client";

/** A single pulsing placeholder box — the building block for every loading
 * state in the dashboard, so a genuinely-empty list is never confused with
 * one that just hasn't finished its first fetch yet. */
export function Skeleton({
  width = "100%",
  height = 14,
  radius = 8,
  style,
}: {
  width?: number | string;
  height?: number | string;
  radius?: number;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: radius,
        background: "#E2E8F0",
        animation: "awl-pulse 1.4s ease-in-out infinite",
        ...style,
      }}
    />
  );
}

/** N skeleton stat cards matching the dashboard's card shell (icon chip +
 * label + value + sub line). */
export function SkeletonStatCards({ count = 4 }: { count?: number }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{
          background: "linear-gradient(145deg, #ffffff 0%, #F5F9FF 100%)",
          borderRadius: 16, border: "1px solid rgba(14,165,233,0.10)",
          boxShadow: "0 2px 10px rgba(10,22,40,0.05)", padding: 20,
        }}>
          <Skeleton width={40} height={40} radius={12} />
          <div style={{ marginTop: 14 }}><Skeleton width="60%" height={12} /></div>
          <div style={{ marginTop: 10 }}><Skeleton width="40%" height={22} /></div>
          <div style={{ marginTop: 10 }}><Skeleton width="50%" height={10} /></div>
        </div>
      ))}
    </div>
  );
}

/** N skeleton table rows matching a typical dashboard list row (avatar/icon
 * chip + two text lines + trailing badge). */
export function SkeletonRows({ count = 6 }: { count?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{
          background: "linear-gradient(145deg, #ffffff 0%, #F5F9FF 100%)",
          borderRadius: 14, border: "1px solid rgba(14,165,233,0.10)",
          boxShadow: "0 2px 10px rgba(10,22,40,0.05)",
          padding: "14px 18px", display: "flex", alignItems: "center", gap: 14,
        }}>
          <Skeleton width={40} height={40} radius={10} />
          <div style={{ flex: 1 }}>
            <Skeleton width="35%" height={13} />
            <div style={{ marginTop: 8 }}><Skeleton width="55%" height={11} /></div>
          </div>
          <Skeleton width={70} height={22} radius={9999} />
        </div>
      ))}
    </div>
  );
}

/** N skeleton cards matching the product/trending/offer card grid. */
export function SkeletonCards({ count = 8 }: { count?: number }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{
          background: "#ffffff", borderRadius: 16,
          border: "1px solid rgba(14,165,233,0.10)",
          boxShadow: "0 2px 10px rgba(10,22,40,0.06)", overflow: "hidden",
        }}>
          <Skeleton width="100%" height={120} radius={0} />
          <div style={{ padding: "14px 16px" }}>
            <Skeleton width="80%" height={14} />
            <div style={{ marginTop: 10 }}><Skeleton width="45%" height={20} /></div>
            <div style={{ marginTop: 10 }}><Skeleton width="60%" height={22} radius={9999} /></div>
          </div>
        </div>
      ))}
    </div>
  );
}

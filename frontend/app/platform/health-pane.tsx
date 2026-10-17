"use client";

export function HealthPane({
  healthData,
}: {
  healthData?: any;
}) {
  const overall = healthData?.overall || "UNKNOWN";
  const services: any[] = healthData?.services || ([] as any[]);

  const metrics = healthData?.metrics;

  return (
    <div style={{ display: "grid", gap: "20px" }}>
      {/* Telemetry Summary Header */}
      {metrics && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
          <div style={{ background: "#FFF", border: "1px solid #E5E7EB", borderRadius: "8px", padding: "14px" }}>
            <div style={{ fontSize: "11.5px", color: "#6B7280" }}>Avg API Latency</div>
            <div style={{ fontSize: "22px", fontWeight: 800, color: "#111827", marginTop: "4px" }}>{metrics.avgLatencyMs}ms</div>
          </div>
          <div style={{ background: "#FFF", border: "1px solid #E5E7EB", borderRadius: "8px", padding: "14px" }}>
            <div style={{ fontSize: "11.5px", color: "#6B7280" }}>System Error Rate</div>
            <div style={{ fontSize: "22px", fontWeight: 800, color: "#10B981", marginTop: "4px" }}>{metrics.errorRate}</div>
          </div>
          <div style={{ background: "#FFF", border: "1px solid #E5E7EB", borderRadius: "8px", padding: "14px" }}>
            <div style={{ fontSize: "11.5px", color: "#6B7280" }}>Active Member Sessions</div>
            <div style={{ fontSize: "22px", fontWeight: 800, color: "#111827", marginTop: "4px" }}>{metrics.activeSessions}</div>
          </div>
          <div style={{ background: "#FFF", border: "1px solid #E5E7EB", borderRadius: "8px", padding: "14px" }}>
            <div style={{ fontSize: "11.5px", color: "#6B7280" }}>Storage Utilized</div>
            <div style={{ fontSize: "22px", fontWeight: 800, color: "#111827", marginTop: "4px" }}>{metrics.storageUsedGb} GB / {metrics.storageLimitGb} GB</div>
          </div>
        </div>
      )}

      <div style={{ background: "#FFF", border: "1px solid #E5E7EB", borderRadius: "10px", padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <h2 style={{ fontSize: "17px", fontWeight: 700, margin: 0 }}>Infrastructure & Service Health Monitor</h2>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#6B7280" }}>Real-time telemetry across distributed database, storage and notification layers</p>
          </div>
          <span style={{
            background: overall === "HEALTHY" ? "#DEF7EC" : "#FEF3C7",
            color: overall === "HEALTHY" ? "#03543F" : "#92400E",
            padding: "4px 12px", borderRadius: "14px", fontSize: "12px", fontWeight: 800
          }}>
            PLATFORM STATUS: {overall}
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "14px" }}>
          {services.map(s => {
            const isHealthy = s.status === "HEALTHY";
            const latency = typeof s.latencyMs === "number" ? `${s.latencyMs}ms` : s.latency || "N/A";
            return (
              <div key={s.name} style={{ background: "#F9FAFB", padding: "16px", borderRadius: "8px", border: "1px solid #E5E7EB" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontWeight: 700, fontSize: "13px" }}>{s.name}</div>
                  <span style={{ color: isHealthy ? "#10B981" : "#D97706", fontWeight: 800, fontSize: "11px" }}>{s.status}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px", fontSize: "12px", color: "#6B7280" }}>
                  <span>Latency: <b>{latency}</b></span>
                  <span>Uptime: <b>{s.uptime || "—"}</b></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

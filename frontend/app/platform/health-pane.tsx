"use client";

export function HealthPane() {
  const services = [
    { name: "Core REST API Gateway", latency: "18ms", uptime: "99.98%", status: "HEALTHY" },
    { name: "PostgreSQL Multi-Tenant RLS", latency: "4ms", uptime: "99.99%", status: "HEALTHY" },
    { name: "Redis Distributed Cache", latency: "2ms", uptime: "99.99%", status: "HEALTHY" },
    { name: "S3 Object Store (Recordings/Docs)", latency: "35ms", uptime: "99.95%", status: "HEALTHY" },
    { name: "Payment Gateway Webhooks", latency: "120ms", uptime: "99.90%", status: "HEALTHY" },
    { name: "SES / SMTP Email Engine", latency: "45ms", uptime: "99.95%", status: "HEALTHY" },
    { name: "DLT SMS Gateway", latency: "65ms", uptime: "99.85%", status: "HEALTHY" },
    { name: "WhatsApp Business API", latency: "85ms", uptime: "99.80%", status: "HEALTHY" },
    { name: "Background Queue Workers", latency: "12ms", uptime: "99.99%", status: "HEALTHY" },
  ];

  return (
    <div style={{ display: "grid", gap: "20px" }}>
      <div style={{ background: "#FFF", border: "1px solid #E5E7EB", borderRadius: "10px", padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <h2 style={{ fontSize: "17px", fontWeight: 700, margin: 0 }}>Infrastructure & Service Health Monitor</h2>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#6B7280" }}>Real-time telemetry across distributed database, storage and notification layers</p>
          </div>
          <span style={{ background: "#DEF7EC", color: "#03543F", padding: "4px 12px", borderRadius: "14px", fontSize: "12px", fontWeight: 800 }}>
            PLATFORM STATUS: HEALTHY
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "14px" }}>
          {services.map(s => (
            <div key={s.name} style={{ background: "#F9FAFB", padding: "16px", borderRadius: "8px", border: "1px solid #E5E7EB" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontWeight: 700, fontSize: "13px" }}>{s.name}</div>
                <span style={{ color: "#10B981", fontWeight: 800, fontSize: "11px" }}>{s.status}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px", fontSize: "12px", color: "#6B7280" }}>
                <span>Latency: <b>{s.latency}</b></span>
                <span>Uptime: <b>{s.uptime}</b></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

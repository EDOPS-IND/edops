"use client";

export function UsagePane() {
  const usageMeters = [
    { title: "Student Roster Utilization", current: "2,450", limit: "5,000", pct: 49 },
    { title: "Teacher Faculty Limits", current: "150", limit: "500", pct: 30 },
    { title: "S3 Object Storage", current: "782 GB", limit: "2,048 GB", pct: 38 },
    { title: "Monthly API Requests", current: "1.42M", limit: "5.0M", pct: 28 },
    { title: "DLT Registered SMS", current: "4,200", limit: "10,000", pct: 42 },
    { title: "WhatsApp Business Volume", current: "3,200", limit: "10,000", pct: 32 },
  ];

  return (
    <div style={{ display: "grid", gap: "20px" }}>
      <div style={{ background: "#FFF", border: "1px solid #E5E7EB", borderRadius: "10px", padding: "20px" }}>
        <h2 style={{ fontSize: "17px", fontWeight: 700, margin: "0 0 16px" }}>Platform Resource Consumption Metering</h2>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" }}>
          {usageMeters.map(u => (
            <div key={u.title} style={{ background: "#F9FAFB", padding: "16px", borderRadius: "8px", border: "1px solid #E5E7EB" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: 600 }}>
                <span>{u.title}</span>
                <span>{u.pct}%</span>
              </div>
              <div style={{ fontSize: "18px", fontWeight: 800, margin: "6px 0" }}>
                {u.current} <span style={{ fontSize: "12px", color: "#6B7280" }}>/ {u.limit}</span>
              </div>
              <div style={{ width: "100%", background: "#E5E7EB", height: "8px", borderRadius: "4px", overflow: "hidden" }}>
                <div style={{ width: `${u.pct}%`, background: u.pct > 90 ? "#DC2626" : u.pct > 75 ? "#F59E0B" : "#10B981", height: "100%" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", fontSize: "11px", color: "#6B7280" }}>
                <span>Threshold: 70% Info · 80% Warn · 90% Critical</span>
                <span style={{ fontWeight: 700, color: "#10B981" }}>OK</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

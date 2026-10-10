"use client";

export function UsagePane({
  dashboardData,
}: {
  dashboardData?: any;
}) {
  const students = dashboardData?.users?.students ?? 0;
  const teachers = dashboardData?.users?.teachers ?? 0;
  const parents = dashboardData?.users?.parents ?? 0;
  const storage = dashboardData?.usage?.storage ?? 0;
  const apiRequests = dashboardData?.usage?.apiRequests ?? 0;
  const schools = dashboardData?.schools?.total ?? 0;

  const usageMeters = [
    {
      title: "Student Roster Utilization",
      current: students.toLocaleString(),
      limit: "5,000",
      pct: Math.min(100, Math.round((students / 5000) * 100)),
    },
    {
      title: "Teacher Faculty Utilization",
      current: teachers.toLocaleString(),
      limit: "500",
      pct: Math.min(100, Math.round((teachers / 500) * 100)),
    },
    {
      title: "Parent Accounts Registered",
      current: parents.toLocaleString(),
      limit: "10,000",
      pct: Math.min(100, Math.round((parents / 10000) * 100)),
    },
    {
      title: "Object Storage Used",
      current: `${storage} GB`,
      limit: "2,048 GB",
      pct: Math.min(100, Math.round((storage / 2048) * 100)),
    },
    {
      title: "Monthly Domain API Events",
      current: apiRequests.toLocaleString(),
      limit: "5,000,000",
      pct: Math.min(100, Math.round((apiRequests / 5000000) * 100)),
    },
    {
      title: "Tenant Schools Capacity",
      current: schools.toLocaleString(),
      limit: "50",
      pct: Math.min(100, Math.round((schools / 50) * 100)),
    },
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
                <div style={{ width: `${Math.max(u.pct, 1)}%`, background: u.pct > 90 ? "#DC2626" : u.pct > 75 ? "#F59E0B" : "#10B981", height: "100%" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", fontSize: "11px", color: "#6B7280" }}>
                <span>Threshold: 70% Info · 80% Warn · 90% Critical</span>
                <span style={{ fontWeight: 700, color: u.pct > 90 ? "#DC2626" : u.pct > 75 ? "#F59E0B" : "#10B981" }}>
                  {u.pct > 90 ? "CRITICAL" : u.pct > 75 ? "WARNING" : "HEALTHY"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

"use client";

export function UsagePane({ dashboardData }: { dashboardData?: any }) {
  const rows = [
    ["Students", dashboardData?.users?.students],
    ["Teachers", dashboardData?.users?.teachers],
    ["Parents", dashboardData?.users?.parents],
    ["Storage (GB)", dashboardData?.usage?.storage],
    ["API events", dashboardData?.usage?.apiRequests],
    ["Schools", dashboardData?.schools?.total],
  ];
  return <section className="bg-white border rounded-xl p-5"><h2 className="font-bold mb-4">Recorded platform usage</h2><dl className="grid grid-cols-2 gap-4">{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd className="font-bold">{value == null ? "Not available" : Number(value).toLocaleString()}</dd></div>)}</dl></section>;
}

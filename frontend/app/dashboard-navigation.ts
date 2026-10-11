"use client";

import { useEffect, useState } from "react";
import { DashboardSection, getDashboardNavigation, OrganizationSummary } from "./edops-api";

export function useDashboardNavigation(organizationId: string, role: OrganizationSummary["role"]) {
  const [sections, setSections] = useState<DashboardSection[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    setLoading(true);
    getDashboardNavigation(organizationId, role)
      .then(result => { if (live) { setSections(result); setError(""); } })
      .catch(reason => { if (live) { setSections([]); setError(reason instanceof Error ? reason.message : "Navigation unavailable"); } })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [organizationId, role]);

  return { sections, loading, error,
    has: (key: string) => sections.some(section => section.items.some(item => item.key === key)),
  };
}

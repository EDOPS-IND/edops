"use client";

import React from "react";
import { PrincipalWorkspace } from "./principal/principal-workspace";
import { SchoolData, OrganizationSummary } from "./edops-api";

export { PrincipalWorkspace };

export function PrincipalDashboard({
  school,
  onNotify,
}: {
  school: SchoolData;
  onNotify?: (msg: string) => void;
}) {
  const org: OrganizationSummary = {
    id: school?.organization?.id || "demo-school",
    name: school?.organization?.name || "Delhi Public School",
    slug: school?.organization?.slug || "dps",
    role: "principal",
    status: (school?.organization?.status as any) || "active",
  };

  return (
    <PrincipalWorkspace
      organization={org}
      onLogout={() => {
        if (typeof window !== "undefined") {
          window.location.reload();
        }
      }}
      onSwitchOrganization={() => {}}
      organizations={[org]}
    />
  );
}

export default PrincipalDashboard;

"use client";

import React from "react";
import { useDashboardNavigation } from "../dashboard-navigation";
import { OrganizationSummary } from "../edops-api";
import { FeatureUnavailableCard } from "./feature-unavailable-card";

export interface FeatureGuardProps {
  organizationId: string;
  role: OrganizationSummary["role"];
  featureKey: string;
  children: React.ReactNode;
  title?: string;
  description?: string;
  onBackToDashboard?: () => void;
}

export function FeatureGuard({
  organizationId,
  role,
  featureKey,
  children,
  title,
  description,
  onBackToDashboard,
}: FeatureGuardProps) {
  const { has } = useDashboardNavigation(organizationId, role);

  const isEnabled =
    featureKey === "dashboard" ||
    featureKey === "overview" ||
    has(featureKey);

  if (!isEnabled) {
    return (
      <FeatureUnavailableCard
        featureName={featureKey}
        title={title}
        description={description}
        onBackToDashboard={onBackToDashboard}
      />
    );
  }

  return <>{children}</>;
}

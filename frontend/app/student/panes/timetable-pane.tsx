"use client";

import React from "react";
import { UniversalTimetable } from "../../components/universal-timetable";

interface TimetablePaneProps {
  organizationId: string;
  activeViewMode?: "today" | "weekly";
  onViewModeChange?: (mode: string) => void;
}

export const TimetablePane: React.FC<TimetablePaneProps> = ({
  organizationId,
  activeViewMode,
  onViewModeChange,
}) => {
  return (
    <UniversalTimetable
      organizationId={organizationId}
      role="student"
      activeViewMode={activeViewMode}
      onViewModeChange={onViewModeChange}
    />
  );
};

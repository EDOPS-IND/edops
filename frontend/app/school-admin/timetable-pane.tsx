"use client";

import React from "react";
import { UniversalTimetable } from "../components/universal-timetable";

export function TimetablePane({
  organizationId,
  activeViewMode,
  onViewModeChange,
}: {
  organizationId?: string;
  activeViewMode?: "class" | "teacher" | "room";
  onViewModeChange?: (mode: "class" | "teacher" | "room") => void;
}) {
  return (
    <UniversalTimetable
      organizationId={organizationId || ""}
      role="school_admin"
      activeViewMode={activeViewMode}
      onViewModeChange={onViewModeChange as any}
    />
  );
}

"use client";

import React from "react";
import { UniversalTimetable } from "../../components/universal-timetable";

interface TimetablePaneProps {
  organizationId: string;
  activeViewMode?: "today" | "weekly";
  onViewModeChange?: (mode: string) => void;
  onTakeAttendance?: (sectionId?: string, periodNumber?: number, classSection?: string) => void;
  onLogLesson?: (classSection?: string, sectionId?: string) => void;
}

export function TimetablePane({
  organizationId,
  activeViewMode,
  onViewModeChange,
  onTakeAttendance,
  onLogLesson,
}: TimetablePaneProps) {
  return (
    <UniversalTimetable
      organizationId={organizationId}
      role="teacher"
      activeViewMode={activeViewMode}
      onViewModeChange={onViewModeChange}
      onTakeAttendance={onTakeAttendance}
      onLogLesson={onLogLesson}
    />
  );
}

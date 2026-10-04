"use client";

import React from "react";
import { Bell, CalendarCheck2, ClipboardCheck, Trophy, Video } from "lucide-react";
import { ClassRoom } from "./types";

export { Modal, Banner, Empty, FeatureCard, FormActions, Metric } from "../components/ui";


export async function run(task: () => Promise<void>, onError: (message: string) => void) {
  onError("");
  try {
    await task();
  } catch (reason) {
    onError(reason instanceof Error ? reason.message : "Something went wrong");
  }
}

export function keyOf(item: ClassRoom) {
  return `${item.sectionId}:${item.subjectId}`;
}

export function dateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function dateOnly(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(`${value}T00:00:00`));
}

export function percent(value: number | null) {
  return value === null ? "—" : `${Math.round(value)}%`;
}

export function duration(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function formatBytes(bytes: number) {
  return bytes < 1048576 ? `${Math.ceil(bytes / 1024)} KB` : `${(bytes / 1048576).toFixed(1)} MB`;
}

export function eventName(value: string) {
  return (
    ({
      "assignment.published": "New assignment published",
      "submission.graded": "Assignment graded",
      "attendance.finalized": "Attendance finalized",
      "recording.published": "New recording published",
    } as Record<string, string>)[value] ?? value
  );
}

export function eventIcon(value: string) {
  const Icon = value.includes("assignment")
    ? ClipboardCheck
    : value.includes("attendance")
    ? CalendarCheck2
    : value.includes("recording")
    ? Video
    : value.includes("arena")
    ? Trophy
    : Bell;
  return <Icon size={17} aria-hidden="true" />;
}

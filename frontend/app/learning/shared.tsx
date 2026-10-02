"use client";

import React from "react";
import { Bell, CalendarCheck2, ClipboardCheck, Inbox, Trophy, Video, X } from "lucide-react";
import { ClassRoom } from "./types";

export function FeatureCard({
  title,
  copy,
  action,
  children,
}: {
  title: string;
  copy: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="feature-surface">
      <header>
        <div>
          <h2>{title}</h2>
          <p>{copy}</p>
        </div>
        {action}
      </header>
      <div className="feature-body">{children}</div>
    </section>
  );
}

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="modal-backdrop">
      <section className="action-modal product-modal" role="dialog" aria-modal="true" aria-label={title}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>
        <h2>{title}</h2>
        {children}
      </section>
    </div>
  );
}

export function FormActions({
  onCancel,
  label = "Save",
  disabled = false,
}: {
  onCancel: () => void;
  label?: string;
  disabled?: boolean;
}) {
  return (
    <div className="modal-actions">
      <button type="button" className="secondary-button" onClick={onCancel}>
        Cancel
      </button>
      <button className="primary-button" disabled={disabled}>
        {label}
      </button>
    </div>
  );
}

export function Empty({ title, copy }: { title: string; copy: string }) {
  return (
    <div className="product-empty">
      <span><Inbox size={20} /></span>
      <h3>{title}</h3>
      <p>{copy}</p>
    </div>
  );
}

export function Banner({ text }: { text: string }) {
  return <div className="form-error product-error" role="alert">{text}</div>;
}

export function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="score-metric">
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}

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

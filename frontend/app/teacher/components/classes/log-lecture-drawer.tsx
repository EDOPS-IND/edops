"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  FileText,
  UploadCloud,
  Link as LinkIcon,
  Paperclip,
} from "lucide-react";
import { T, TeacherClass, TimetableSlotItem } from "./types";
import { logTeacherLecture } from "../../../edops-api";

interface LogLectureDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  classes: TeacherClass[];
  timetableSlots: TimetableSlotItem[];
  defaultClassSection?: string;
  defaultSubjectName?: string;
  defaultPeriodInfo?: string;
  onSuccess: () => Promise<void> | void;
}

export function LogLectureDrawer({
  isOpen,
  onClose,
  organizationId,
  classes,
  timetableSlots,
  defaultClassSection,
  defaultSubjectName,
  defaultPeriodInfo,
  onSuccess,
}: LogLectureDrawerProps) {
  const [form, setForm] = useState({
    classSection: "",
    subjectName: "",
    periodInfo: "",
    topic: "",
    date: new Date().toISOString().slice(0, 10),
    notes: "",
    homework: "",
    resources: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [attachmentMode, setAttachmentMode] = useState<"file" | "url">("file");
  const [selectedFile, setSelectedFile] = useState<{ name: string; size: string; dataUrl?: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      const targetSection = defaultClassSection || classes[0]?.className || "Class 10 - A";
      const assignedClass = classes.find((c) => c.className === targetSection || targetSection.includes(c.className));
      const targetSubject = defaultSubjectName || assignedClass?.subjectName || classes[0]?.subjectName || "Mathematics";

      const matchSlot = timetableSlots.find((s) =>
        (s.classSection === targetSection || targetSection.includes(s.classSection || "") || (s.classSection || "").includes(targetSection)) &&
        (!s.subject || !targetSubject || s.subject.toLowerCase() === targetSubject.toLowerCase() || targetSubject.toLowerCase().includes(s.subject.toLowerCase()))
      );

      const resolvedPeriod = defaultPeriodInfo || (matchSlot ? `Period ${matchSlot.period} (${matchSlot.startTime || ""} - ${matchSlot.endTime || ""})`.replace(" - )", ")") : "");

      setForm({
        classSection: targetSection,
        subjectName: targetSubject,
        periodInfo: resolvedPeriod,
        topic: "",
        date: new Date().toISOString().slice(0, 10),
        notes: "",
        homework: "",
        resources: "",
      });
      setError("");
      setAttachmentMode("file");
      setSelectedFile(null);
      setIsDragging(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [isOpen, defaultClassSection, defaultSubjectName, defaultPeriodInfo, classes, timetableSlots]);

  if (!isOpen) return null;

  function handleFileSelected(file: File) {
    if (!file) return;
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
    const sizeStr = Number(sizeInMb) < 0.1 ? `${Math.round(file.size / 1024)} KB` : `${sizeInMb} MB`;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setSelectedFile({
        name: file.name,
        size: sizeStr,
        dataUrl: result,
      });
      setForm((prev) => ({ ...prev, resources: result || file.name }));
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.topic.trim() || !form.classSection || !form.subjectName) {
      setError("Please fill in the class, subject, and lecture topic.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await logTeacherLecture(organizationId, form);
      await onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to log lecture.");
    } finally {
      setSaving(false);
    }
  }

  const assignedSubjectSlots = timetableSlots.filter((s) => {
    const classMatches = !form.classSection ||
      s.classSection === form.classSection ||
      form.classSection.includes(s.classSection || "") ||
      (s.classSection || "").includes(form.classSection);
    const subjectMatches = !form.subjectName ||
      !s.subject ||
      s.subject.toLowerCase() === form.subjectName.toLowerCase() ||
      form.subjectName.toLowerCase().includes(s.subject.toLowerCase());
    return classMatches && subjectMatches;
  });

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(12, 30, 51, 0.55)",
        backdropFilter: "blur(2px)",
        zIndex: 1000,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <aside
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          height: "100%",
          width: "min(620px, 100vw)",
          background: T.white,
          boxShadow: "-12px 0 30px rgba(0,0,0,0.18)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "18px 24px",
            borderBottom: `1px solid ${T.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: T.navy }}>
              Log Today&apos;s Classroom Lecture
            </h3>
            <p style={{ margin: "4px 0 0", fontSize: "12px", color: T.slate }}>
              Record the topic, homework, and study materials for this period.
            </p>
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            style={{ background: "transparent", border: "none", cursor: "pointer", color: T.slate, padding: "4px" }}
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div style={{ margin: "14px 24px 0", padding: "10px 14px", borderRadius: "6px", background: T.roseBg, color: T.roseDark, fontSize: "12px" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", flex: 1, overflowY: "auto" }}>
          <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "16px", flex: 1 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: T.navy, textTransform: "uppercase", marginBottom: "4px" }}>
                  Class / Section *
                </label>
                <select
                  value={form.classSection}
                  onChange={(e) => {
                    const targetClass = classes.find((c) => c.className === e.target.value);
                    const subName = targetClass?.subjectName || form.subjectName;
                    const matchSlot = timetableSlots.find((s) =>
                      (s.classSection === e.target.value || e.target.value.includes(s.classSection || "") || (s.classSection || "").includes(e.target.value)) &&
                      (!s.subject || !subName || s.subject.toLowerCase() === subName.toLowerCase() || subName.toLowerCase().includes(s.subject.toLowerCase()))
                    );
                    setForm({
                      ...form,
                      classSection: e.target.value,
                      subjectName: subName,
                      periodInfo: matchSlot ? `Period ${matchSlot.period} (${matchSlot.startTime || ""} - ${matchSlot.endTime || ""})`.replace(" - )", ")") : "",
                    });
                  }}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: `1px solid ${T.border}`, fontSize: "13px", background: T.white }}
                >
                  {classes.map((c) => (
                    <option key={c.sectionId} value={c.className}>
                      {c.className}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: T.navy, textTransform: "uppercase", marginBottom: "4px" }}>
                  Subject *
                </label>
                <input
                  type="text"
                  value={form.subjectName}
                  onChange={(e) => setForm({ ...form, subjectName: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: `1px solid ${T.border}`, fontSize: "13px", boxSizing: "border-box" }}
                  placeholder="e.g. Mathematics"
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: T.navy, textTransform: "uppercase", marginBottom: "4px" }}>
                Lecture Title &amp; Topic *
              </label>
              <input
                type="text"
                required
                value={form.topic}
                onChange={(e) => setForm({ ...form, topic: e.target.value })}
                placeholder="e.g. Lec-1: Algebra: Number System"
                style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: `1px solid ${T.border}`, fontSize: "13px", fontWeight: 600, boxSizing: "border-box" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "12px" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: T.navy, textTransform: "uppercase" }}>
                    Timetable Period / Session
                  </label>
                  {assignedSubjectSlots.length > 0 && (
                    <span style={{ fontSize: "10px", fontWeight: 600, color: T.greenDark, background: "#dcfce7", padding: "1px 6px", borderRadius: "4px" }}>
                      ✓ Assigned to you
                    </span>
                  )}
                </div>
                <select
                  value={form.periodInfo}
                  onChange={(e) => setForm({ ...form, periodInfo: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: `1px solid ${assignedSubjectSlots.length > 0 ? T.greenDark : T.border}`,
                    fontSize: "13px",
                    boxSizing: "border-box",
                    background: T.white,
                  }}
                >
                  {assignedSubjectSlots.length > 0 ? (
                    <>
                      <option value="">-- Select Assigned Period --</option>
                      {assignedSubjectSlots.map((s) => {
                        const val = `Period ${s.period} (${s.startTime || ""} - ${s.endTime || ""})`.replace(" - )", ")");
                        return (
                          <option key={s.id || s.period} value={val}>
                            {val} {s.room ? `• Room ${s.room}` : ""} [Assigned]
                          </option>
                        );
                      })}
                    </>
                  ) : (
                    <option value="">No period assigned for {form.subjectName} today</option>
                  )}
                  <option value="" disabled>──────────</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((p) => (
                    <option key={`p-${p}`} value={`Period ${p}`}>
                      Period {p} (Extra / Zero Period)
                    </option>
                  ))}
                </select>
                {assignedSubjectSlots.length === 0 ? (
                  <span style={{ display: "block", fontSize: "10.5px", color: T.slate, marginTop: "4px" }}>
                    ℹ You do not have an assigned timetable slot for this subject today.
                  </span>
                ) : (
                  <span style={{ display: "block", fontSize: "10.5px", color: T.greenDark, marginTop: "4px" }}>
                    Fetched from your official teaching schedule for today.
                  </span>
                )}
              </div>
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: T.navy, textTransform: "uppercase", marginBottom: "4px" }}>
                  Date Conducted *
                </label>
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: `1px solid ${T.border}`, fontSize: "13px", boxSizing: "border-box" }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: T.navy, textTransform: "uppercase", marginBottom: "4px" }}>
                Key Concepts &amp; Classroom Notes
              </label>
              <textarea
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Summary of formulas, concepts, or announcements discussed in class..."
                style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: `1px solid ${T.border}`, fontSize: "12px", fontFamily: "inherit", boxSizing: "border-box" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: T.navy, textTransform: "uppercase", marginBottom: "4px" }}>
                Homework / Daily Assignment
              </label>
              <textarea
                rows={2}
                value={form.homework}
                onChange={(e) => setForm({ ...form, homework: e.target.value })}
                placeholder="e.g. Practice Exercise 1.2 Q1 to Q10; submit by tomorrow morning."
                style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: `1px solid ${T.border}`, fontSize: "12px", fontFamily: "inherit", boxSizing: "border-box" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={{ fontSize: "11px", fontWeight: 700, color: T.navy, textTransform: "uppercase" }}>
                  Study Material &amp; Attachments
                </label>
                <div style={{ display: "flex", background: T.chip, padding: "2px", borderRadius: "6px", border: `1px solid ${T.border}` }}>
                  <button
                    type="button"
                    onClick={() => {
                      setAttachmentMode("file");
                      if (!selectedFile) setForm((f) => ({ ...f, resources: "" }));
                    }}
                    style={{
                      padding: "3px 10px",
                      borderRadius: "4px",
                      border: "none",
                      fontSize: "11px",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      background: attachmentMode === "file" ? T.white : "transparent",
                      color: attachmentMode === "file" ? T.navy : T.slate,
                      boxShadow: attachmentMode === "file" ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                    }}
                  >
                    <Paperclip size={12} /> Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAttachmentMode("url");
                      if (selectedFile) setForm((f) => ({ ...f, resources: "" }));
                    }}
                    style={{
                      padding: "3px 10px",
                      borderRadius: "4px",
                      border: "none",
                      fontSize: "11px",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      background: attachmentMode === "url" ? T.white : "transparent",
                      color: attachmentMode === "url" ? T.navy : T.slate,
                      boxShadow: attachmentMode === "url" ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                    }}
                  >
                    <LinkIcon size={12} /> Web Link
                  </button>
                </div>
              </div>

              {attachmentMode === "file" ? (
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg,.txt"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelected(file);
                    }}
                  />

                  {!selectedFile ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) handleFileSelected(file);
                      }}
                      style={{
                        border: `2px dashed ${isDragging ? T.blue : T.border}`,
                        background: isDragging ? "#f0f8ff" : "#fbfcfe",
                        borderRadius: "8px",
                        padding: "20px 16px",
                        textAlign: "center",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: T.chip, display: "flex", alignItems: "center", justifyContent: "center", color: T.navy }}>
                        <UploadCloud size={18} />
                      </div>
                      <div style={{ fontSize: "12.5px", fontWeight: 600, color: T.navy }}>
                        Click to browse or drag &amp; drop study material
                      </div>
                      <span style={{ fontSize: "11px", color: T.slate }}>
                        PDF, DOCX, PPTX, or image notes (up to 25 MB)
                      </span>
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 14px",
                        background: T.chip,
                        border: `1px solid ${T.line}`,
                        borderRadius: "8px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                        <div style={{ width: "32px", height: "32px", borderRadius: "6px", background: T.skyBg, color: T.skyDark, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <FileText size={16} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: "12px", fontWeight: 600, color: T.navy, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {selectedFile.name}
                          </div>
                          <span style={{ fontSize: "10.5px", color: T.slate }}>
                            {selectedFile.size} • Attached to lecture
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFile(null);
                          setForm((f) => ({ ...f, resources: "" }));
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          color: T.slate,
                          cursor: "pointer",
                          padding: "4px",
                        }}
                        title="Remove file"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <LinkIcon size={14} color={T.slate} style={{ position: "absolute", left: "10px" }} />
                    <input
                      type="url"
                      value={form.resources}
                      onChange={(e) => setForm({ ...form, resources: e.target.value })}
                      placeholder="https://drive.google.com/... or external resource URL"
                      style={{
                        width: "100%",
                        padding: "8px 12px 8px 32px",
                        borderRadius: "6px",
                        border: `1px solid ${T.border}`,
                        fontSize: "12px",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                  <span style={{ display: "block", fontSize: "10.5px", color: T.slate, marginTop: "4px" }}>
                    Paste any accessible link (Google Drive, YouTube, online notes, or syllabus docs).
                  </span>
                </div>
              )}
            </div>
          </div>

          <div style={{ padding: "14px 24px", borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "flex-end", gap: "10px", background: "#f8fafc", flexShrink: 0 }}>
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              style={{ padding: "8px 16px", borderRadius: "6px", border: `1px solid ${T.border}`, background: T.white, fontSize: "12px", fontWeight: 600, color: T.slate, cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{ padding: "8px 20px", borderRadius: "6px", border: "none", background: T.navy, fontSize: "12px", fontWeight: 600, color: "#ffffff", cursor: "pointer" }}
            >
              {saving ? "Publishing..." : "Publish Lecture to Students"}
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}

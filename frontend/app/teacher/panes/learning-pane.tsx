"use client";

import React, { useState, useEffect } from "react";
import {
  BookOpen,
  FileText,
  Video,
  Download,
  Plus,
  CheckCircle,
  Clock,
  Sparkles,
  X
} from "lucide-react";
import { getTeacherLearning, uploadTeacherStudyMaterial, getTeacherClasses } from "../../edops-api";

interface LearningPaneProps {
  organizationId: string;
  onRecordLesson?: () => void;
  onLogLesson?: () => void;
  onUploadMaterial?: () => void;
}

export function LearningPane({
  organizationId,
  onRecordLesson,
  onLogLesson,
  onUploadMaterial,
}: LearningPaneProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [classesList, setClassesList] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"plans" | "materials" | "reflections">("plans");
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [matTitle, setMatTitle] = useState("");
  const [matChapter, setMatChapter] = useState("Quadratic Equations");
  const [matTopic, setMatTopic] = useState("Roots & Discriminant");
  const [matSectionId, setMatSectionId] = useState("");
  const [matFileType, setMatFileType] = useState("pdf");
  const [matFileUrl, setMatFileUrl] = useState("https://cdn.edops.in/demo/quad-notes.pdf");
  const [savingMaterial, setSavingMaterial] = useState(false);

  useEffect(() => {
    loadLearning();
    loadClasses();
  }, [organizationId]);

  async function loadClasses() {
    try {
      const res = await getTeacherClasses(organizationId);
      const cls = res?.classes || [];
      setClassesList(cls);
      if (cls.length > 0) {
        setMatSectionId(cls[0].sectionId);
      }
    } catch {
      setClassesList([]);
    }
  }

  async function loadLearning() {
    setLoading(true);
    try {
      const res = await getTeacherLearning(organizationId);
      setData(res);
    } catch {
      setData({
        lessonPlans: [],
        studyMaterials: [],
        recentDeliveries: [],
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900  flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-600 " />
            Learning & Pedagogy Command Center
          </h2>
          <p className="text-xs text-gray-500  mt-0.5">
            Lesson planning, post-delivery reflections and subject study material repositories
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (onRecordLesson) onRecordLesson();
              else if (onLogLesson) onLogLesson();
            }}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition"
          >
            Mark Lesson Completed
          </button>
          <button
            onClick={() => {
              if (onUploadMaterial) onUploadMaterial();
              else setUploadModalOpen(true);
            }}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition"
          >
            + Upload Study Material
          </button>
        </div>
      </div>

      {/* Tab Pills */}
      <div className="flex border-b border-gray-200  gap-4 text-xs font-bold">
        {[
          { id: "plans", label: "Lesson Plans" },
          { id: "materials", label: "Study Materials Library" },
          { id: "reflections", label: "Class Delivery Reflections" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`py-2.5 border-b-2 transition ${
              activeTab === t.id
                ? "border-indigo-600 text-indigo-600 "
                : "border-transparent text-gray-500 hover:text-gray-900 :text-gray-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "plans" && (
        data?.lessonPlans?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.lessonPlans.map((lp: any) => (
              <div key={lp.id} className="p-5 bg-white  rounded-xl border border-gray-200  space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 ">
                      {lp.classSection} • {lp.subject}
                    </span>
                    <h3 className="text-base font-bold text-gray-900  mt-0.5">
                      {lp.title}
                    </h3>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    lp.status === "Ready"
                      ? "bg-emerald-100 text-emerald-800  "
                      : lp.status === "Conducted"
                      ? "bg-blue-100 text-blue-800  "
                      : "bg-gray-100 text-gray-700  "
                  }`}>
                    {lp.status}
                  </span>
                </div>

                <div className="p-3 bg-gray-50  rounded-xl space-y-1.5 text-xs text-gray-600 ">
                  <div><strong>Strategy:</strong> {lp.teachingStrategy}</div>
                  <div><strong>Homework:</strong> {lp.homework}</div>
                </div>

                <div className="pt-2 flex items-center justify-between text-xs text-gray-400">
                  <span>Date: {lp.date}</span>
                  <span className="font-semibold text-indigo-600 ">
                    {lp.learningOutcomes?.length} LOs Mapped
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-10 text-center bg-white rounded-xl border border-dashed border-gray-200 text-gray-400 text-xs">
            No lesson plans authored yet.
          </div>
        )
      )}

      {activeTab === "materials" && (
        data?.studyMaterials?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.studyMaterials.map((m: any) => (
              <div key={m.id} className="p-4 bg-white  rounded-xl border border-gray-200  space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-indigo-50  text-indigo-600">
                    {m.fileType}
                  </span>
                  <span className="text-[11px] text-gray-400">{m.createdAt}</span>
                </div>

                <div>
                  <h4 className="font-bold text-sm text-gray-900 ">{m.title}</h4>
                  <p className="text-xs text-gray-500 mt-1">{m.chapter} • {m.topic}</p>
                </div>

                <div className="pt-3 border-t border-gray-100  flex items-center justify-between text-xs">
                  <span className="text-gray-400">{m.classSection}</span>
                  <a
                    href={m.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-indigo-600 hover:underline flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" /> Open / Download
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-10 text-center bg-white rounded-xl border border-dashed border-gray-200 text-gray-400 text-xs">
            No study materials uploaded yet. Click "+ Upload Study Material" above to upload notes and documents.
          </div>
        )
      )}

      {activeTab === "reflections" && (
        data?.recentDeliveries?.length > 0 ? (
          <div className="space-y-3">
            {data.recentDeliveries.map((del: any) => (
              <div key={del.id} className="p-4 bg-white  rounded-xl border border-gray-200  space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900  text-sm">
                    {del.classSection} • Period {del.periodNumber} ({del.deliveryDate})
                  </span>
                  <span className="font-bold text-emerald-600 bg-emerald-50  px-2 py-0.5 rounded">
                    {del.participationPct}% Participation
                  </span>
                </div>
                <p className="text-gray-700 "><strong>Topics:</strong> {del.topicsCovered}</p>
                <div className="p-3 bg-gray-50  rounded-lg text-gray-600  italic">
                  "{del.reflection}"
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-10 text-center bg-white rounded-xl border border-dashed border-gray-200 text-gray-400 text-xs">
            No lesson delivery reflections recorded yet. Click "Mark Lesson Completed" to log period reflections.
          </div>
        )
      )}

      {/* Upload Study Material Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                  Pedagogy Repository
                </span>
                <h3 className="text-lg font-bold text-gray-900">Upload Study Material</h3>
              </div>
              <button onClick={() => setUploadModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!matTitle.trim()) return;
                setSavingMaterial(true);
                try {
                  await uploadTeacherStudyMaterial(organizationId, {
                    sectionId: matSectionId,
                    subjectId: "sub-math",
                    chapter: matChapter,
                    topic: matTopic,
                    title: matTitle,
                    fileType: matFileType,
                    fileUrl: matFileUrl,
                  });
                  setUploadModalOpen(false);
                  setMatTitle("");
                  loadLearning();
                } catch {
                  setUploadModalOpen(false);
                } finally {
                  setSavingMaterial(false);
                }
              }}
              className="space-y-3"
            >
              <div>
                <label className="font-bold text-gray-700 block mb-1">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Quadratic Equations Formula Sheet"
                  value={matTitle}
                  onChange={(e) => setMatTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Target Class</label>
                  <select
                    value={matSectionId}
                    onChange={(e) => setMatSectionId(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900"
                  >
                    {classesList.length > 0 ? (
                      classesList.map((c) => (
                        <option key={c.sectionId || c.className} value={c.sectionId || c.className}>
                          {c.className} ({c.subjectName})
                        </option>
                      ))
                    ) : (
                      <option value="">No classes available</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Resource Type</label>
                  <select
                    value={matFileType}
                    onChange={(e) => setMatFileType(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900"
                  >
                    <option value="pdf">PDF Document</option>
                    <option value="presentation">Presentation / PPT</option>
                    <option value="video">Lecture Video</option>
                    <option value="document">Doc / Notes</option>
                    <option value="link">Web Link</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Chapter</label>
                  <input
                    type="text"
                    value={matChapter}
                    onChange={(e) => setMatChapter(e.target.value)}
                    className="w-full px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Topic</label>
                  <input
                    type="text"
                    value={matTopic}
                    onChange={(e) => setMatTopic(e.target.value)}
                    className="w-full px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Resource URL / CDN Link</label>
                <input
                  type="text"
                  value={matFileUrl}
                  onChange={(e) => setMatFileUrl(e.target.value)}
                  className="w-full px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="px-3 py-1.5 font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingMaterial || !matTitle.trim()}
                  className="px-4 py-1.5 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg shadow-sm"
                >
                  {savingMaterial ? "Uploading..." : "Publish Material"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

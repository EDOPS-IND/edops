"use client";

import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  ArrowRight,
  ShieldAlert,
  Search,
  Check,
  User,
  BookOpen,
  Calendar
} from "lucide-react";
import { getPrincipalAlerts, resolvePrincipalAlert } from "../../edops-api";

interface AlertsPaneProps {
  organizationId: string;
  onNavigate?: (pane: string, subTab?: string) => void;
}

export function AlertsPane({ organizationId, onNavigate }: AlertsPaneProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [resolutionNote, setResolutionNote] = useState("");
  const [actionAssigned, setActionAssigned] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadAlerts();
  }, [organizationId]);

  async function loadAlerts() {
    setLoading(true);
    try {
      const res = await getPrincipalAlerts(organizationId);
      setData({...res, alerts:(res.alerts || []).map((a: any) => ({...a,resolved:a.status === "resolved"}))});
    } catch {
      setData({
        alerts: [],
        stats: {
          criticalCount: 0,
          warningCount: 0,
          infoCount: 0,
          resolvedThisWeek: 0
        }
      });
    } finally {

      setLoading(false);
    }
  }

  async function handleResolveAlert() {
    if (!selectedAlert) return;
    setSubmitting(true);
    try {
      await resolvePrincipalAlert(organizationId, selectedAlert.id, {
        status: "resolved",
        resolutionNotes: [resolutionNote, actionAssigned].filter(Boolean).join("\n")
      });
      // update state
      setData((prev: any) => ({
        ...prev,
        alerts: prev.alerts.map((a: any) =>
          a.id === selectedAlert.id ? { ...a, resolved: true, resolutionNote, actionAssigned } : a
        )
      }));
      setSelectedAlert(null);
      setResolutionNote("");
      setActionAssigned("");
    } catch {
      // Keep the alert open when the database write fails.
    } finally {
      setSubmitting(false);
    }
  }

  const filteredAlerts = (data?.alerts || []).filter((item: any) => {
    if (severityFilter !== "all" && item.severity !== severityFilter) return false;
    if (categoryFilter !== "all" && item.category !== categoryFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header & Metric Strip */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900  flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-red-600 " />
            Academic Alert Center
          </h2>
          <p className="text-sm text-gray-500  mt-0.5">
            Real-time proactive breach monitors across syllabus deadlines, attendance thresholds, and assessment dips
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadAlerts()}
            className="px-3 py-1.5 text-xs font-medium text-gray-700  bg-white  border border-gray-300  rounded-lg hover:bg-gray-50 :bg-gray-750 transition"
          >
            Refresh Alerts
          </button>
        </div>
      </div>

      {/* KPI Highlights */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-red-50  border border-red-200  rounded-xl">
          <div className="text-xs font-semibold uppercase tracking-wider text-red-600 ">
            Critical Action Req.
          </div>
          <div className="text-2xl font-black text-red-700  mt-1">
            {data?.stats?.criticalCount ?? 0}
          </div>
          <div className="text-xs text-red-600/80  mt-1">Immediate intervention needed</div>
        </div>

        <div className="p-4 bg-amber-50  border border-amber-200  rounded-xl">
          <div className="text-xs font-semibold uppercase tracking-wider text-amber-600 ">
            Warning Signals
          </div>
          <div className="text-2xl font-black text-amber-700  mt-1">
            {data?.stats?.warningCount ?? 0}
          </div>
          <div className="text-xs text-amber-600/80  mt-1">Monitor next assessment cycle</div>
        </div>

        <div className="p-4 bg-blue-50  border border-blue-200  rounded-xl">
          <div className="text-xs font-semibold uppercase tracking-wider text-blue-600 ">
            Informational Notices
          </div>
          <div className="text-2xl font-black text-blue-700  mt-1">
            {data?.stats?.infoCount ?? 0}
          </div>
          <div className="text-xs text-blue-600/80  mt-1">Milestones and logs</div>
        </div>

        <div className="p-4 bg-emerald-50  border border-emerald-200  rounded-xl">
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-600 ">
            Resolved This Week
          </div>
          <div className="text-2xl font-black text-emerald-700  mt-1">
            {data?.stats?.resolvedThisWeek ?? 0}
          </div>
          <div className="text-xs text-emerald-600/80  mt-1">Closed with corrective notes</div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white  rounded-xl border border-gray-200 ">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Severity:
          </span>
          {["all", "critical", "warning", "info"].map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-3 py-1 text-xs rounded-full font-medium capitalize transition ${
                severityFilter === sev
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-gray-100  text-gray-700  hover:bg-gray-200 :bg-gray-650"
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 uppercase">Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs bg-gray-50  border border-gray-300  rounded-lg px-2.5 py-1 text-gray-800 "
          >
            <option value="all">All Categories</option>
            <option value="curriculum_lag">Syllabus Lag</option>
            <option value="attendance_drop">Attendance Alert</option>
            <option value="assessment_drop">Assessment Drop</option>
            <option value="assignment_delay">Evaluation SLA Delay</option>
            <option value="compliance">Compliance</option>
          </select>
        </div>
      </div>

      {/* Alerts Feed */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-12 text-center text-gray-400">Loading academic alert radar...</div>
        ) : filteredAlerts.length === 0 ? (
          <div className="p-8 text-center bg-white  rounded-xl border border-gray-200 ">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-800 ">No active alerts matching filter</p>
            <p className="text-xs text-gray-500  mt-1">All academic streams are operating within acceptable thresholds.</p>
          </div>
        ) : (
          filteredAlerts.map((item: any) => (
            <div
              key={item.id}
              className={`p-4 rounded-xl border transition ${
                item.resolved
                  ? "bg-gray-50/70  border-gray-200  opacity-75"
                  : item.severity === "critical"
                  ? "bg-red-50/50  border-red-200 "
                  : item.severity === "warning"
                  ? "bg-amber-50/50  border-amber-200 "
                  : "bg-blue-50/40  border-blue-200 "
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        item.severity === "critical"
                          ? "bg-red-600 text-white"
                          : item.severity === "warning"
                          ? "bg-amber-500 text-white"
                          : "bg-blue-600 text-white"
                      }`}
                    >
                      {item.severity}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100  text-gray-700 ">
                      {item.classSection}
                    </span>
                    {item.subject && (
                      <span className="text-xs font-medium text-gray-600 ">
                        {item.subject}
                      </span>
                    )}
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {item.createdAt}
                    </span>
                    {item.resolved && (
                      <span className="text-xs font-bold text-emerald-600  flex items-center gap-1 bg-emerald-50  px-2 py-0.5 rounded-full">
                        <Check className="w-3 h-3" /> Resolved
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-gray-900 ">
                    {item.title}
                  </h3>
                  <p className="text-xs text-gray-700 ">
                    {item.details}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 text-xs">
                    <div className="bg-white/80  p-2 rounded-lg border border-gray-100 ">
                      <span className="font-semibold text-gray-600  block">Academic Impact:</span>
                      <span className="text-gray-800 ">{item.impact}</span>
                    </div>
                    <div className="bg-white/80  p-2 rounded-lg border border-gray-100 ">
                      <span className="font-semibold text-gray-600  block">Suggested Interventional Action:</span>
                      <span className="text-indigo-600  font-medium">{item.suggestedAction}</span>
                    </div>
                  </div>

                  {item.teacher && (
                    <div className="text-xs text-gray-500  pt-1 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-gray-400" />
                      Responsible Faculty: <span className="font-semibold text-gray-700 ">{item.teacher}</span>
                    </div>
                  )}

                  {item.resolutionNote && (
                    <div className="text-xs p-2.5 bg-emerald-50  border border-emerald-200  rounded-lg text-emerald-900  mt-2">
                      <span className="font-bold">Resolution Recorded:</span> {item.resolutionNote}
                      {item.actionAssigned && <div className="mt-0.5 font-medium">Action Assigned: {item.actionAssigned}</div>}
                    </div>
                  )}
                </div>

                {!item.resolved && (
                  <div className="flex flex-row lg:flex-col gap-2 shrink-0">
                    <button
                      onClick={() => setSelectedAlert(item)}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition"
                    >
                      Intervene & Resolve
                    </button>
                    {onNavigate && item.category === "curriculum_lag" && (
                      <button
                        onClick={() => onNavigate("academics", "curriculum")}
                        className="px-3 py-1.5 text-xs font-medium text-gray-700  bg-white  border border-gray-300  hover:bg-gray-50 :bg-gray-750 rounded-lg transition"
                      >
                        Inspect Curriculum
                      </button>
                    )}
                    {onNavigate && item.category === "attendance_drop" && (
                      <button
                        onClick={() => onNavigate("attendance", "low")}
                        className="px-3 py-1.5 text-xs font-medium text-gray-700  bg-white  border border-gray-300  hover:bg-gray-50 :bg-gray-750 rounded-lg transition"
                      >
                        Inspect Defaulters
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Resolve / Action Plan Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white  rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200  space-y-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-100 text-red-700  ">
                {selectedAlert.severity}
              </span>
              <h3 className="text-lg font-bold text-gray-900  mt-1">
                {selectedAlert.title}
              </h3>
              <p className="text-xs text-gray-500  mt-0.5">
                Target: {selectedAlert.classSection} • {selectedAlert.subject}
              </p>
            </div>

            <div className="p-3 bg-gray-50  rounded-xl text-xs space-y-1 text-gray-700 ">
              <p><strong>Impact:</strong> {selectedAlert.impact}</p>
              <p><strong>Suggested:</strong> {selectedAlert.suggestedAction}</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-700  block mb-1">
                  Assign Corrective Action
                </label>
                <input
                  type="text"
                  placeholder="e.g., Mandatory 3-session remedial batch with Dr. Sunita"
                  value={actionAssigned}
                  onChange={(e) => setActionAssigned(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white  border border-gray-300  rounded-lg text-gray-900  focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700  block mb-1">
                  Resolution Notes / Principal Directives
                </label>
                <textarea
                  rows={3}
                  placeholder="Document the corrective directive issued to the department head or class coordinator..."
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white  border border-gray-300  rounded-lg text-gray-900  focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedAlert(null)}
                className="px-4 py-2 text-xs font-medium text-gray-700  bg-gray-150  hover:bg-gray-200 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleResolveAlert}
                disabled={submitting || !resolutionNote}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg shadow-sm transition"
              >
                {submitting ? "Closing Alert..." : "Commit Action & Resolve"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

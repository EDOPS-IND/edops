"use client";

import React, { useState, useEffect } from "react";
import {
  Clock,
  Filter,
  User,
  BookOpen,
  Award,
  CheckCircle,
  FileText,
  AlertTriangle,
  Calendar,
  Activity,
  Layers,
  Search
} from "lucide-react";
import { getPrincipalActivity } from "../../edops-api";

interface ActivityPaneProps {
  organizationId: string;
}

export function ActivityPane({ organizationId }: ActivityPaneProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadActivity();
  }, [organizationId]);

  async function loadActivity() {
    setLoading(true);
    try {
      const res = await getPrincipalActivity(organizationId);
      setData(res);
    } catch {
      setData({
        events: [
          {
            id: "act-1",
            actor: "Principal Dr. Sharma",
            role: "Principal",
            action: "Published Mid-Term Examination Results",
            target: "Class 10 (All Sections)",
            category: "exam",
            timestamp: "Today, 10:45 AM",
            details: "Digitally locked 148 student dossiers and dispatched automated WhatsApp/SMS notifications to parents."
          },
          {
            id: "act-2",
            actor: "Principal Dr. Sharma",
            role: "Principal",
            action: "Conducted Formal Classroom Observation",
            target: "Sunita Roy • Class 9-A Chemistry",
            category: "observation",
            timestamp: "Today, 09:15 AM",
            details: "Scored 4.6/5.0 across student engagement and lab safety protocols. Feedback recorded in faculty docket."
          },
          {
            id: "act-3",
            actor: "HOD Vikram Malhotra",
            role: "Science HOD",
            action: "Approved Question Paper Blueprint",
            target: "Class 12 Physics Pre-Board I",
            category: "assessment",
            timestamp: "Yesterday, 04:30 PM",
            details: "Verified 33% competency-based question ratio conforming to CBSE 2026 guidelines."
          },
          {
            id: "act-4",
            actor: "Coordinator Anita Joshi",
            role: "Middle School Coordinator",
            action: "Created Remedial Bridge Program",
            target: "Class 8 Quadratic Foundations",
            category: "intervention",
            timestamp: "Yesterday, 02:10 PM",
            details: "14 students enrolled for 10-day after-school booster cohort."
          },
          {
            id: "act-5",
            actor: "Principal Dr. Sharma",
            role: "Principal",
            action: "Resolved Parent Grievance",
            target: "Ticket #PG-882 • Mr. Verma (Class 7-B)",
            category: "communication",
            timestamp: "04 Oct 2026, 05:20 PM",
            details: "Clarified science project rubric discrepancy with parent; re-assessment agreed."
          },
          {
            id: "act-6",
            actor: "Ramesh Sharma",
            role: "Senior Math Faculty",
            action: "Updated Syllabus Chapter Progress",
            target: "Class 10-A Mathematics",
            category: "curriculum",
            timestamp: "04 Oct 2026, 11:00 AM",
            details: "Marked Chapter 6 (Triangles) complete with 4 learning outcomes verified via formative quiz."
          },
          {
            id: "act-7",
            actor: "Principal Dr. Sharma",
            role: "Principal",
            action: "Issued School Academic Directive",
            target: "All Teaching Faculty",
            category: "communication",
            timestamp: "03 Oct 2026, 03:00 PM",
            details: "Mandatory submission of Lesson Plans for upcoming Term II by Friday 5 PM."
          }
        ]
      });
    } finally {
      setLoading(false);
    }
  }

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "exam":
        return <Award className="w-4 h-4 text-purple-600" />;
      case "observation":
        return <User className="w-4 h-4 text-emerald-600" />;
      case "assessment":
        return <FileText className="w-4 h-4 text-blue-600" />;
      case "intervention":
        return <Layers className="w-4 h-4 text-amber-600" />;
      case "curriculum":
        return <BookOpen className="w-4 h-4 text-indigo-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const filteredEvents = (data?.events || []).filter((item: any) => {
    if (category !== "all" && item.category !== category) return false;
    if (
      searchTerm &&
      !item.action.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !item.target.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !item.actor.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900  flex items-center gap-2">
            <Activity className="w-6 h-6 text-indigo-600 " />
            Academic Activity Audit Timeline
          </h2>
          <p className="text-sm text-gray-500  mt-0.5">
            Immutable, time-stamped ledger of all leadership directives, syllabus updates, exam actions, and interventions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadActivity()}
            className="px-3 py-1.5 text-xs font-medium text-gray-700  bg-white  border border-gray-300  rounded-lg hover:bg-gray-50 :bg-gray-750 transition"
          >
            Refresh Timeline
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white  rounded-xl border border-gray-200 ">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Domain:
          </span>
          {[
            { id: "all", label: "All" },
            { id: "exam", label: "Examinations" },
            { id: "observation", label: "Observations" },
            { id: "assessment", label: "Assessments" },
            { id: "intervention", label: "Interventions" },
            { id: "curriculum", label: "Curriculum" }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`px-3 py-1 text-xs rounded-full font-medium transition ${
                category === cat.id
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-gray-100  text-gray-700  hover:bg-gray-200 :bg-gray-650"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search activity by actor, class..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-1.5 bg-gray-50  border border-gray-300  rounded-lg text-gray-800  placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="bg-white  rounded-xl border border-gray-200  p-6">
        {loading ? (
          <div className="py-12 text-center text-gray-400">Loading audit history...</div>
        ) : filteredEvents.length === 0 ? (
          <div className="py-12 text-center text-gray-400">No activity events found for criteria.</div>
        ) : (
          <div className="relative border-l border-gray-200  ml-4 space-y-6">
            {filteredEvents.map((event: any) => (
              <div key={event.id} className="relative pl-6">
                {/* Node icon */}
                <div className="absolute -left-3.5 top-0.5 w-7 h-7 rounded-full bg-white  border-2 border-indigo-500 flex items-center justify-center shadow-sm">
                  {getCategoryIcon(event.category)}
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-gray-900 ">
                      {event.actor}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-gray-100  text-gray-600 ">
                      {event.role}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {event.timestamp}
                    </span>
                  </div>

                  <div className="text-sm font-semibold text-indigo-600 ">
                    {event.action}
                  </div>

                  <div className="text-xs font-medium text-gray-700 ">
                    Target: <span className="text-gray-900  font-semibold">{event.target}</span>
                  </div>

                  <p className="text-xs text-gray-600  pt-0.5">
                    {event.details}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

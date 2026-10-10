"use client";

import React, { useState, useEffect } from "react";
import { Search, X, User, GraduationCap, BookOpen, Layers, ArrowRight } from "lucide-react";
import { searchPrincipal } from "../../edops-api";

export function GlobalSearchModal({
  isOpen = false,
  organizationId,
  onClose,
  onSelectEntity,
  onSelectTeacher,
  onSelectStudent,
  onSelectClass,
}: {
  isOpen?: boolean;
  organizationId?: string;
  onClose: () => void;
  onSelectEntity?: (type: string, id: string, name: string) => void;
  onSelectTeacher?: (id: string) => void;
  onSelectStudent?: (id: string) => void;
  onSelectClass?: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    if (!query.trim() || query.length < 2) {
      setResults([
        { id: "stu-3", title: "Vikas Kumar", subtitle: "Grade 10-A · Roll 03 · At-Risk (Math)", category: "Students", type: "student" },
        { id: "tch-1", title: "Rahul Sharma", subtitle: "Mathematics HOD · 28 periods/week", category: "Teachers", type: "teacher" },
        { id: "sec-10a", title: "Grade 10-A", subtitle: "Section Average 78.5% · 42 Enrolled", category: "Classes", type: "class" },
        { id: "sub-1", title: "Mathematics", subtitle: "CBSE Standard & Basic · Code MATH", category: "Subjects", type: "subject" },
      ]);
      return;
    }

    const timer = setTimeout(async () => {
      setBusy(true);
      try {
        if (organizationId) {
          const res = await searchPrincipal(organizationId, query);
          setResults(res.results || []);
        }
      } catch {
        // Fallback filter
        const mockAll = [
          { id: "stu-3", title: "Vikas Kumar", subtitle: "Grade 10-A · Roll 03 · At-Risk (Math)", category: "Students", type: "student" },
          { id: "tch-1", title: "Rahul Sharma", subtitle: "Mathematics HOD · 28 periods/week", category: "Teachers", type: "teacher" },
          { id: "sec-10a", title: "Grade 10-A", subtitle: "Section Average 78.5% · 42 Enrolled", category: "Classes", type: "class" },
          { id: "sub-1", title: "Mathematics", subtitle: "CBSE Standard & Basic · Code MATH", category: "Subjects", type: "subject" },
        ];
        setResults(mockAll.filter((i) => i.title.toLowerCase().includes(query.toLowerCase())));
      } finally {
        setBusy(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, organizationId]);

  const getIcon = (type: string) => {
    switch (type) {
      case "student": return <GraduationCap size={16} color="#0D9488" />;
      case "teacher": return <User size={16} color="#2563EB" />;
      case "class": return <Layers size={16} color="#7C3AED" />;
      case "subject": return <BookOpen size={16} color="#D97706" />;
      default: return <Search size={16} color="#64748B" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 1000, paddingTop: "80px", paddingLeft: "16px", paddingRight: "16px" }}
    >
      <div
        className="modal-card"
        style={{
          background: "#FFFFFF",
          borderRadius: "14px",
          width: "100%",
          maxWidth: "620px",
          overflow: "hidden",
          boxShadow: "0 25px 50px rgba(0,0,0,0.25)",
        }}
      >
        {/* Search Input Box */}
        <div style={{ display: "flex", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid #E2E8F0", gap: "12px" }}>
          <Search size={20} color="#64748B" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search student, teacher, class, subject, exam or action plan..."
            style={{ width: "100%", border: "none", outline: "none", fontSize: "15px", color: "#1E293B" }}
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            style={{ background: "transparent", border: "none", cursor: "pointer", color: "#94A3B8" }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Results List */}
        <div style={{ maxHeight: "380px", overflowY: "auto", padding: "10px" }}>
          {busy ? (
            <div style={{ padding: "20px", textAlign: "center", color: "#64748B", fontSize: "13px" }}>Searching academic records...</div>
          ) : results.length === 0 ? (
            <div style={{ padding: "30px", textAlign: "center", color: "#94A3B8", fontSize: "13px" }}>No academic records matching "{query}".</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {results.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    onClose();
                    if (item.type === "teacher" && onSelectTeacher) onSelectTeacher(item.id);
                    else if (item.type === "student" && onSelectStudent) onSelectStudent(item.id);
                    else if (item.type === "class" && onSelectClass) onSelectClass(item.id);
                    if (onSelectEntity) onSelectEntity(item.type, item.id, item.title);
                  }}
                  style={{
                    padding: "10px 14px",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                    background: "#FFFFFF",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#F8FAFC")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#FFFFFF")}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {getIcon(item.type)}
                    </div>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: 600, color: "#1E293B" }}>{item.title}</div>
                      <div style={{ fontSize: "12px", color: "#64748B" }}>{item.subtitle}</div>
                    </div>
                  </div>
                  <ArrowRight size={14} color="#94A3B8" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Hint */}
        <div style={{ padding: "10px 16px", background: "#F8FAFC", borderTop: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#94A3B8" }}>
          <span>Search hints: e.g. "Vikas", "Mathematics", "Rahul", "Grade 10"</span>
          <span>ESC to close</span>
        </div>
      </div>
    </div>
  );
}

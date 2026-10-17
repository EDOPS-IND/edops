"use client";

import { FormEvent, useEffect, useState } from "react";
import { BookOpen, GraduationCap, Plus, Search, Users } from "lucide-react";
import { api, createResource, deleteResource, ListResult, updateResource } from "../edops-api";
import { ClassRoom, ExamEvaluation, Role, RosterStudent, Scorecard } from "./types";
import { Banner, Empty, FeatureCard, FormActions, Metric, Modal, percent, run } from "./shared";

export type SubjectScorecardData = {
  classroom: ClassRoom;
  scorecard: Scorecard | null;
  evaluations: ExamEvaluation[];
};

export function ProgressPane({
  org,
  role,
  classroom,
  classes = [],
}: {
  org: string;
  role: Role;
  classroom: ClassRoom;
  classes?: ClassRoom[];
}) {
  const [selectedKey, setSelectedKey] = useState<string>(
    classroom ? `${classroom.sectionId}:${classroom.subjectId}` : ""
  );

  useEffect(() => {
    if (classroom) {
      setSelectedKey(`${classroom.sectionId}:${classroom.subjectId}`);
    }
  }, [classroom?.sectionId, classroom?.subjectId]);
  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState<Scorecard[]>([]);
  const [evaluations, setEvaluations] = useState<ExamEvaluation[]>([]);
  const [subjectData, setSubjectData] = useState<SubjectScorecardData[]>([]);
  const [creatingEval, setCreatingEval] = useState(false);
  const [gradingEval, setGradingEval] = useState<ExamEvaluation | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const root = `/organizations/${org}/teaching`;

  const activeClass =
    classes.find((c) => `${c.sectionId}:${c.subjectId}` === selectedKey) ||
    (selectedKey && classroom && `${classroom.sectionId}:${classroom.subjectId}` === selectedKey ? classroom : null);

  async function loadTeacherData(targetClass: ClassRoom) {
    setLoading(true);
    try {
      const [scoresRes, evalsRes] = await Promise.all([
        api<ListResult<Scorecard>>(
          `${root}/scorecards?sectionId=${targetClass.sectionId}&subjectId=${targetClass.subjectId}&limit=100`
        ),
        api<ListResult<ExamEvaluation>>(
          `${root}/evaluations?sectionId=${targetClass.sectionId}&subjectId=${targetClass.subjectId}&limit=100`
        ),
      ]);
      setItems(scoresRes.items);
      setEvaluations(evalsRes.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load records");
    } finally {
      setLoading(false);
    }
  }

  async function deleteEval(id: string) {
    if (!activeClass) return;
    setDeletingId(id);
    await run(async () => {
      await deleteResource(`${root}/evaluations/${id}`);
      await loadTeacherData(activeClass);
    }, setError);
    setDeletingId(null);
  }

  useEffect(() => {
    let live = true;
    setLoading(true);

    if (role === "student") {
      const enrolled = classes.length > 0 ? classes : [classroom];
      const uniqueClasses = Array.from(
        new Map(enrolled.map((c) => [`${c.sectionId}:${c.subjectId}`, c])).values()
      );

      Promise.all(
        uniqueClasses.map(async (c) => {
          try {
            const [scoresRes, evalsRes] = await Promise.all([
              api<ListResult<Scorecard>>(
                `${root}/scorecards?sectionId=${c.sectionId}&subjectId=${c.subjectId}&limit=10`
              ),
              api<ListResult<ExamEvaluation>>(
                `${root}/evaluations?sectionId=${c.sectionId}&subjectId=${c.subjectId}&limit=100`
              ),
            ]);

            return {
              classroom: c,
              scorecard: scoresRes.items[0] || null,
              evaluations: evalsRes.items || [],
            };
          } catch (error) {
            throw error;
          }
        })
      )
        .then((res) => {
          if (live) {
            setSubjectData(res);
            setLoading(false);
          }
        })
        .catch((err) => {
          if (live) {
            setError(err.message);
            setLoading(false);
          }
        });
    } else {
      if (activeClass) {
        void loadTeacherData(activeClass);
      } else {
        setLoading(false);
      }
    }

    return () => {
      live = false;
    };
  }, [activeClass?.sectionId, activeClass?.subjectId, classes, org, role, selectedKey]);

  // Student Scorecard View
  if (role === "student") {
    return (
      <FeatureCard
        title="Scorecard"
        copy="Subject Details · Total Marks, Weightage and Percentages are subject to change throughout the semester. Final results will be visible upon official declaration of semester results."
      >
        {error && <Banner text={error} />}
        {loading && (
          <div style={{ padding: "30px", textAlign: "center", color: "var(--muted)" }}>
            Loading your enrolled subject scorecards…
          </div>
        )}
        {!loading && subjectData.length === 0 && (
          <Empty
            title="No scorecard available"
            copy="Your academic scores will appear once exam evaluations and attendance are registered."
          />
        )}
        {!loading && subjectData.length > 0 && (
          <div className="student-scorecard-container">
            {subjectData.map(({ classroom: c, scorecard, evaluations: evals }) => {
              const gradedEvals = evals.filter((e) => typeof e.myScore === "number");
              const totalObtained = gradedEvals.reduce((s, e) => s + (e.myScore ?? 0), 0);
              const totalMax = gradedEvals.reduce((s, e) => s + e.maxMarks, 0);
              const examPct =
                totalMax > 0
                  ? Math.round((totalObtained / totalMax) * 100)
                  : scorecard?.avgScore !== null && scorecard?.avgScore !== undefined
                  ? Math.round(scorecard.avgScore)
                  : null;
              const pctDisplay = examPct !== null ? `${examPct}%` : "—";
              const gpaDisplay = examPct !== null ? (examPct / 10).toFixed(2) : "—";

              return (
                <div key={`${c.sectionId}:${c.subjectId}`} className="scorecard-subject-card">
                  <header className="scorecard-subject-header">
                    <div className="scorecard-subject-title">
                      <h3>{c.subjectName}</h3>
                      <span>{c.sectionName}{c.programName ? ` · ${c.programName}` : ""}</span>
                    </div>
                    <div className="scorecard-subject-badges">
                      <span className="scorecard-stat-pill">
                        Percentage: <b>{pctDisplay}</b> &nbsp;|&nbsp; GPA: <b>{gpaDisplay}</b>
                      </span>
                    </div>
                  </header>

                  <div className="scorecard-table-wrapper">
                    <table className="scorecard-table">
                      <thead>
                        <tr>
                          <th>Component</th>
                          <th>Marks Obtained</th>
                          <th>Total Marks</th>
                          <th>Percentage (%)</th>
                          <th>Current Weightage</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {evals.map((item) => {
                          const marks = typeof item.myScore === "number" ? item.myScore : null;
                          const total = item.maxMarks;
                          const pctNum = marks !== null ? Math.round((marks / total) * 100) : null;
                          const pct = pctNum !== null ? `${pctNum}%` : "—";
                          const weightage = `${item.weightage}%`;
                          const status = marks !== null ? "Graded" : "Pending";
                          const statusClass = marks !== null ? "active" : "pending";

                          return (
                            <tr key={item.id}>
                              <td><b>{item.title}</b></td>
                              <td>{marks !== null ? marks : "—"}</td>
                              <td>{total}</td>
                              <td>
                                {pctNum !== null ? (
                                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span style={{ fontWeight: 600, minWidth: "36px" }}>{pct}</span>
                                    <div
                                      style={{
                                        flex: 1,
                                        maxWidth: "70px",
                                        height: "6px",
                                        background: "#e2e8f0",
                                        borderRadius: "3px",
                                        overflow: "hidden",
                                      }}
                                    >
                                      <div
                                        style={{
                                          width: `${Math.min(100, Math.max(0, pctNum))}%`,
                                          height: "100%",
                                          background: "var(--emerald)",
                                          borderRadius: "3px",
                                        }}
                                      />
                                    </div>
                                  </div>
                                ) : (
                                  "—"
                                )}
                              </td>
                              <td>{weightage}</td>
                              <td><span className={`status-chip ${statusClass}`}>{status}</span></td>
                            </tr>
                          );
                        })}

                        <tr>
                          <td><b>Practice Arena</b></td>
                          <td>
                            {scorecard?.arenaScore !== null && scorecard?.arenaScore !== undefined
                              ? `${Math.round(scorecard.arenaScore)} pts`
                              : "—"}
                          </td>
                          <td>100 pts</td>
                          <td>
                            {scorecard?.arenaScore !== null && scorecard?.arenaScore !== undefined ? (
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span style={{ fontWeight: 600, minWidth: "36px" }}>{Math.round(scorecard.arenaScore)}%</span>
                                <div
                                  style={{
                                    flex: 1,
                                    maxWidth: "70px",
                                    height: "6px",
                                    background: "#e2e8f0",
                                    borderRadius: "3px",
                                    overflow: "hidden",
                                  }}
                                >
                                  <div
                                    style={{
                                      width: `${Math.min(100, Math.max(0, Math.round(scorecard.arenaScore)))}%`,
                                      height: "100%",
                                      background:
                                        scorecard.arenaScore >= 75
                                          ? "#16a34a"
                                          : scorecard.arenaScore >= 50
                                          ? "#d97706"
                                          : "#dc2626",
                                      borderRadius: "3px",
                                    }}
                                  />
                                </div>
                              </div>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td>Practice</td>
                          <td>
                            <span className="status-chip present">
                              {scorecard?.arenaAttemptCount || 0} attempts
                            </span>
                          </td>
                        </tr>

                        {evals.length === 0 && (
                          <tr>
                            <td colSpan={6} style={{ textAlign: "center", color: "var(--muted)", padding: "14px" }}>
                              No official exam evaluations configured yet for this subject.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>

                    <div className="scorecard-table-subheading">Attendance Details</div>
                    <table className="scorecard-table">
                      <thead>
                        <tr>
                          <th>Component</th>
                          <th>Classes Attended</th>
                          <th>Total Classes</th>
                          <th>Attendance (%)</th>
                          <th>Cutoff (%)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td><b>Daily Class Attendance</b></td>
                          <td>{scorecard?.attendedCount ?? 0}</td>
                          <td>{scorecard?.attendanceCount ?? 0}</td>
                          <td>
                            {scorecard?.attendancePct !== null && scorecard?.attendancePct !== undefined
                              ? `${Math.round(scorecard.attendancePct)}%`
                              : scorecard?.attendanceCount === 0
                              ? "100%"
                              : "—"}
                          </td>
                          <td>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                              75%
                              {(scorecard?.attendancePct ?? 0) >= 75 ? (
                                <span className="status-chip active">Eligible</span>
                              ) : (
                                <span className="status-chip absent">Shortage</span>
                              )}
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </FeatureCard>
    );
  }

  // Teacher Filter Logic
  const query = searchQuery.trim().toLowerCase();
  const filteredItems = items.filter((item) => {
    if (!query) return true;
    const name = (item.studentName || "").toLowerCase();
    const roll = (item.rollNumber || "").toLowerCase();
    const email = (item.studentEmail || "").toLowerCase();
    return name.includes(query) || roll.includes(query) || email.includes(query);
  });

  return (
    <FeatureCard
      title="Exam Evaluations & Scorecard"
      copy={
        activeClass
          ? `Manage official exams, midterms, and student scorecard marks for ${activeClass.subjectName} (${activeClass.sectionName}).`
          : "Overview of your assigned classes and teaching responsibilities."
      }
      action={
        activeClass ? (
          <button className="primary-button" onClick={() => setCreatingEval(true)}>
            <Plus size={16} /> New exam component
          </button>
        ) : null
      }
    >
      {error && <Banner text={error} />}

      {/* When no class is selected: Show General Teacher Information Dashboard */}
      {!activeClass && (
        <div style={{ display: "grid", gap: "20px" }}>
          <div
            style={{
              padding: "24px",
              background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "16px" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "10px",
                  background: "var(--emerald)",
                  color: "var(--champagne)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <GraduationCap size={26} />
              </div>
              <div>
                <h3 style={{ margin: "0 0 2px 0", fontSize: "18px" }}>Teacher Teaching Desk</h3>
                <p style={{ margin: "0", fontSize: "13px", color: "var(--muted)" }}>
                  Select an assigned class from the dropdown above or click any class card below to view and grade student scorecards.
                </p>
              </div>
            </div>

            <div className="billing-metrics" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
              <Metric label="Assigned Classes" value={String(classes.length)} />
              <Metric
                label="Unique Subjects"
                value={String(new Set(classes.map((c) => c.subjectName)).size)}
              />
              <Metric
                label="Sections Taught"
                value={String(new Set(classes.map((c) => c.sectionName)).size)}
              />
            </div>
          </div>

          <h3 style={{ fontSize: "15px", margin: "10px 0 0 0", fontWeight: 700 }}>
            Your Assigned Classes ({classes.length})
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "14px" }}>
            {classes.map((c) => (
              <div
                key={`${c.sectionId}:${c.subjectId}`}
                style={{
                  padding: "18px",
                  background: "#fff",
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                    <BookOpen size={16} color="var(--emerald)" />
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--emerald)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {c.sectionName}
                    </span>
                  </div>
                  <h4 style={{ margin: "0 0 6px 0", fontSize: "16px", fontWeight: 700 }}>{c.subjectName}</h4>
                  <p style={{ margin: "0 0 16px 0", fontSize: "12px", color: "var(--muted)" }}>
                    Program: {c.programName || "General Curriculum"}
                  </p>
                </div>
                <button
                  className="secondary-button"
                  style={{ width: "100%", justifyContent: "center" }}
                  onClick={() => setSelectedKey(`${c.sectionId}:${c.subjectId}`)}
                >
                  Open Class Scorecards →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* When a specific class is selected: Show Official Exams & Filtered Student Scorecards */}
      {activeClass && (
        <>
          <div style={{ marginBottom: "20px" }}>
            <h3 style={{ fontSize: "14px", margin: "0 0 10px 0" }}>
              Official Evaluation Components ({evaluations.length})
            </h3>
            {evaluations.length === 0 ? (
              <div
                style={{
                  padding: "20px",
                  background: "#f8fafc",
                  borderRadius: "8px",
                  border: "1px dashed #cbd5e1",
                  textAlign: "center",
                }}
              >
                <p style={{ margin: "0 0 12px 0", color: "var(--muted)", fontSize: "13px" }}>
                  No official exam components created yet for this subject.
                </p>

              </div>
            ) : (
              <div style={{ display: "grid", gap: "10px" }}>
                {evaluations.map((item) => (
                  <article
                    key={item.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "14px 18px",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      background: "#fff",
                    }}
                  >
                    <div>
                      <h4 style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: 700 }}>
                        {item.title}
                      </h4>
                      <div style={{ display: "flex", gap: "14px", fontSize: "12px", color: "var(--muted)" }}>
                        <span>Max Marks: <b>{item.maxMarks}</b></span>
                        <span>Weightage: <b>{item.weightage}%</b></span>
                        <span>Graded: <b>{Object.keys(item.studentScores || {}).length}</b> students</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button className="primary-button" onClick={() => setGradingEval(item)}>
                        Enter / Update marks
                      </button>
                      <button className="secondary-button" onClick={() => deleteEval(item.id)} disabled={deletingId === item.id}>
                        {deletingId === item.id ? "Deleting…" : "Delete"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              margin: "28px 0 12px 0",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            <h3 style={{ fontSize: "14px", margin: 0 }}>
              Class Attendance & Student Scorecards ({filteredItems.length})
            </h3>
            <div style={{ position: "relative", minWidth: "260px" }}>
              <input
                type="search"
                placeholder="Search by name or roll no…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "7px 12px 7px 32px",
                  borderRadius: "6px",
                  border: "1px solid var(--border-subtle, #cbd5e1)",
                  fontSize: "13px",
                }}
              />
              <Search
                size={15}
                color="#94a3b8"
                style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }}
              />
            </div>
          </div>

          {filteredItems.length ? (
            <div className="scorecard-grid">
              {filteredItems.map((item) => (
                <article key={item.id} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
                    <div>
                      <h4 style={{ margin: "0 0 2px 0", fontSize: "15px", fontWeight: 700, color: "var(--text-emphasis, #0f172a)" }}>
                        {item.studentName || item.studentEmail?.split("@")[0] || "Student"}
                      </h4>
                      <span style={{ fontSize: "12px", color: "var(--muted, #64748b)" }}>
                        {item.studentEmail || item.studentId}
                      </span>
                    </div>
                    {item.rollNumber && (
                      <span
                        className="status-chip"
                        style={{ background: "#f1f5f9", color: "#334155", fontWeight: 700, fontSize: "11px" }}
                      >
                        Roll {item.rollNumber}
                      </span>
                    )}
                  </div>
                  <Metric label="Average score" value={percent(item.avgScore)} />
                  <Metric label="Completion" value={percent(item.completionPct)} />
                  <Metric label="Attendance" value={percent(item.attendancePct)} />
                  <Metric label="Arena best" value={percent(item.arenaScore)} />
                  <small style={{ marginTop: "4px", color: "var(--muted)" }}>
                    {item.submittedCount}/{item.assignmentCount} assignments ·{" "}
                    {item.arenaAttemptCount} Arena attempts
                  </small>
                </article>
              ))}
            </div>
          ) : (
            <Empty
              title={searchQuery ? "No matching students" : "No class scorecards yet"}
              copy={
                searchQuery
                  ? `No students found matching "${searchQuery}".`
                  : "Student scorecards will appear once attendance or work is recorded."
              }
            />
          )}

          {creatingEval && (
            <EvaluationCreateModal
              org={org}
              classroom={activeClass}
              onClose={() => {
                setCreatingEval(false);
                void loadTeacherData(activeClass);
              }}
            />
          )}
          {gradingEval && (
            <EvaluationGradeModal
              org={org}
              classroom={activeClass}
              evaluation={gradingEval}
              onClose={() => {
                setGradingEval(null);
                void loadTeacherData(activeClass);
              }}
            />
          )}
        </>
      )}
    </FeatureCard>
  );
}

function EvaluationCreateModal({
  org,
  classroom,
  onClose,
}: {
  org: string;
  classroom: ClassRoom;
  onClose: () => void;
}) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    await run(async () => {
      await createResource(`/organizations/${org}/teaching/evaluations`, {
        sectionId: classroom.sectionId,
        subjectId: classroom.subjectId,
        title: String(data.get("title")),
        maxMarks: Number(data.get("maxMarks") || 0),
        weightage: Number(data.get("weightage") || 0),
      });
      onClose();
    }, setError);
    setBusy(false);
  }
  return (
    <Modal title="New Exam / Evaluation Component" onClose={onClose}>
      <form className="product-form" onSubmit={submit}>
        {error && <Banner text={error} />}
        <label>
          Exam / Component Name
          <input
            name="title"
            required
            placeholder="e.g. Mid Semester Exam, Contest 1, Final Exam, Quiz 1"
            maxLength={120}
          />
        </label>
        <div className="form-grid">
          <label>
            Max Marks
            <input name="maxMarks" type="number" min="1" max="10000" defaultValue="100" required />
          </label>
          <label>
            Weightage (%)
            <input name="weightage" type="number" min="0" max="100" defaultValue="25" required />
          </label>
        </div>
        <FormActions onCancel={onClose} label="Add component" busy={busy} busyLabel="Adding component…" />
      </form>
    </Modal>
  );
}

function EvaluationGradeModal({
  org,
  classroom,
  evaluation,
  onClose,
}: {
  org: string;
  classroom: ClassRoom;
  evaluation: ExamEvaluation;
  onClose: () => void;
}) {
  const [students, setStudents] = useState<RosterStudent[]>([]);
  const [scores, setScores] = useState<Record<string, number>>(evaluation.studentScores || {});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let live = true;
    api<ListResult<RosterStudent>>(
      `/organizations/${org}/teaching/roster?sectionId=${classroom.sectionId}&subjectId=${classroom.subjectId}&limit=100`
    )
      .then((res) => live && setStudents(res.items))
      .catch((err) => live && setError(err.message));
    return () => {
      live = false;
    };
  }, [classroom.sectionId, classroom.subjectId, org]);

  async function save() {
    setBusy(true);
    await run(async () => {
      await updateResource(`/organizations/${org}/teaching/evaluations/${evaluation.id}/scores`, {
        scores,
      });
      onClose();
    }, setError);
    setBusy(false);
  }

  return (
    <Modal title={`Enter Marks: ${evaluation.title}`} onClose={onClose}>
      <div style={{ padding: "0 0 14px 0" }}>
        {error && <Banner text={error} />}
        <p style={{ margin: "0 0 14px 0", fontSize: "12px", color: "var(--muted)" }}>
          Max Marks: <b>{evaluation.maxMarks}</b> &nbsp;|&nbsp; Weightage: <b>{evaluation.weightage}%</b>
        </p>
        <div
          style={{
            maxHeight: "380px",
            overflowY: "auto",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
          }}
        >
          <table className="scorecard-table">
            <thead>
              <tr>
                <th>Roll Number</th>
                <th>Student Name</th>
                <th>Student Email</th>
                <th style={{ width: "130px" }}>Marks (0 - {evaluation.maxMarks})</th>
              </tr>
            </thead>
            <tbody>
              {students.map((st) => (
                <tr key={st.studentId}>
                  <td><b>{st.rollNumber}</b></td>
                  <td>{st.studentName || "—"}</td>
                  <td>{st.email}</td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      max={evaluation.maxMarks}
                      step="any"
                      placeholder="—"
                      value={scores[st.studentId] !== undefined ? scores[st.studentId] : ""}
                      onChange={(e) => {
                        const val = e.target.value === "" ? undefined : Number(e.target.value);
                        setScores((prev) => {
                          const next = { ...prev };
                          if (val === undefined || isNaN(val)) delete next[st.studentId];
                          else next[st.studentId] = val;
                          return next;
                        });
                      }}
                      style={{
                        width: "90px",
                        height: "32px",
                        padding: "4px 8px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                      }}
                    />
                  </td>
                </tr>
              ))}
              {students.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", color: "var(--muted)", padding: "16px" }}>
                    No enrolled students in this class section.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="modal-actions">
        <button type="button" className="secondary-button" onClick={onClose}>
          Cancel
        </button>
        <button className="primary-button" onClick={save} disabled={busy}>
          {busy ? "Saving…" : "Save marks"}
        </button>
      </div>
    </Modal>
  );
}

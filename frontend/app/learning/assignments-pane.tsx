"use client";

import { FormEvent, useEffect, useState } from "react";
import { FileText, Plus } from "lucide-react";
import { api, createResource, ListResult, updateResource } from "../edops-api";
import { Assignment, ClassRoom, Role, Submission } from "./types";
import { Banner, dateTime, Empty, FeatureCard, FormActions, Modal, run } from "./shared";

function getUrgency(dueAt: string) {
  const diffHours = (new Date(dueAt).getTime() - Date.now()) / 3_600_000;
  if (diffHours < 0) return { text: "Past due", style: { background: "#fee2e2", color: "#991b1b" } };
  if (diffHours <= 24) return { text: "Due today", style: { background: "#fef3c7", color: "#92400e" } };
  if (diffHours <= 48) return { text: "Due in 2 days", style: { background: "#fef9c3", color: "#854d0e" } };
  const days = Math.ceil(diffHours / 24);
  return { text: `Due in ${days} days`, style: { background: "#f1f5f9", color: "#475569" } };
}

export function AssignmentsPane({
  org,
  role,
  classroom,
}: {
  org: string;
  role: Role;
  classroom: ClassRoom;
}) {
  const [items, setItems] = useState<Assignment[]>([]);
  const [creating, setCreating] = useState(false);
  const [creatingBusy, setCreatingBusy] = useState(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Assignment | null>(null);
  const [error, setError] = useState("");
  const root = `/organizations/${org}/teaching`;

  async function load() {
    const result = await api<ListResult<Assignment>>(
      `${root}/assignments?sectionId=${classroom.sectionId}&subjectId=${classroom.subjectId}&limit=100`
    );
    setItems(result.items);
  }

  useEffect(() => {
    let live = true;
    api<ListResult<Assignment>>(
      `${root}/assignments?sectionId=${classroom.sectionId}&subjectId=${classroom.subjectId}&limit=100`
    )
      .then((result) => live && setItems(result.items))
      .catch((reason) => live && setError(reason.message));
    return () => {
      live = false;
    };
  }, [classroom.sectionId, classroom.subjectId, root]);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setCreatingBusy(true);
    await run(async () => {
      await createResource(`${root}/assignments`, {
        sectionId: classroom.sectionId,
        subjectId: classroom.subjectId,
        title: data.get("title"),
        description: data.get("description"),
        dueAt: new Date(String(data.get("dueAt"))).toISOString(),
        maxScore: Number(data.get("maxScore")),
      });
      setCreating(false);
      await load();
    }, setError);
    setCreatingBusy(false);
  }

  async function publish(id: string) {
    setPublishingId(id);
    await run(async () => {
      await createResource(`${root}/assignments/${id}/publish`, {});
      await load();
    }, setError);
    setPublishingId(null);
  }

  return (
    <FeatureCard
      title="Assignments"
      copy={
        role === "student"
          ? "Open published work, submit your answer, and review feedback."
          : "Create work, publish it to the captured class roster, and grade submissions."
      }
      action={
        role !== "student" ? (
          <button className="primary-button" onClick={() => setCreating(true)}>
            <Plus size={17} /> New assignment
          </button>
        ) : null
      }
    >
      {error && <Banner text={error} />}
      {items.length ? (
        <div className="product-list">
          {items.map((item) => {
            const urgency = getUrgency(item.dueAt);
            return (
              <article key={item.id}>
                <div className="list-symbol">
                  <FileText size={19} />
                </div>
                <div>
                  <span className={`status-chip ${item.status}`}>{item.status}</span>
                  {item.status === "published" && (
                    <span
                      className="status-chip"
                      style={{ marginLeft: "6px", fontWeight: 600, ...urgency.style }}
                    >
                      {urgency.text}
                    </span>
                  )}
                  <h3>{item.title}</h3>
                  <p>{item.description || "No instructions provided."}</p>
                  <small>Due {dateTime(item.dueAt)} · {item.maxScore} marks</small>
                </div>
                <div className="row-actions">
                  {role !== "student" && item.status === "draft" && (
                    <button onClick={() => publish(item.id)} disabled={publishingId === item.id}>
                      {publishingId === item.id ? "Publishing…" : "Publish"}
                    </button>
                  )}
                  <button onClick={() => setSelected(item)}>
                    {role === "student" ? "Open work" : "View submissions"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <Empty
          title="No assignments yet"
          copy={
            role === "student"
              ? "Published assignments will appear here."
              : "Create the first assignment for this class."
          }
          action={role !== "student" ? { label: "New assignment", onClick: () => setCreating(true) } : undefined}
        />
      )}
      {creating && (
        <Modal title="New assignment" onClose={() => setCreating(false)}>
          <form className="product-form" onSubmit={create}>
            <label>
              Title
              <input name="title" required maxLength={200} />
            </label>
            <label>
              Instructions
              <textarea name="description" rows={5} maxLength={8000} />
            </label>
            <div className="form-grid">
              <label>
                Due date and time
                <input name="dueAt" type="datetime-local" required />
              </label>
              <label>
                Maximum score
                <input
                  name="maxScore"
                  type="number"
                  min="0.01"
                  max="10000"
                  step="0.01"
                  required
                  defaultValue="100"
                />
              </label>
            </div>
            <FormActions
              onCancel={() => setCreating(false)}
              busy={creatingBusy}
              busyLabel="Creating…"
            />
          </form>
        </Modal>
      )}
      {selected && (
        <SubmissionModal
          org={org}
          role={role}
          assignment={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </FeatureCard>
  );
}

function SubmissionModal({
  org,
  role,
  assignment,
  onClose,
}: {
  org: string;
  role: Role;
  assignment: Assignment;
  onClose: () => void;
}) {
  const [items, setItems] = useState<Submission[]>([]);
  const [roster, setRoster] = useState<RosterStudent[]>([]);
  const [error, setError] = useState("");
  const [savedNotice, setSavedNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [gradingId, setGradingId] = useState<string | null>(null);
  const root = `/organizations/${org}/teaching`;

  async function load() {
    const result = await api<ListResult<Submission>>(
      `${root}/assignments/${assignment.id}/submissions?limit=100`
    );
    setItems(result.items);
  }

  useEffect(() => {
    let live = true;
    api<ListResult<Submission>>(
      `${root}/assignments/${assignment.id}/submissions?limit=100`
    )
      .then((result) => live && setItems(result.items))
      .catch((reason) => live && setError(reason.message));

    if (role !== "student") {
      api<ListResult<RosterStudent>>(
        `${root}/roster?sectionId=${assignment.sectionId}&subjectId=${assignment.subjectId}&limit=100`
      )
        .then((res) => live && setRoster(res.items))
        .catch(() => {});
    }

    return () => {
      live = false;
    };
  }, [assignment.id, assignment.sectionId, assignment.subjectId, role, root]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setSavedNotice("");
    await run(async () => {
      await createResource(`${root}/assignments/${assignment.id}/submissions`, {
        content: data.get("content"),
      });
      await load();
      setSavedNotice("Assignment submitted successfully!");
      setTimeout(() => setSavedNotice(""), 3500);
    }, setError);
    setBusy(false);
  }

  async function grade(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setGradingId(id);
    setSavedNotice("");
    await run(async () => {
      await updateResource(`${root}/submissions/${id}/grade`, {
        score: Number(data.get("score")),
        feedback: data.get("feedback"),
      });
      await load();
      setSavedNotice("Grade saved successfully.");
      setTimeout(() => setSavedNotice(""), 3000);
    }, setError);
    setGradingId(null);
  }

  return (
    <Modal title={assignment.title} onClose={onClose}>
      <p className="modal-copy">{assignment.description || "No additional instructions."}</p>
      {error && <Banner text={error} />}
      {savedNotice && <Banner text={savedNotice} variant="success" />}
      {role === "student" ? (
        <form className="product-form" onSubmit={submit}>
          <label>
            Your answer
            <textarea
              name="content"
              rows={9}
              required
              maxLength={8000}
              defaultValue={items[0]?.content ?? ""}
              disabled={items[0]?.status === "graded"}
            />
          </label>
          {items[0]?.status === "graded" && (
            <div className="grade-result">
              <b>{items[0].score} / {assignment.maxScore}</b>
              <p>{items[0].feedback || "No feedback provided."}</p>
            </div>
          )}
          <FormActions
            onCancel={onClose}
            label={savedNotice ? "Submitted ✓" : items[0]?.content ? "Update submission" : "Submit assignment"}
            busy={busy}
            busyLabel={items[0]?.content ? "Updating…" : "Submitting…"}
            disabled={items[0]?.status === "graded"}
          />
        </form>
      ) : items.length ? (
        <div className="grading-list">
          {items.map((item) => {
            const student = roster.find((r) => r.studentId === item.studentId);
            const studentLabel = student?.studentName || student?.email || item.studentId;

            return (
              <form key={item.id} onSubmit={(event) => grade(event, item.id)}>
                <div>
                  <b>{studentLabel}</b>
                  {student?.rollNumber && (
                    <small style={{ marginLeft: "8px", color: "var(--muted)" }}>
                      Roll {student.rollNumber}
                    </small>
                  )}
                  <span className={`status-chip ${item.status}`} style={{ marginLeft: "8px" }}>
                    {item.status}
                  </span>
                  <p>{item.content || "Not submitted"}</p>
                </div>
                {item.content && (
                  <div className="grade-fields">
                    <label>
                      Score
                      <input
                        name="score"
                        type="number"
                        min="0"
                        max={assignment.maxScore}
                        step="0.01"
                        required
                        defaultValue={item.score ?? ""}
                      />
                    </label>
                    <label>
                      Feedback
                      <input name="feedback" defaultValue={item.feedback ?? ""} maxLength={4000} />
                    </label>
                    <button className="primary-button" disabled={gradingId === item.id}>
                      {gradingId === item.id ? "Saving…" : "Save grade"}
                    </button>
                  </div>
                )}
              </form>
            );
          })}
        </div>
      ) : (
        <Empty title="No submissions" copy="Student submissions will appear after publication." />
      )}
    </Modal>
  );
}

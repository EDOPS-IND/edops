"use client";

import { FormEvent, useEffect, useState } from "react";
import { FileText, Plus } from "lucide-react";
import { api, createResource, ListResult, updateResource } from "../edops-api";
import { Assignment, ClassRoom, Role, Submission } from "./types";
import { Banner, dateTime, Empty, FeatureCard, FormActions, Modal, run } from "./shared";

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
  }

  async function publish(id: string) {
    await run(async () => {
      await createResource(`${root}/assignments/${id}/publish`, {});
      await load();
    }, setError);
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
          {items.map((item) => (
            <article key={item.id}>
              <div className="list-symbol">
                <FileText size={19} />
              </div>
              <div>
                <span className={`status-chip ${item.status}`}>{item.status}</span>
                <h3>{item.title}</h3>
                <p>{item.description || "No instructions provided."}</p>
                <small>Due {dateTime(item.dueAt)} · {item.maxScore} marks</small>
              </div>
              <div className="row-actions">
                {role !== "student" && item.status === "draft" && (
                  <button onClick={() => publish(item.id)}>Publish</button>
                )}
                <button onClick={() => setSelected(item)}>
                  {role === "student" ? "Open work" : "View submissions"}
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <Empty
          title="No assignments yet"
          copy={
            role === "student"
              ? "Published assignments will appear here."
              : "Create the first assignment for this class."
          }
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
            <FormActions onCancel={() => setCreating(false)} />
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
  const [error, setError] = useState("");
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
    return () => {
      live = false;
    };
  }, [assignment.id, root]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await run(async () => {
      await createResource(`${root}/assignments/${assignment.id}/submissions`, {
        content: data.get("content"),
      });
      await load();
    }, setError);
  }

  async function grade(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await run(async () => {
      await updateResource(`${root}/submissions/${id}/grade`, {
        score: Number(data.get("score")),
        feedback: data.get("feedback"),
      });
      await load();
    }, setError);
  }

  return (
    <Modal title={assignment.title} onClose={onClose}>
      <p className="modal-copy">{assignment.description || "No additional instructions."}</p>
      {error && <Banner text={error} />}
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
            label={items[0]?.content ? "Update submission" : "Submit assignment"}
            disabled={items[0]?.status === "graded"}
          />
        </form>
      ) : items.length ? (
        <div className="grading-list">
          {items.map((item) => (
            <form key={item.id} onSubmit={(event) => grade(event, item.id)}>
              <div>
                <b>{item.studentId}</b>
                <span className={`status-chip ${item.status}`}>{item.status}</span>
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
                  <button className="primary-button">Save grade</button>
                </div>
              )}
            </form>
          ))}
        </div>
      ) : (
        <Empty title="No submissions" copy="Student submissions will appear after publication." />
      )}
    </Modal>
  );
}

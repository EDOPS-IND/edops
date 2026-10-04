"use client";

import { FormEvent, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { api, createResource, ListResult, updateResource } from "../edops-api";
import { ArenaAttempt, ArenaQuestion, ClassRoom, Role } from "./types";
import { Banner, Empty, FeatureCard, FormActions, Modal, run } from "./shared";

export function ArenaPane({
  org,
  role,
  classroom,
}: {
  org: string;
  role: Role;
  classroom: ClassRoom;
}) {
  const [items, setItems] = useState<ArenaQuestion[]>([]);
  const [creating, setCreating] = useState(false);
  const [attemptingId, setAttemptingId] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<Record<string, ArenaAttempt[]>>({});
  const [error, setError] = useState("");
  const [chapterFilter, setChapterFilter] = useState("");
  const [topicFilter, setTopicFilter] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const root = `/organizations/${org}/arena`;

  async function load() {
    const result = await api<ListResult<ArenaQuestion>>(
      `${root}/questions?sectionId=${classroom.sectionId}&subjectId=${classroom.subjectId}&limit=100`
    );
    setItems(result.items);
  }

  useEffect(() => {
    let live = true;
    api<ListResult<ArenaQuestion>>(
      `${root}/questions?sectionId=${classroom.sectionId}&subjectId=${classroom.subjectId}&limit=100`
    )
      .then((result) => live && setItems(result.items))
      .catch((reason) => live && setError(reason.message));
    return () => {
      live = false;
    };
  }, [classroom.sectionId, classroom.subjectId, root]);

  async function transition(id: string, action: "publish" | "archive") {
    await run(async () => {
      if (action === "publish") await createResource(`${root}/questions/${id}/publish`, {});
      else await updateResource(`${root}/questions/${id}/archive`, {});
      await load();
    }, setError);
  }

  async function attempt(event: FormEvent<HTMLFormElement>, question: ArenaQuestion) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const selected =
      question.questionType === "subjective" ? ["model_answer"] : data.getAll("answer").map(String);
    setAttemptingId(question.id);
    await run(async () => {
      await createResource(`${root}/questions/${question.id}/attempts`, {
        selectedOptionIds: selected,
      });
      const history = await api<ListResult<ArenaAttempt>>(
        `${root}/questions/${question.id}/attempts?limit=100`
      );
      setAttempts((current) => ({ ...current, [question.id]: history.items }));
    }, setError);
    setAttemptingId(null);
  }

  const availableChapters = Array.from(new Set(items.map((i) => i.chapter).filter(Boolean)));
  const availableTopics = Array.from(
    new Set(
      items
        .filter((i) => !chapterFilter || i.chapter === chapterFilter)
        .map((i) => i.topic)
        .filter(Boolean)
    )
  );

  const filteredItems = items.filter((item) => {
    if (chapterFilter && item.chapter !== chapterFilter) return false;
    if (topicFilter && item.topic !== topicFilter) return false;
    if (difficultyFilter && item.difficulty !== difficultyFilter) return false;
    return true;
  });

  return (
    <FeatureCard
      title="Arena practice"
      copy={
        role === "student"
          ? "Practice published questions and improve your best score."
          : "Build objective practice questions and publish them to enrolled students."
      }
      action={
        role !== "student" ? (
          <button className="primary-button" onClick={() => setCreating(true)}>
            <Plus size={17} /> New Arena question
          </button>
        ) : null
      }
    >
      {error && <Banner text={error} />}

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "10px",
          alignItems: "center",
          marginBottom: "16px",
          padding: "10px 14px",
          background: "var(--surface-sunken, #f8fafc)",
          borderRadius: "8px",
          border: "1px solid var(--border-subtle, #e2e8f0)",
        }}
      >
        <span
          style={{
            fontSize: "0.85em",
            fontWeight: 600,
            color: "var(--text-subtle, #64748b)",
          }}
        >
          Class: {classroom.programName || classroom.sectionName} · {classroom.subjectName}
        </span>
        <select
          style={{ marginLeft: "auto", fontSize: "0.85em", padding: "4px 8px" }}
          value={chapterFilter}
          onChange={(e) => {
            setChapterFilter(e.target.value);
            setTopicFilter("");
          }}
        >
          <option value="">All chapters</option>
          {availableChapters.map((ch) => (
            <option key={ch} value={ch}>
              {ch}
            </option>
          ))}
        </select>
        <select
          style={{ fontSize: "0.85em", padding: "4px 8px" }}
          value={topicFilter}
          onChange={(e) => setTopicFilter(e.target.value)}
        >
          <option value="">All topics</option>
          {availableTopics.map((tp) => (
            <option key={tp} value={tp}>
              {tp}
            </option>
          ))}
        </select>
        <select
          style={{ fontSize: "0.85em", padding: "4px 8px" }}
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value)}
        >
          <option value="">All difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      {filteredItems.length ? (
        <div className="question-list">
          {filteredItems.map((item) => (
            <article key={item.id}>
              <div className="question-meta">
                <span className={`status-chip ${item.status}`}>{item.status}</span>
                <span>{item.difficulty}</span>
                {item.chapter && <span style={{ fontWeight: 500 }}>{item.chapter}</span>}
                <span>{item.topic}</span>
                <span
                  style={{
                    textTransform: "uppercase",
                    fontSize: "0.75em",
                    letterSpacing: "0.05em",
                    opacity: 0.8,
                  }}
                >
                  {item.questionType === "subjective" ? "Subjective" : "MCQ"}
                </span>
              </div>
              <h3>{item.content.prompt}</h3>
              {role === "student" ? (
                <form onSubmit={(event) => attempt(event, item)}>
                  {item.questionType === "subjective" ? (
                    <div style={{ marginBottom: "12px" }}>
                      <textarea
                        name="written_answer"
                        rows={3}
                        placeholder="Write your explanation or working here..."
                        style={{
                          width: "100%",
                          padding: "8px",
                          borderRadius: "6px",
                          border: "1px solid var(--border-subtle, #cbd5e1)",
                        }}
                      />
                    </div>
                  ) : (
                    <div className="answer-options">
                      {(item.content.options || []).map((option) => (
                        <label key={option.id}>
                          <input
                            name="answer"
                            type={item.questionType === "single_choice" ? "radio" : "checkbox"}
                            value={option.id}
                            required={item.questionType === "single_choice"}
                          />
                          {option.text}
                        </label>
                      ))}
                    </div>
                  )}
                  <button className="primary-button" disabled={attemptingId === item.id}>
                    {attemptingId === item.id ? "Checking…" : "Check answer"}
                  </button>
                  {attempts[item.id]?.[0] &&
                    (item.questionType === "subjective" ? (
                      <div
                        style={{
                          marginTop: "12px",
                          padding: "12px",
                          background: "var(--surface-sunken, #f8f9fa)",
                          borderRadius: "8px",
                          border: "1px solid var(--border-subtle, #e2e8f0)",
                        }}
                      >
                        <strong
                          className="correct-answer"
                          style={{ display: "block", marginBottom: "8px" }}
                        >
                          Completed · Self-assessment & Model answer
                        </strong>
                        <div style={{ fontSize: "0.9em", marginBottom: "6px" }}>
                          <b>Model Answer / Solution:</b>
                        </div>
                        <p
                          style={{
                            margin: "0 0 8px 0",
                            fontSize: "0.9em",
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          {item.content.modelAnswer || "Model answer registered by instructor."}
                        </p>
                        {item.content.rubric && (
                          <>
                            <div
                              style={{
                                fontSize: "0.85em",
                                color: "var(--text-subtle, #475569)",
                                marginBottom: "4px",
                              }}
                            >
                              <b>Scoring Rubric:</b>
                            </div>
                            <p
                              style={{
                                margin: "0",
                                fontSize: "0.85em",
                                whiteSpace: "pre-wrap",
                                color: "var(--text-subtle, #475569)",
                              }}
                            >
                              {item.content.rubric}
                            </p>
                          </>
                        )}
                      </div>
                    ) : (
                      <strong
                        className={
                          attempts[item.id][0].isCorrect ? "correct-answer" : "wrong-answer"
                        }
                      >
                        {attempts[item.id][0].isCorrect ? "Correct" : "Try again"} ·{" "}
                        {attempts[item.id][0].score}/{attempts[item.id][0].maxScore}
                      </strong>
                    ))}
                </form>
              ) : (
                <div className="row-actions">
                  {item.status === "draft" && (
                    <button onClick={() => transition(item.id, "publish")}>Publish</button>
                  )}
                  {item.status !== "archived" && (
                    <button onClick={() => transition(item.id, "archive")}>Archive</button>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      ) : (
        <Empty
          title="No Arena questions"
          copy={
            role === "student"
              ? "Published practice will appear here."
              : "Create the first practice question."
          }
          action={role !== "student" ? { label: "New Arena question", onClick: () => setCreating(true) } : undefined}
        />
      )}
      {creating && (
        <QuestionForm
          org={org}
          classroom={classroom}
          onClose={() => {
            setCreating(false);
            void load();
          }}
        />
      )}
    </FeatureCard>
  );
}

function QuestionForm({
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
  const [qType, setQType] = useState<"single_choice" | "subjective">("single_choice");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const chapter = String(data.get("chapter") || "").trim();
    const topic = String(data.get("topic") || "").trim();
    const prompt = String(data.get("prompt") || "");
    const difficulty = String(data.get("difficulty") || "easy");
    const maxScore = Number(data.get("maxScore") || 1);
    const tags = String(data.get("tags") || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    let content: any = { prompt };
    let answerKey: string[] = [];

    if (qType === "subjective") {
      content.modelAnswer = String(data.get("modelAnswer") || "").trim();
      content.rubric = String(data.get("rubric") || "").trim();
      answerKey = ["model_answer"];
    } else {
      const options = ["a", "b", "c", "d"]
        .map((id) => ({ id, text: String(data.get(`option-${id}`) || "").trim() }))
        .filter((item) => item.text);
      content.options = options;
      answerKey = [String(data.get("answer") || "a")];
    }

    setBusy(true);
    await run(async () => {
      await createResource(`/organizations/${org}/arena/questions`, {
        sectionId: classroom.sectionId,
        subjectId: classroom.subjectId,
        programId: classroom.programId || undefined,
        chapter,
        topic,
        difficulty,
        questionType: qType,
        content,
        answerKey,
        tags,
        maxScore,
      });
      onClose();
    }, setError);
    setBusy(false);
  }

  return (
    <Modal title="New Arena question" onClose={onClose}>
      <form className="product-form" onSubmit={submit}>
        {error && <Banner text={error} />}
        <div
          style={{
            padding: "8px 12px",
            background: "var(--surface-sunken, #f1f5f9)",
            borderRadius: "6px",
            fontSize: "0.85em",
            marginBottom: "8px",
          }}
        >
          <b>Class:</b> {classroom.programName || classroom.sectionName} &nbsp;|&nbsp;{" "}
          <b>Subject:</b> {classroom.subjectName}
        </div>
        <div className="form-grid">
          <label>
            Question type
            <select value={qType} onChange={(e) => setQType(e.target.value as any)}>
              <option value="single_choice">Multiple Choice (MCQ)</option>
              <option value="subjective">Subjective (Model answer / Rubric)</option>
            </select>
          </label>
          <label>
            Difficulty
            <select name="difficulty">
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </label>
        </div>
        <div className="form-grid">
          <label>
            Chapter
            <input
              name="chapter"
              placeholder="e.g. Chapter 1: Calculus"
              required
              maxLength={100}
            />
          </label>
          <label>
            Topic
            <input
              name="topic"
              placeholder="e.g. Derivatives"
              required
              maxLength={100}
            />
          </label>
        </div>
        <label>
          Question prompt
          <textarea name="prompt" rows={3} required maxLength={4000} />
        </label>
        {qType === "subjective" ? (
          <>
            <label>
              Model Answer / Solution
              <textarea
                name="modelAnswer"
                rows={3}
                placeholder="Provide expected answer or detailed solution steps..."
                required
                maxLength={4000}
              />
            </label>
            <label>
              Grading Rubric (optional)
              <textarea
                name="rubric"
                rows={2}
                placeholder="Key points or criteria for self-assessment..."
                maxLength={2000}
              />
            </label>
          </>
        ) : (
          <>
            {["a", "b", "c", "d"].map((id, index) => (
              <label key={id}>
                Option {index + 1}
                <input name={`option-${id}`} required={index < 2} maxLength={500} />
              </label>
            ))}
            <div className="form-grid">
              <label>
                Correct option
                <select name="answer">
                  <option value="a">Option 1</option>
                  <option value="b">Option 2</option>
                  <option value="c">Option 3</option>
                  <option value="d">Option 4</option>
                </select>
              </label>
              <label>
                Score
                <input
                  name="maxScore"
                  type="number"
                  min="1"
                  max="100"
                  defaultValue="1"
                  required
                />
              </label>
            </div>
          </>
        )}
        {qType === "subjective" && (
          <label>
            Score
            <input
              name="maxScore"
              type="number"
              min="1"
              max="100"
              defaultValue="5"
              required
            />
          </label>
        )}
        <label>
          Tags, separated by commas
          <input name="tags" placeholder="e.g. calculus, exam-prep" />
        </label>
        <FormActions onCancel={onClose} busy={busy} busyLabel="Creating…" />
      </form>
    </Modal>
  );
}

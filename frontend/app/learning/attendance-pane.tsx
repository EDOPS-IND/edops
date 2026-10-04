"use client";

import { FormEvent, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { api, createResource, ListResult, updateResource } from "../edops-api";
import { AttendanceRecord, AttendanceSession, ClassRoom, Role, RosterStudent } from "./types";
import { Banner, dateOnly, Empty, FeatureCard, FormActions, Modal, run } from "./shared";

export function AttendancePane({
  org,
  role,
  classroom,
}: {
  org: string;
  role: Role;
  classroom: ClassRoom;
}) {
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [selected, setSelected] = useState<AttendanceSession | null>(null);
  const [creating, setCreating] = useState(false);
  const [creatingBusy, setCreatingBusy] = useState(false);
  const [error, setError] = useState("");
  const root = `/organizations/${org}/teaching`;

  async function load() {
    const result = await api<ListResult<AttendanceSession>>(
      `${root}/attendance-sessions?sectionId=${classroom.sectionId}&subjectId=${classroom.subjectId}&limit=100`
    );
    setSessions(result.items);
  }

  useEffect(() => {
    let live = true;
    api<ListResult<AttendanceSession>>(
      `${root}/attendance-sessions?sectionId=${classroom.sectionId}&subjectId=${classroom.subjectId}&limit=100`
    )
      .then((result) => live && setSessions(result.items))
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
      await createResource(`${root}/attendance-sessions`, {
        sectionId: classroom.sectionId,
        subjectId: classroom.subjectId,
        date: data.get("date"),
        period: Number(data.get("period")),
      });
      setCreating(false);
      await load();
    }, setError);
    setCreatingBusy(false);
  }

  return (
    <FeatureCard
      title="Attendance"
      copy={
        role === "student"
          ? "Review your finalized attendance records."
          : "Open a class register, mark every student, and finalize it."
      }
      action={
        role !== "student" ? (
          <button className="primary-button" onClick={() => setCreating(true)}>
            <Plus size={17} /> Take attendance
          </button>
        ) : null
      }
    >
      {error && <Banner text={error} />}
      {sessions.length ? (
        <div className="compact-grid">
          {sessions.map((item) => (
            <button
              key={item.id}
              className="session-card"
              onClick={() => setSelected(item)}
            >
              <span className={`status-chip ${item.status}`}>{item.status}</span>
              <b>{dateOnly(item.date)}</b>
              <small>Period {item.period}</small>
            </button>
          ))}
        </div>
      ) : (
        <Empty
          title="No attendance records"
          copy="Attendance sessions for this class will appear here."
          action={role !== "student" ? { label: "Take attendance", onClick: () => setCreating(true) } : undefined}
        />
      )}
      {creating && (
        <Modal title="Take attendance" onClose={() => setCreating(false)}>
          <form className="product-form" onSubmit={create}>
            <label>
              Date
              <input
                name="date"
                type="date"
                required
                max={new Date().toISOString().slice(0, 10)}
              />
            </label>
            <label>
              Period
              <input
                name="period"
                type="number"
                min="1"
                max="20"
                required
                defaultValue="1"
              />
            </label>
            <FormActions
              onCancel={() => setCreating(false)}
              label="Open register"
              busy={creatingBusy}
              busyLabel="Opening register…"
            />
          </form>
        </Modal>
      )}
      {selected && (
        <AttendanceRegister
          org={org}
          role={role}
          classroom={classroom}
          session={selected}
          onClose={() => {
            setSelected(null);
            void load();
          }}
        />
      )}
    </FeatureCard>
  );
}

function AttendanceRegister({
  org,
  role,
  classroom,
  session,
  onClose,
}: {
  org: string;
  role: Role;
  classroom: ClassRoom;
  session: AttendanceSession;
  onClose: () => void;
}) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [roster, setRoster] = useState<RosterStudent[]>([]);
  const [error, setError] = useState("");
  const [savedNotice, setSavedNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const root = `/organizations/${org}/teaching`;

  async function load() {
    const result = await api<ListResult<AttendanceRecord>>(
      `${root}/attendance-sessions/${session.id}/records?limit=100`
    );
    setRecords(result.items);
  }

  useEffect(() => {
    let live = true;
    Promise.all([
      api<ListResult<AttendanceRecord>>(
        `${root}/attendance-sessions/${session.id}/records?limit=100`
      ),
      role === "student"
        ? Promise.resolve({ items: [] as RosterStudent[] })
        : api<ListResult<RosterStudent>>(
            `${root}/roster?sectionId=${classroom.sectionId}&subjectId=${classroom.subjectId}&limit=100`
          ),
    ])
      .then(([marks, people]) => {
        if (live) {
          setRecords(marks.items);
          setRoster(people.items);
        }
      })
      .catch((reason) => live && setError(reason.message));
    return () => {
      live = false;
    };
  }, [classroom.sectionId, classroom.subjectId, role, root, session.id]);

  async function save() {
    setBusy(true);
    setSavedNotice("");
    await run(async () => {
      await updateResource(
        `${root}/attendance-sessions/${session.id}/records`,
        {
          records: records.map((item) => ({
            studentId: item.studentId,
            status: item.status,
          })),
        }
      );
      await load();
      setSavedNotice("Attendance marks saved successfully.");
      setTimeout(() => setSavedNotice(""), 3500);
    }, setError);
    setBusy(false);
  }

  async function finalize() {
    setBusy(true);
    await run(async () => {
      await createResource(
        `${root}/attendance-sessions/${session.id}/finalize`,
        {}
      );
      onClose();
    }, setError);
    setBusy(false);
  }

  return (
    <Modal title={`${dateOnly(session.date)} · Period ${session.period}`} onClose={onClose}>
      {error && <Banner text={error} />}
      {savedNotice && <Banner text={savedNotice} variant="success" />}
      {records.length ? (
        <div className="attendance-list">
          {records.map((item) => {
            const student = roster.find((person) => person.studentId === item.studentId);
            const displayName =
              student?.studentName ||
              student?.email ||
              (role === "student" ? "My attendance" : item.studentId);
            const secondaryText = student?.rollNumber
              ? `Roll ${student.rollNumber}${student.email ? ` · ${student.email}` : ""}`
              : (student?.email || item.studentId);

            return (
              <label key={item.id}>
                <span>
                  <b>{displayName}</b>
                  <small>{secondaryText}</small>
                </span>
                {role === "student" || session.status === "finalized" ? (
                  <strong className={`status-chip ${item.status}`}>
                    {item.status ?? "unmarked"}
                  </strong>
                ) : (
                  <select
                    value={item.status ?? ""}
                    onChange={(event) =>
                      setRecords((current) =>
                        current.map((record) =>
                          record.id === item.id
                            ? { ...record, status: event.target.value as AttendanceRecord["status"] }
                            : record
                        )
                      )
                    }
                  >
                    <option value="">Mark attendance</option>
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="late">Late</option>
                    <option value="excused">Excused</option>
                  </select>
                )}
              </label>
            );
          })}
        </div>
      ) : (
        <Empty
          title="No attendance records"
          copy="This register has no captured students."
        />
      )}
      {role !== "student" && session.status === "draft" && (
        <div className="modal-actions">
          <button className="secondary-button" onClick={save} disabled={busy}>
            {busy ? "Saving…" : savedNotice ? "Saved ✓" : "Save marks"}
          </button>
          <button
            className="primary-button"
            onClick={finalize}
            disabled={busy || records.some((item) => !item.status)}
          >
            {busy ? "Finalizing…" : "Finalize register"}
          </button>
        </div>
      )}
    </Modal>
  );
}

"use client";

import { FormEvent, useEffect, useState } from "react";
import { CirclePlay, Plus } from "lucide-react";
import { api, createResource, ListResult, updateResource } from "../edops-api";
import { ClassRoom, Recording, Role } from "./types";
import { Banner, dateTime, duration, Empty, FeatureCard, formatBytes, FormActions, Modal, run } from "./shared";

export function RecordingsPane({
  org,
  role,
  classroom,
}: {
  org: string;
  role: Role;
  classroom: ClassRoom;
}) {
  const [items, setItems] = useState<Recording[]>([]);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const root = `/organizations/${org}/recordings`;

  async function load() {
    const result = await api<ListResult<Recording>>(
      `${root}?sectionId=${classroom.sectionId}&subjectId=${classroom.subjectId}&limit=100`
    );
    setItems(result.items);
  }

  useEffect(() => {
    let live = true;
    api<ListResult<Recording>>(
      `${root}?sectionId=${classroom.sectionId}&subjectId=${classroom.subjectId}&limit=100`
    )
      .then((result) => live && setItems(result.items))
      .catch((reason) => live && setError(reason.message));
    return () => {
      live = false;
    };
  }, [classroom.sectionId, classroom.subjectId, root]);

  async function transition(id: string, action: "publish" | "archive") {
    setBusyId(id);
    await run(async () => {
      if (action === "publish") await createResource(`${root}/${id}/publish`, {});
      else await updateResource(`${root}/${id}/archive`, {});
      await load();
    }, setError);
    setBusyId(null);
  }

  async function play(id: string) {
    setPlayingId(id);
    await run(async () => {
      const result = await api<{ url: string }>(`${root}/${id}/playback`);
      window.open(result.url, "_blank", "noopener,noreferrer");
    }, setError);
    setPlayingId(null);
  }

  return (
    <FeatureCard
      title="Class recordings"
      copy={
        role === "student"
          ? "Watch published lessons securely."
          : "Upload a lesson, verify it, and publish it to students."
      }
      action={
        role !== "student" ? (
          <button className="primary-button" onClick={() => setCreating(true)}>
            <Plus size={17} /> Upload recording
          </button>
        ) : null
      }
    >
      {error && <Banner text={error} />}
      {items.length ? (
        <div className="media-grid">
          {items.map((item) => (
            <article key={item.id}>
              <div className="media-cover">
                <span>
                  <CirclePlay size={30} />
                </span>
                <small>{duration(item.durationSeconds)}</small>
              </div>
              <span className={`status-chip ${item.status}`}>{item.status}</span>
              <h3>{item.title}</h3>
              <p>{dateTime(item.recordedAt)} · {formatBytes(item.sizeBytes)}</p>
              <div className="row-actions">
                {(item.status === "published" || (role !== "student" && item.status === "ready")) && (
                  <button onClick={() => play(item.id)} disabled={playingId === item.id}>
                    {playingId === item.id ? "Opening…" : "Play"}
                  </button>
                )}
                {role !== "student" && item.status === "ready" && (
                  <button onClick={() => transition(item.id, "publish")} disabled={busyId === item.id}>
                    {busyId === item.id ? "Publishing…" : "Publish"}
                  </button>
                )}
                {role !== "student" && item.status !== "archived" && (
                  <button onClick={() => transition(item.id, "archive")} disabled={busyId === item.id}>
                    {busyId === item.id ? "Archiving…" : "Archive"}
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <Empty
          title="No recordings"
          copy="Published class recordings will appear here."
          action={role !== "student" ? { label: "Upload recording", onClick: () => setCreating(true) } : undefined}
        />
      )}
      {creating && (
        <RecordingUpload
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

function RecordingUpload({
  org,
  classroom,
  onClose,
}: {
  org: string;
  classroom: ClassRoom;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const data = new FormData(event.currentTarget);
    const file = data.get("file");
    if (!(file instanceof File)) return;

    try {
      const hash = btoa(
        String.fromCharCode(
          ...new Uint8Array(await crypto.subtle.digest("SHA-256", await file.arrayBuffer()))
        )
      );
      const recording = await createResource<Recording>(
        `/organizations/${org}/recordings`,
        {
          sectionId: classroom.sectionId,
          subjectId: classroom.subjectId,
          title: data.get("title"),
          recordedAt: new Date(String(data.get("recordedAt"))).toISOString(),
          durationSeconds: Number(data.get("durationSeconds")),
          contentType: file.type,
          sizeBytes: file.size,
          checksumSha256: hash,
        }
      );
      const target = await api<{ url: string; headers: Record<string, string> }>(
        `/organizations/${org}/recordings/${recording.id}/upload-url`,
        { method: "POST" }
      );
      const response = await fetch(target.url, {
        method: "PUT",
        headers: target.headers,
        body: file,
      });
      if (!response.ok) throw new Error("The video upload failed.");
      const versionId = response.headers.get("x-amz-version-id");
      if (!versionId) throw new Error("Storage did not return a version ID.");
      await createResource(
        `/organizations/${org}/recordings/${recording.id}/complete`,
        { versionId }
      );
      onClose();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Upload class recording" onClose={onClose}>
      <form className="product-form" onSubmit={upload}>
        {error && <Banner text={error} />}
        <label>
          Title
          <input name="title" required maxLength={200} />
        </label>
        <label>
          Video file
          <input name="file" type="file" accept="video/mp4,video/webm" required />
        </label>
        <div className="form-grid">
          <label>
            Recorded at
            <input name="recordedAt" type="datetime-local" required />
          </label>
          <label>
            Duration in seconds
            <input
              name="durationSeconds"
              type="number"
              min="1"
              max="28800"
              required
            />
          </label>
        </div>
        <FormActions
          onCancel={onClose}
          label={busy ? "Uploading…" : "Upload and verify"}
          disabled={busy}
        />
      </form>
    </Modal>
  );
}

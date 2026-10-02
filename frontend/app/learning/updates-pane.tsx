"use client";

import { useEffect, useState } from "react";
import { api, ListResult, updateResource } from "../edops-api";
import { ClassRoom, Inbox, Notification } from "./types";
import { Banner, dateTime, Empty, eventIcon, eventName, FeatureCard, run } from "./shared";

export function UpdatesPane({
  org,
  classroom,
}: {
  org: string;
  classroom: ClassRoom;
}) {
  const [inbox, setInbox] = useState<Inbox>({ items: [], total: 0, unreadCount: 0 });
  const [timeline, setTimeline] = useState<Notification[]>([]);
  const [error, setError] = useState("");

  async function load() {
    const [messages, events] = await Promise.all([
      api<Inbox>(`/organizations/${org}/notifications?filter=all&limit=100`),
      api<ListResult<Notification>>(
        `/organizations/${org}/timeline?sectionId=${classroom.sectionId}&subjectId=${classroom.subjectId}&limit=100`
      ),
    ]);
    setInbox(messages);
    setTimeline(events.items);
  }

  useEffect(() => {
    let live = true;
    Promise.all([
      api<Inbox>(`/organizations/${org}/notifications?filter=all&limit=100`),
      api<ListResult<Notification>>(
        `/organizations/${org}/timeline?sectionId=${classroom.sectionId}&subjectId=${classroom.subjectId}&limit=100`
      ),
    ])
      .then(([messages, events]) => {
        if (live) {
          setInbox(messages);
          setTimeline(events.items);
        }
      })
      .catch((reason) => live && setError(reason.message));
    return () => {
      live = false;
    };
  }, [classroom.sectionId, classroom.subjectId, org]);

  async function markRead(id: string) {
    await run(async () => {
      await updateResource(`/organizations/${org}/notifications/${id}/read`, {});
      await load();
    }, setError);
  }

  return (
    <div className="two-feature-columns">
      <FeatureCard
        title={`Notifications · ${inbox.unreadCount} unread`}
        copy="Updates addressed directly to you."
      >
        {error && <Banner text={error} />}
        {inbox.items.length ? (
          <div className="updates-list">
            {inbox.items.map((item) => (
              <article key={item.id} className={!item.readAt ? "unread" : ""}>
                <span>{eventIcon(item.eventType)}</span>
                <div>
                  <b>{eventName(item.eventType)}</b>
                  <small>{dateTime(item.occurredAt)}</small>
                </div>
                {!item.readAt && (
                  <button onClick={() => markRead(item.id)}>Mark read</button>
                )}
              </article>
            ))}
          </div>
        ) : (
          <Empty title="Inbox is clear" copy="New class updates will appear here." />
        )}
      </FeatureCard>
      <FeatureCard
        title="Class timeline"
        copy="Recent published activity in this class."
      >
        {timeline.length ? (
          <div className="timeline-list">
            {timeline.map((item) => (
              <article key={item.id}>
                <span>{eventIcon(item.eventType)}</span>
                <div>
                  <b>{eventName(item.eventType)}</b>
                  <small>{dateTime(item.occurredAt)}</small>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <Empty
            title="No class activity"
            copy="Published work and finalized attendance will appear here."
          />
        )}
      </FeatureCard>
    </div>
  );
}

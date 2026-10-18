'use client';

import React, { useEffect, useRef, useState } from 'react';
import { X, Video, Bookmark, BookmarkCheck, AlertCircle, Clock } from 'lucide-react';
import { api, updateStudentLectureProgress, toggleStudentBookmark } from '../../edops-api';

const T = {
  navy: '#0c1e33',
  slate: '#495d72',
  muted: '#a6abb5',
  faint: '#b3b3b3',
  pageBg: '#f4f6f7',
  white: '#ffffff',
  border: '#e4e6e9',
  line: '#ced8e5',
  chip: '#f5f6f8',
  blue: '#17a1fa',
  greenBg: '#d9eed1',
  green: '#61a249',
  greenDark: '#1a5c0a',
};

interface LecturePlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  lecture: any;
  onSuccess?: () => void;
}

export function LecturePlayerModal({
  isOpen,
  onClose,
  organizationId,
  lecture,
  onSuccess,
}: LecturePlayerModalProps) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [bookmarked, setBookmarked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let active = true;
    setUrl('');
    setError('');
    setLoading(true);
    setBookmarked(!!lecture?.isBookmarked);

    if (isOpen && lecture) {
      api<any>(`/organizations/${organizationId}/recordings/${lecture.id}/playback`)
        .then((data) => {
          if (active) {
            setUrl(data.url);
            setLoading(false);
          }
        })
        .catch((e) => {
          if (active) {
            setError(e.message || 'Unable to load playback URL');
            setLoading(false);
          }
        });
    }

    return () => {
      active = false;
    };
  }, [isOpen, organizationId, lecture?.id]);

  if (!isOpen || !lecture) return null;

  const saveProgress = async () => {
    const v = video.current;
    if (!v || !Number.isFinite(v.duration) || !v.duration) return;
    setSaving(true);
    try {
      await updateStudentLectureProgress(organizationId, lecture.id, {
        lastPositionSeconds: Math.floor(v.currentTime),
        watchedPct: Math.min(100, Math.round((100 * v.currentTime) / v.duration)),
        isCompleted: v.ended,
      });
      onSuccess?.();
    } catch (e: any) {
      setError(e instanceof Error ? e.message : 'Progress could not be saved');
    } finally {
      setSaving(false);
    }
  };

  const handleBookmarkToggle = async () => {
    try {
      const saved = await toggleStudentBookmark(organizationId, {
        resourceId: lecture.id,
        resourceType: 'recorded_lecture',
        title: lecture.title,
        subjectName: lecture.subject,
        url: `/organizations/${organizationId}/recordings/${lecture.id}/playback`,
      });
      setBookmarked(saved.isBookmarked);
    } catch (e: any) {
      setError(e instanceof Error ? e.message : 'Bookmark could not be updated');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(12, 30, 51, 0.45)',
        padding: '16px',
        boxSizing: 'border-box',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '720px',
          background: T.white,
          border: `1px solid ${T.border}`,
          borderRadius: '10px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          boxSizing: 'border-box',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '16px',
            padding: '20px 24px',
            background: T.white,
            borderBottom: `1px solid ${T.border}`,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 600,
                color: T.slate,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              Recorded Session
            </span>
            <h2
              style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: 600,
                color: T.navy,
                letterSpacing: '-0.01em',
              }}
            >
              {lecture.title}
            </h2>
            <p style={{ margin: 0, fontSize: '13px', color: T.slate }}>
              {lecture.subject} {lecture.teacher ? `· ${lecture.teacher}` : ''}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={handleBookmarkToggle}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 12px',
                border: `1px solid ${T.line}`,
                borderRadius: '6px',
                background: bookmarked ? T.chip : T.white,
                color: T.navy,
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {bookmarked ? <BookmarkCheck size={14} color="#0c1e33" /> : <Bookmark size={14} color={T.slate} />}
              <span>{bookmarked ? 'Bookmarked' : 'Bookmark'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              style={{
                all: 'unset',
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: T.chip,
                color: T.slate,
                display: 'grid',
                placeItems: 'center',
                cursor: 'pointer',
                flexShrink: 0,
                boxSizing: 'border-box',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Video Canvas */}
        <div style={{ background: '#0b0f19', padding: '16px', display: 'flex', justifyContent: 'center' }}>
          {error && (
            <div style={{ padding: '12px', color: '#ffd6d6', fontSize: '12px' }}>
              {error}
            </div>
          )}

          {loading ? (
            <div style={{ padding: '40px 0', color: '#ffffff', fontSize: '13px' }}>
              Loading lecture recording...
            </div>
          ) : url ? (
            <video
              ref={video}
              controls
              style={{ width: '100%', maxHeight: '420px', borderRadius: '6px' }}
              src={url}
              onLoadedMetadata={() => {
                if (video.current && lecture.lastPositionSeconds) {
                  video.current.currentTime = lecture.lastPositionSeconds;
                }
              }}
              onPause={saveProgress}
              onEnded={saveProgress}
            />
          ) : (
            <div style={{ padding: '40px 0', color: T.muted, fontSize: '13px' }}>
              No playable stream available.
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 24px',
            background: T.pageBg,
            borderTop: `1px solid ${T.border}`,
            fontSize: '12px',
            color: T.slate,
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={14} />
            {lecture.duration || 'Video lecture'}
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 16px',
              border: `1px solid ${T.navy}`,
              borderRadius: '6px',
              background: T.navy,
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Close Player
          </button>
        </div>
      </div>
    </div>
  );
}

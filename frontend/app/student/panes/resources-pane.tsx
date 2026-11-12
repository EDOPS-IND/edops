'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Bookmark,
  ChevronRight,
  Download,
  FileText,
  Layers,
  Play,
  Video,
} from 'lucide-react';
import { getStudentResources, toggleStudentBookmark } from '../../edops-api';

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
  track: '#eceef3',
  greenBg: '#d9eed1',
  green: '#61a249',
  greenDark: '#1a5c0a',
  amber: '#f59e0b',
};

const GENERAL = 'General';
const norm = (value: unknown): string =>
  typeof value === 'string' && value.trim() ? value.trim() : GENERAL;

type Hierarchy = Map<string, Map<string, Map<string, any[]>>>;

function buildHierarchy(items: any[]): Hierarchy {
  const subjects: Hierarchy = new Map();
  for (const item of items) {
    const subject = norm(item.subject);
    const chapter = norm(item.chapter);
    const topic = norm(item.topic);
    if (!subjects.has(subject)) subjects.set(subject, new Map());
    const chapters = subjects.get(subject)!;
    if (!chapters.has(chapter)) chapters.set(chapter, new Map());
    const topics = chapters.get(chapter)!;
    if (!topics.has(topic)) topics.set(topic, []);
    topics.get(topic)!.push(item);
  }
  return subjects;
}

const chapterResourceCount = (topics: Map<string, any[]>) =>
  Array.from(topics.values()).reduce((sum, list) => sum + list.length, 0);

const subjectResourceCount = (chapters: Map<string, Map<string, any[]>>) =>
  Array.from(chapters.values()).reduce(
    (sum, topics) => sum + chapterResourceCount(topics),
    0,
  );

const formatDate = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatDuration = (seconds?: number) => {
  if (!seconds || seconds <= 0) return 'Duration not set';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, '0')} min`;
};

const cardStyle: React.CSSProperties = {
  background: T.white,
  border: `1px solid ${T.border}`,
  borderRadius: '10px',
  padding: '18px 20px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  gap: '12px',
  boxSizing: 'border-box',
};

const chipStyle: React.CSSProperties = {
  padding: '2px 8px',
  borderRadius: '4px',
  background: 'rgba(12, 30, 51, 0.05)',
  fontSize: '10px',
  fontWeight: 600,
  color: T.navy,
  textTransform: 'uppercase',
  letterSpacing: '0.03em',
  width: 'fit-content',
};

const gridStyle = (min: number): React.CSSProperties => ({
  display: 'grid',
  gridTemplateColumns: `repeat(auto-fill, minmax(${min}px, 1fr))`,
  gap: '12px',
});

const tileStyle: React.CSSProperties = {
  all: 'unset',
  boxSizing: 'border-box',
  cursor: 'pointer',
  background: T.white,
  border: `1px solid ${T.border}`,
  borderRadius: '10px',
  padding: '18px',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  transition: 'border-color 0.15s ease, transform 0.15s ease',
};

interface ResourcesPaneProps {
  organizationId: string;
  onOpenLecture: (lecture: any) => void;
  initialTab?: string;
  onTabChange?: (tab: string) => void;
}

export const ResourcesPane: React.FC<ResourcesPaneProps> = ({
  organizationId,
  onOpenLecture,
  initialTab,
  onTabChange,
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'materials' | 'lectures' | 'bookmarks'>(
    initialTab && ['materials', 'lectures', 'bookmarks'].includes(initialTab)
      ? (initialTab as any)
      : 'materials'
  );
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);

  useEffect(() => {
    if (initialTab && ['materials', 'lectures', 'bookmarks'].includes(initialTab)) {
      setActiveTab(initialTab as any);
      setSelectedSubject(null);
      setSelectedChapter(null);
    }
  }, [initialTab]);

  useEffect(() => {
    loadResources();
  }, [organizationId]);

  const loadResources = async () => {
    setLoading(true);
    try {
      const res = await getStudentResources(organizationId);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBookmark = async (item: any, type: string) => {
    try {
      await toggleStudentBookmark(organizationId, {
        resourceId: item.id,
        resourceType: type,
        title: item.title,
        subjectName: item.subject,
        url: item.fileUrl || item.videoUrl || '',
      });
      loadResources();
    } catch (err) {
      console.error(err);
    }
  };

  const studyMaterials = data?.studyMaterials || [];
  const recordedLectures = data?.recordedLectures || [];
  const bookmarks = data?.bookmarks || [];

  const hierarchy = useMemo<Hierarchy>(
    () => buildHierarchy(activeTab === 'lectures' ? recordedLectures : studyMaterials),
    [activeTab, studyMaterials, recordedLectures],
  );

  const chapters = selectedSubject ? hierarchy.get(selectedSubject) : undefined;
  const topics = selectedSubject && selectedChapter ? chapters?.get(selectedChapter) : undefined;

  if (loading) {
    return (
      <div style={{ padding: '48px 0', textAlign: 'center', color: T.slate, fontFamily: "'Poppins', sans-serif" }}>
        <div
          style={{
            width: '28px',
            height: '28px',
            border: `3px solid ${T.line}`,
            borderTopColor: T.navy,
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 12px',
          }}
        />
        <p style={{ fontSize: '13px', fontWeight: 600, color: T.slate, margin: 0 }}>
          Loading study resources & recorded lectures...
        </p>
      </div>
    );
  }

  const renderMaterialCard = (item: any, key: string) => (
    <div key={key} style={cardStyle}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
          <span style={chipStyle}>{item.type || 'pdf'}</span>
          <button
            type="button"
            onClick={() => handleBookmark(item, 'study_material')}
            title={item.isBookmarked ? 'Remove bookmark' : 'Bookmark'}
            style={{ all: 'unset', cursor: 'pointer', color: item.isBookmarked ? T.amber : T.muted, lineHeight: 0 }}
          >
            <Bookmark size={16} fill={item.isBookmarked ? T.amber : 'none'} />
          </button>
        </div>
        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: T.navy, lineHeight: 1.35 }}>
          {item.title}
        </h4>
        {item.description ? (
          <p style={{ margin: 0, fontSize: '12px', color: T.slate, lineHeight: 1.5 }}>
            {item.description}
          </p>
        ) : null}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: `1px solid ${T.border}`, gap: '8px' }}>
        <span style={{ fontSize: '11px', color: T.faint }}>
          {item.uploadedBy ? `By ${item.uploadedBy}` : formatDate(item.date) || 'Study material'}
        </span>
        <a
          href={item.fileUrl || '#'}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            border: `1px solid ${T.line}`,
            borderRadius: '6px',
            background: T.white,
            fontSize: '12px',
            fontWeight: 600,
            color: T.navy,
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          <Download size={13} />
          <span>Open</span>
        </a>
      </div>
    </div>
  );

  const renderLectureCard = (item: any, key: string) => {
    const watched = Math.max(0, Math.min(100, Number(item.watchedPct) || 0));
    return (
      <div key={key} style={cardStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
            <span style={{ ...chipStyle, background: '#bae5f5', color: '#0a5a7a' }}>
              {formatDuration(item.durationSeconds)}
            </span>
            <button
              type="button"
              onClick={() => handleBookmark(item, 'recorded_lecture')}
              title={item.isBookmarked ? 'Remove bookmark' : 'Bookmark'}
              style={{ all: 'unset', cursor: 'pointer', color: item.isBookmarked ? T.amber : T.muted, lineHeight: 0 }}
            >
              <Bookmark size={16} fill={item.isBookmarked ? T.amber : 'none'} />
            </button>
          </div>
          <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: T.navy, lineHeight: 1.35 }}>
            {item.title}
          </h4>
          <p style={{ margin: 0, fontSize: '12px', color: T.slate }}>
            Faculty: <strong style={{ color: T.navy }}>{item.teacher || 'Not assigned'}</strong>
          </p>
          <div>
            <div style={{ height: '4px', borderRadius: '100px', background: T.track, overflow: 'hidden' }}>
              <div style={{ width: `${watched}%`, height: '100%', background: watched >= 100 ? T.green : T.blue }} />
            </div>
            <span style={{ fontSize: '11px', color: T.faint }}>
              {item.isCompleted ? 'Completed' : watched > 0 ? `${watched}% watched` : 'Unwatched'}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '10px', borderTop: `1px solid ${T.border}` }}>
          <button
            type="button"
            onClick={() => onOpenLecture(item)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              border: `1px solid ${T.navy}`,
              borderRadius: '6px',
              background: T.navy,
              fontSize: '12px',
              fontWeight: 600,
              color: '#ffffff',
              cursor: 'pointer',
            }}
          >
            <Play size={13} fill="#ffffff" />
            <span>{watched > 0 && !item.isCompleted ? 'Resume' : 'Watch Recording'}</span>
          </button>
        </div>
      </div>
    );
  };

  const renderResourceCard = (item: any, key: string) =>
    activeTab === 'lectures' ? renderLectureCard(item, key) : renderMaterialCard(item, key);

  const renderHierarchy = () => {
    const source = activeTab === 'lectures' ? recordedLectures : studyMaterials;
    if (source.length === 0) {
      return (
        <div style={{ padding: '32px', textAlign: 'center', background: T.white, border: `1px solid ${T.border}`, borderRadius: '10px', color: T.slate, fontSize: '13px' }}>
          {activeTab === 'lectures'
            ? 'No recorded lecture streams available.'
            : 'No study notes currently published.'}
        </div>
      );
    }

    // Level 1 — subject tiles
    if (!selectedSubject) {
      return (
        <div style={gridStyle(220)}>
          {Array.from(hierarchy.entries()).map(([subject, subjectChapters]) => {
            const resourceCount = subjectResourceCount(subjectChapters);
            return (
              <button
                key={subject}
                type="button"
                onClick={() => {
                  setSelectedSubject(subject);
                  setSelectedChapter(null);
                }}
                style={tileStyle}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: T.navy, fontSize: '14px', fontWeight: 600 }}>
                    <BookOpen size={16} color={T.blue} />
                    {subject}
                  </span>
                  <ChevronRight size={16} color={T.muted} />
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={chipStyle}>
                    {subjectChapters.size} {subjectChapters.size === 1 ? 'chapter' : 'chapters'}
                  </span>
                  <span style={chipStyle}>
                    {resourceCount} {resourceCount === 1 ? 'resource' : 'resources'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      );
    }

    // Level 2 — chapter tiles
    if (!selectedChapter && chapters) {
      return (
        <div style={gridStyle(220)}>
          {Array.from(chapters.entries()).map(([chapter, chapterTopics]) => {
            const resourceCount = chapterResourceCount(chapterTopics);
            return (
              <button
                key={chapter}
                type="button"
                onClick={() => setSelectedChapter(chapter)}
                style={tileStyle}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: T.navy, fontSize: '14px', fontWeight: 600 }}>
                    <Layers size={16} color={T.green} />
                    {chapter}
                  </span>
                  <ChevronRight size={16} color={T.muted} />
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={chipStyle}>
                    {chapterTopics.size} {chapterTopics.size === 1 ? 'topic' : 'topics'}
                  </span>
                  <span style={chipStyle}>
                    {resourceCount} {resourceCount === 1 ? 'resource' : 'resources'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      );
    }

    // Level 3 — topics with their resources
    if (topics) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {Array.from(topics.entries()).map(([topic, items]) => (
            <div key={topic} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={14} color={T.slate} />
                <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: T.navy }}>{topic}</h4>
                <span style={{ fontSize: '11px', color: T.faint }}>
                  {items.length} {items.length === 1 ? 'item' : 'items'}
                </span>
              </div>
              <div style={gridStyle(260)}>
                {items.map((item, idx) => renderResourceCard(item, `${topic}-${item.id || idx}`))}
              </div>
            </div>
          ))}
        </div>
      );
    }

    return null;
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* 1. Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
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
            Digital Repository
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
            Learning Resources & Recorded Lectures
          </h2>
          <p style={{ margin: 0, fontSize: '13px', color: T.slate, lineHeight: 1.5 }}>
            Browse by subject, then chapter, then topic. Includes study notes and recorded classroom sessions.
          </p>
        </div>
        <div
          style={{
            padding: '4px 10px',
            borderRadius: '100px',
            background: T.chip,
            fontSize: '10px',
            fontWeight: 600,
            color: T.slate,
          }}
        >
          {studyMaterials.length + recordedLectures.length} Total Resources
        </div>
      </div>

      {/* 2. Filter Pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
        {[
          { id: 'materials', label: `Study Notes (${studyMaterials.length})` },
          { id: 'lectures', label: `Recorded Lectures (${recordedLectures.length})` },
          { id: 'bookmarks', label: `Bookmarked (${bookmarks.length})` },
        ].map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id as any);
                setSelectedSubject(null);
                setSelectedChapter(null);
                onTabChange?.(tab.id);
              }}
              style={{
                all: 'unset',
                boxSizing: 'border-box',
                padding: '6px 16px',
                borderRadius: '100px',
                fontSize: '12px',
                fontWeight: active ? 600 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                background: active ? T.navy : T.chip,
                color: active ? '#ffffff' : T.slate,
                border: active ? `1px solid ${T.navy}` : `1px solid ${T.border}`,
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 3. Breadcrumb trail for drill-down */}
      {activeTab !== 'bookmarks' && selectedSubject && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', fontSize: '12px', color: T.slate }}>
          <button
            type="button"
            onClick={() => {
              setSelectedSubject(null);
              setSelectedChapter(null);
            }}
            style={{ all: 'unset', cursor: 'pointer', color: T.blue, fontWeight: 600 }}
          >
            All Subjects
          </button>
          <ChevronRight size={13} color={T.muted} />
          <button
            type="button"
            onClick={() => setSelectedChapter(null)}
            style={{
              all: 'unset',
              cursor: selectedChapter ? 'pointer' : 'default',
              color: selectedChapter ? T.blue : T.navy,
              fontWeight: 600,
            }}
          >
            {selectedSubject}
          </button>
          {selectedChapter && (
            <>
              <ChevronRight size={13} color={T.muted} />
              <span style={{ color: T.navy, fontWeight: 600 }}>{selectedChapter}</span>
            </>
          )}
        </div>
      )}

      {/* 4. Content */}
      {activeTab !== 'bookmarks' && renderHierarchy()}

      {activeTab === 'bookmarks' && (
        <div style={gridStyle(280)}>
          {bookmarks.length === 0 ? (
            <div style={{ gridColumn: '1/-1', padding: '32px', textAlign: 'center', background: T.white, border: `1px solid ${T.border}`, borderRadius: '10px', color: T.slate, fontSize: '13px' }}>
              No bookmarked resources saved yet.
            </div>
          ) : (
            bookmarks.map((bm: any, idx: number) => (
              <div key={bm.id || idx} style={cardStyle}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {bm.resourceType === 'recorded_lecture' ? (
                      <Video size={13} color={T.slate} />
                    ) : (
                      <FileText size={13} color={T.slate} />
                    )}
                    <span style={chipStyle}>
                      {bm.resourceType === 'recorded_lecture' ? 'Recorded Lecture' : 'Study Note'}
                    </span>
                  </div>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: T.navy }}>
                    {bm.title}
                  </h4>
                  {bm.subject && (
                    <span style={{ fontSize: '11px', color: T.slate }}>{bm.subject}</span>
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px', paddingTop: '8px', borderTop: `1px solid ${T.border}` }}>
                  {bm.url && (
                    <a
                      href={bm.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '11px', fontWeight: 600, color: T.navy, textDecoration: 'none' }}
                    >
                      Open
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => handleBookmark({ id: bm.resourceId, title: bm.title, subject: bm.subjectName }, bm.resourceType)}
                    style={{
                      padding: '6px 12px',
                      border: `1px solid ${T.line}`,
                      borderRadius: '6px',
                      background: T.white,
                      fontSize: '11px',
                      fontWeight: 600,
                      color: T.slate,
                      cursor: 'pointer',
                    }}
                  >
                    Remove Bookmark
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

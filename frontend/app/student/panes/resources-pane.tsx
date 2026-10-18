'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, Video, Bookmark, BookmarkCheck, FileText, Download, Play, CheckCircle2 } from 'lucide-react';
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
};

interface ResourcesPaneProps {
  organizationId: string;
  onOpenLecture: (lecture: any) => void;
}

export const ResourcesPane: React.FC<ResourcesPaneProps> = ({ organizationId, onOpenLecture }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'materials' | 'lectures' | 'bookmarks'>('materials');

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

  const handleBookmark = async (item: any, type: any) => {
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

  const studyMaterials = data?.studyMaterials || [];
  const recordedLectures = data?.recordedLectures || [];
  const bookmarks = data?.bookmarks || [];

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
            Curated study notes, NCERT exemplar problem sets, and recorded classroom sessions.
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
              onClick={() => setActiveTab(tab.id as any)}
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

      {/* 3. Resources Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '14px',
        }}
      >
        {activeTab === 'materials' && (
          studyMaterials.length === 0 ? (
            <div style={{ gridColumn: '1/-1', padding: '32px', textAlign: 'center', background: T.white, border: `1px solid ${T.border}`, borderRadius: '10px', color: T.slate, fontSize: '13px' }}>
              No study notes currently published.
            </div>
          ) : (
            studyMaterials.map((item: any) => (
              <div
                key={item.id}
                style={{
                  background: T.white,
                  border: `1px solid ${T.border}`,
                  borderRadius: '10px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '14px',
                  boxSizing: 'border-box',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: 'rgba(12, 30, 51, 0.05)',
                        fontSize: '10px',
                        fontWeight: 600,
                        color: T.navy,
                        textTransform: 'uppercase',
                      }}
                    >
                      {item.subject}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleBookmark(item, 'study_material')}
                      title="Bookmark"
                      style={{
                        all: 'unset',
                        cursor: 'pointer',
                        color: item.isBookmarked ? '#f59e0b' : T.muted,
                      }}
                    >
                      <Bookmark size={16} fill={item.isBookmarked ? '#f59e0b' : 'none'} />
                    </button>
                  </div>
                  <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: T.navy }}>
                    {item.title}
                  </h4>
                  <p style={{ margin: 0, fontSize: '12px', color: T.slate, lineHeight: 1.5 }}>
                    {item.description || 'Comprehensive revision material and formula reference sheets.'}
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: `1px solid ${T.border}` }}>
                  <span style={{ fontSize: '11px', color: T.faint }}>
                    {item.fileSize || 'PDF Document'}
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
                    }}
                  >
                    <Download size={13} />
                    <span>Download</span>
                  </a>
                </div>
              </div>
            ))
          )
        )}

        {activeTab === 'lectures' && (
          recordedLectures.length === 0 ? (
            <div style={{ gridColumn: '1/-1', padding: '32px', textAlign: 'center', background: T.white, border: `1px solid ${T.border}`, borderRadius: '10px', color: T.slate, fontSize: '13px' }}>
              No recorded lecture streams available.
            </div>
          ) : (
            recordedLectures.map((item: any) => (
              <div
                key={item.id}
                style={{
                  background: T.white,
                  border: `1px solid ${T.border}`,
                  borderRadius: '10px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '14px',
                  boxSizing: 'border-box',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: '#bae5f5',
                        color: '#0a5a7a',
                        fontSize: '10px',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                      }}
                    >
                      {item.subject}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleBookmark(item, 'recorded_lecture')}
                      style={{
                        all: 'unset',
                        cursor: 'pointer',
                        color: item.isBookmarked ? '#f59e0b' : T.muted,
                      }}
                    >
                      <Bookmark size={16} fill={item.isBookmarked ? '#f59e0b' : 'none'} />
                    </button>
                  </div>
                  <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: T.navy }}>
                    {item.title}
                  </h4>
                  <p style={{ margin: 0, fontSize: '12px', color: T.slate }}>
                    Faculty: <strong style={{ color: T.navy }}>{item.teacher}</strong> • {item.duration || '45 mins'}
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: `1px solid ${T.border}` }}>
                  <span style={{ fontSize: '11px', color: T.faint }}>
                    {item.watchedPct ? `${item.watchedPct}% watched` : 'Unwatched'}
                  </span>
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
                    <span>Watch Recording</span>
                  </button>
                </div>
              </div>
            ))
          )
        )}

        {activeTab === 'bookmarks' && (
          bookmarks.length === 0 ? (
            <div style={{ gridColumn: '1/-1', padding: '32px', textAlign: 'center', background: T.white, border: `1px solid ${T.border}`, borderRadius: '10px', color: T.slate, fontSize: '13px' }}>
              No bookmarked resources saved yet.
            </div>
          ) : (
            bookmarks.map((bm: any, idx: number) => (
              <div
                key={idx}
                style={{
                  background: T.white,
                  border: `1px solid ${T.border}`,
                  borderRadius: '10px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '12px',
                  boxSizing: 'border-box',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: T.chip,
                      fontSize: '10px',
                      fontWeight: 600,
                      color: T.navy,
                      textTransform: 'uppercase',
                      width: 'fit-content',
                    }}
                  >
                    {bm.subjectName || 'Study Material'}
                  </span>
                  <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: T.navy }}>
                    {bm.title}
                  </h4>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px' }}>
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
          )
        )}
      </div>
    </div>
  );
};

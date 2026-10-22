'use client';

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Check,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Play,
  Sparkles,
  Layers,
  Calendar,
  AlertCircle,
  GraduationCap
} from 'lucide-react';
import { getStudentCurriculum } from '../../edops-api';

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
  blueBg: '#e6f4fe',
  blueText: '#0a64b7',
  amberBg: '#fef3c7',
  amberText: '#92400e',
};

interface CurriculumPaneProps {
  organizationId: string;
}

export const CurriculumPane: React.FC<CurriculumPaneProps> = ({ organizationId }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);

  useEffect(() => {
    loadCurriculum();
  }, [organizationId]);

  const loadCurriculum = async () => {
    setLoading(true);
    try {
      const res = await getStudentCurriculum(organizationId);
      setData(res);
    } catch (err) {
      console.error('Failed to load student curriculum:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center', color: T.slate, fontFamily: "'Poppins', sans-serif" }}>
        <div
          style={{
            width: '32px',
            height: '32px',
            border: `3px solid ${T.line}`,
            borderTopColor: T.navy,
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 14px',
          }}
        />
        <p style={{ fontSize: '13px', fontWeight: 600, color: T.slate, margin: 0 }}>
          Loading your subjects & syllabus tracker...
        </p>
      </div>
    );
  }

  const subjects = data?.subjects || [];
  const overallProgress = data?.overallProgress || 0;
  const activeSubject = selectedSubjectId
    ? subjects.find((s: any) => s.id === selectedSubjectId || s.subjectId === selectedSubjectId)
    : null;

  // Split active subject chapters into 3 distinct categories
  const inProgressChapters = activeSubject?.chapters?.filter((c: any) => c.status === 'In Progress') || [];
  const upcomingChapters = activeSubject?.chapters?.filter((c: any) => c.status === 'Upcoming') || [];
  const completedChapters = activeSubject?.chapters?.filter((c: any) => c.status === 'Completed') || [];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* View 1: Subject Cards Grid View */}
      {!activeSubject ? (
        <>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: T.slate,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                Academics &bull; Student Syllabus
              </span>
              <h2
                style={{
                  margin: 0,
                  fontSize: '20px',
                  fontWeight: 700,
                  color: T.navy,
                  letterSpacing: '-0.01em',
                }}
              >
                My Subjects & Curriculum
              </h2>
              <p style={{ margin: 0, fontSize: '13px', color: T.slate, lineHeight: 1.5 }}>
                {data?.className ? `${data.className}` : 'Enrolled Class'} {data?.sectionName ? `(Sec ${data.sectionName})` : ''} — View syllabus coverage, ongoing chapters, and upcoming lessons.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  padding: '6px 14px',
                  borderRadius: '100px',
                  background: T.chip,
                  fontSize: '11px',
                  fontWeight: 600,
                  color: T.navy,
                  border: `1px solid ${T.border}`,
                }}
              >
                {subjects.length} Enrolled Subjects
              </div>
            </div>
          </div>

          {/* Overall Syllabus Coverage Banner */}
          <div
            style={{
              background: '#ccefbf',
              border: '1px solid #b7e3a3',
              borderRadius: '12px',
              padding: '22px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              color: '#1a5c0a',
              boxSizing: 'border-box',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Total Academic Syllabus Coverage
                </span>
                <p style={{ margin: 0, fontSize: '32px', fontWeight: 800, lineHeight: 1 }}>
                  {overallProgress}% Completed
                </p>
              </div>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: 'rgba(26, 92, 10, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <GraduationCap size={24} color="#1a5c0a" />
              </div>
            </div>

            <div style={{ width: '100%', height: '8px', background: 'rgba(26, 92, 10, 0.18)', borderRadius: '12px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  background: '#1a5c0a',
                  width: `${overallProgress}%`,
                  borderRadius: '12px',
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', opacity: 0.9 }}>
              <span>Tracked across all classroom instructional logs</span>
              <span>{subjects.reduce((acc: number, s: any) => acc + (s.totalChapters || 0), 0)} Total Chapters Prescribed</span>
            </div>
          </div>

          {/* Subjects Grid Cards */}
          <div>
            <div style={{ marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: T.navy }}>
                Select a Subject to Inspect Syllabus
              </h3>
              <span style={{ fontSize: '12px', color: T.slate }}>Click any subject card</span>
            </div>

            {subjects.length === 0 ? (
              <div
                style={{
                  padding: '48px',
                  textAlign: 'center',
                  background: T.white,
                  borderRadius: '10px',
                  border: `1px solid ${T.border}`,
                  color: T.slate,
                }}
              >
                <BookOpen size={36} color={T.muted} style={{ margin: '0 auto 12px' }} />
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: T.navy }}>
                  No subjects assigned yet
                </p>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: T.slate }}>
                  Your section subjects or curriculum nodes have not been mapped yet.
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '16px',
                }}
              >
                {subjects.map((sub: any) => {
                  const pct = sub.progress || 0;
                  return (
                    <div
                      key={sub.id || sub.subjectId}
                      onClick={() => setSelectedSubjectId(sub.id || sub.subjectId)}
                      style={{
                        background: T.white,
                        border: `1px solid ${T.border}`,
                        borderRadius: '12px',
                        padding: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                        boxSizing: 'border-box',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = T.navy;
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 14px rgba(12,30,51,0.08)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = T.border;
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.02)';
                      }}
                    >
                      <div>
                        {/* Top: Icon + Code */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                          <div
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '8px',
                              background: T.pageBg,
                              border: `1px solid ${T.border}`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: T.navy,
                            }}
                          >
                            <BookOpen size={20} />
                          </div>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: '6px',
                              background: T.chip,
                              color: T.slate,
                              letterSpacing: '0.04em',
                            }}
                          >
                            {sub.code || 'SUB'}
                          </span>
                        </div>

                        {/* Subject Title */}
                        <h4 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 600, color: T.navy }}>
                          {sub.subject || sub.name}
                        </h4>

                        {/* Status Badges */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 600,
                              padding: '2px 7px',
                              borderRadius: '4px',
                              background: T.blueBg,
                              color: T.blueText,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Play size={9} fill="currentColor" /> {sub.inProgressChapters || 0} Ongoing
                          </span>
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 600,
                              padding: '2px 7px',
                              borderRadius: '4px',
                              background: T.greenBg,
                              color: T.greenDark,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Check size={10} /> {sub.completedChapters || 0} Done
                          </span>
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 600,
                              padding: '2px 7px',
                              borderRadius: '4px',
                              background: T.chip,
                              color: T.slate,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Clock size={10} /> {sub.upcomingChapters || 0} Upcoming
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar & Footer */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontSize: '11px', color: T.slate, fontWeight: 500 }}>
                            {sub.totalChapters || 0} Chapters Total
                          </span>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: T.navy }}>
                            {pct}%
                          </span>
                        </div>
                        <div style={{ width: '100%', height: '6px', background: T.track, borderRadius: '6px', overflow: 'hidden' }}>
                          <div
                            style={{
                              height: '100%',
                              background: pct >= 100 ? T.green : T.navy,
                              width: `${pct}%`,
                              borderRadius: '6px',
                            }}
                          />
                        </div>

                        <div
                          style={{
                            marginTop: '14px',
                            paddingTop: '12px',
                            borderTop: `1px solid ${T.border}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            color: T.navy,
                            fontSize: '12px',
                            fontWeight: 600,
                          }}
                        >
                          <span>Explore Syllabus</span>
                          <ChevronRight size={16} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      ) : (
        /* View 2: Detailed Subject Syllabus Drill-Down */
        <>
          {/* Back Navigation Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <button
              type="button"
              onClick={() => setSelectedSubjectId(null)}
              style={{
                all: 'unset',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                fontWeight: 600,
                color: T.navy,
                padding: '6px 12px',
                borderRadius: '8px',
                background: T.white,
                border: `1px solid ${T.border}`,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = T.navy;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = T.border;
              }}
            >
              <ArrowLeft size={16} /> Back to All Subjects
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: T.slate }}>
                {data?.className} {data?.sectionName ? `(${data.sectionName})` : ''} &bull; <strong>{activeSubject.subject || activeSubject.name}</strong>
              </span>
            </div>
          </div>

          {/* Subject Overview Card */}
          <div
            style={{
              background: T.white,
              border: `1px solid ${T.border}`,
              borderRadius: '12px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: T.navy }}>
                    {activeSubject.subject || activeSubject.name}
                  </h2>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: T.chip,
                      color: T.slate,
                    }}
                  >
                    {activeSubject.code || 'SUB'}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '13px', color: T.slate }}>
                  Complete chapter breakdown, ongoing classroom topics, and upcoming syllabus roadmap.
                </p>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '28px', fontWeight: 800, color: T.navy }}>
                  {activeSubject.progress || 0}%
                </span>
                <span style={{ display: 'block', fontSize: '11px', color: T.slate, fontWeight: 500 }}>
                  Curriculum Covered
                </span>
              </div>
            </div>

            <div style={{ width: '100%', height: '8px', background: T.track, borderRadius: '8px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  background: activeSubject.progress >= 100 ? T.green : T.navy,
                  width: `${activeSubject.progress || 0}%`,
                  borderRadius: '8px',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', paddingTop: '8px' }}>
              <div style={{ padding: '12px', background: T.pageBg, borderRadius: '8px', border: `1px solid ${T.border}` }}>
                <div style={{ fontSize: '11px', color: T.slate, fontWeight: 500 }}>Total Chapters</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: T.navy }}>{activeSubject.chapters?.length || 0}</div>
              </div>
              <div style={{ padding: '12px', background: T.blueBg, borderRadius: '8px', border: '1px solid #c2e2fa' }}>
                <div style={{ fontSize: '11px', color: T.blueText, fontWeight: 600 }}>Currently Active</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: T.blueText }}>{inProgressChapters.length}</div>
              </div>
              <div style={{ padding: '12px', background: T.greenBg, borderRadius: '8px', border: '1px solid #b7e3a3' }}>
                <div style={{ fontSize: '11px', color: T.greenDark, fontWeight: 600 }}>Completed</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: T.greenDark }}>{completedChapters.length}</div>
              </div>
              <div style={{ padding: '12px', background: T.amberBg, borderRadius: '8px', border: '1px solid #fde68a' }}>
                <div style={{ fontSize: '11px', color: T.amberText, fontWeight: 600 }}>Upcoming</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: T.amberText }}>{upcomingChapters.length}</div>
              </div>
            </div>
          </div>

          {/* SECTION 1: 🟢 Ongoing Active Chapters */}
          <div
            style={{
              background: T.white,
              border: `1px solid ${T.border}`,
              borderRadius: '12px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '16px 20px',
                background: '#f8fafc',
                borderBottom: `1px solid ${T.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: '#10b981',
                    boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.2)',
                  }}
                />
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: T.navy }}>
                  1. Ongoing Active Chapters (Currently in Progress)
                </h3>
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '3px 8px',
                  borderRadius: '100px',
                  background: T.blueBg,
                  color: T.blueText,
                }}
              >
                {inProgressChapters.length} Active
              </span>
            </div>

            {inProgressChapters.length === 0 ? (
              <div style={{ padding: '24px 20px', fontSize: '13px', color: T.slate, textAlign: 'center' }}>
                No active chapter currently in progress for this subject.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {inProgressChapters.map((ch: any, idx: number) => (
                  <div
                    key={ch.id || idx}
                    style={{
                      padding: '18px 20px',
                      borderBottom: idx === inProgressChapters.length - 1 ? 'none' : `1px solid ${T.border}`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      background: '#fcfeff',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: T.blueBg,
                            color: T.blueText,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '13px',
                            flexShrink: 0,
                          }}
                        >
                          {ch.number}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '11px', fontWeight: 600, color: T.slate, textTransform: 'uppercase' }}>
                              {ch.unit || 'Unit'}
                            </span>
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 600,
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: T.amberBg,
                                color: T.amberText,
                              }}
                            >
                              Target: Week {ch.expectedWeek}
                            </span>
                          </div>
                          <h4 style={{ margin: '3px 0 0', fontSize: '15px', fontWeight: 600, color: T.navy }}>
                            {ch.title}
                          </h4>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: '100px',
                            fontSize: '11px',
                            fontWeight: 600,
                            background: T.blueBg,
                            color: T.blueText,
                          }}
                        >
                          In Progress ({ch.progress}%)
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ width: '100%', height: '6px', background: T.track, borderRadius: '6px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          background: T.blue,
                          width: `${ch.progress}%`,
                          borderRadius: '6px',
                        }}
                      />
                    </div>

                    {/* Learning Outcomes */}
                    {ch.learningOutcomes && ch.learningOutcomes.length > 0 && (
                      <div style={{ background: T.pageBg, padding: '10px 14px', borderRadius: '8px', fontSize: '12px', color: T.slate }}>
                        <strong style={{ color: T.navy, fontWeight: 600 }}>Key Learning Topics: </strong>
                        {Array.isArray(ch.learningOutcomes) ? ch.learningOutcomes.join(', ') : String(ch.learningOutcomes)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 2: ⏳ Upcoming Chapters Roadmap */}
          <div
            style={{
              background: T.white,
              border: `1px solid ${T.border}`,
              borderRadius: '12px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '16px 20px',
                background: '#f8fafc',
                borderBottom: `1px solid ${T.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={16} color={T.slate} />
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: T.navy }}>
                  2. Upcoming Syllabus Roadmap
                </h3>
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '3px 8px',
                  borderRadius: '100px',
                  background: T.chip,
                  color: T.slate,
                }}
              >
                {upcomingChapters.length} Ahead
              </span>
            </div>

            {upcomingChapters.length === 0 ? (
              <div style={{ padding: '24px 20px', fontSize: '13px', color: T.slate, textAlign: 'center' }}>
                No pending upcoming chapters.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {upcomingChapters.map((ch: any, idx: number) => (
                  <div
                    key={ch.id || idx}
                    style={{
                      padding: '16px 20px',
                      borderBottom: idx === upcomingChapters.length - 1 ? 'none' : `1px solid ${T.border}`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: T.pageBg,
                          border: `1px solid ${T.border}`,
                          color: T.slate,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 600,
                          fontSize: '13px',
                          flexShrink: 0,
                        }}
                      >
                        {ch.number}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 600, color: T.slate, textTransform: 'uppercase' }}>
                            {ch.unit || 'Unit'}
                          </span>
                        </div>
                        <h4 style={{ margin: '2px 0 0', fontSize: '14px', fontWeight: 600, color: T.navy }}>
                          {ch.title}
                        </h4>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 500,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: T.chip,
                          color: T.slate,
                        }}
                      >
                        Target: Week {ch.expectedWeek}
                      </span>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: '#f1f5f9',
                          color: '#475569',
                        }}
                      >
                        Upcoming
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 3: ✅ Completed Chapters */}
          <div
            style={{
              background: T.white,
              border: `1px solid ${T.border}`,
              borderRadius: '12px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '16px 20px',
                background: '#f8fafc',
                borderBottom: `1px solid ${T.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} color={T.green} />
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: T.navy }}>
                  3. Completed Chapters
                </h3>
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '3px 8px',
                  borderRadius: '100px',
                  background: T.greenBg,
                  color: T.greenDark,
                }}
              >
                {completedChapters.length} Finished
              </span>
            </div>

            {completedChapters.length === 0 ? (
              <div style={{ padding: '24px 20px', fontSize: '13px', color: T.slate, textAlign: 'center' }}>
                No chapters marked as completed yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {completedChapters.map((ch: any, idx: number) => (
                  <div
                    key={ch.id || idx}
                    style={{
                      padding: '16px 20px',
                      borderBottom: idx === completedChapters.length - 1 ? 'none' : `1px solid ${T.border}`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '12px',
                      background: '#fcfefc',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: T.greenBg,
                          color: T.greenDark,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '13px',
                          flexShrink: 0,
                        }}
                      >
                        <Check size={16} />
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: T.slate, textTransform: 'uppercase' }}>
                          {ch.unit || 'Unit'} &bull; Ch {ch.number}
                        </span>
                        <h4 style={{ margin: '2px 0 0', fontSize: '14px', fontWeight: 600, color: T.navy }}>
                          {ch.title}
                        </h4>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '3px 9px',
                          borderRadius: '100px',
                          background: T.greenBg,
                          color: T.greenDark,
                        }}
                      >
                        100% Covered
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

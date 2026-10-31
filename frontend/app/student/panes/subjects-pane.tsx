'use client';

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  CheckCircle2,
  TrendingUp,
  Layers,
  ChevronRight,
  User,
  Award,
  Video,
  FileText,
  X,
  ExternalLink,
  ArrowLeft,
} from 'lucide-react';
import { getStudentSubjects, getStudentLectures, getStudentAssignments } from '../../edops-api';
import { StudentTab } from '../types';

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
  skyBg: '#d0e6ff',
  skyDark: '#0a3a7a',
};

interface SubjectsPaneProps {
  organizationId: string;
  onNavigateTab: (tab: StudentTab) => void;
}

export const SubjectsPane: React.FC<SubjectsPaneProps> = ({ organizationId, onNavigateTab }) => {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<any | null>(null);
  const [lectures, setLectures] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [selectedLecture, setSelectedLecture] = useState<any | null>(null);
  const [readerLecture, setReaderLecture] = useState<any | null>(null);
  const [archiveViewSubject, setArchiveViewSubject] = useState<any | null>(null);
  const [inspectedLectureId, setInspectedLectureId] = useState<string | null>(null);

  useEffect(() => {
    loadSubjects();
    loadLectures();
    loadAssignments();
  }, [organizationId]);

  const loadAssignments = async () => {
    try {
      const res = await getStudentAssignments(organizationId);
      setAssignments(res?.assignments || []);
    } catch {
      setAssignments([]);
    }
  };

  const loadLectures = async () => {
    try {
      const res = await getStudentLectures(organizationId);
      setLectures(res?.lectures || []);
    } catch {
      setLectures([]);
    }
  };

  const loadSubjects = async () => {
    setLoading(true);
    try {
      const res = await getStudentSubjects(organizationId);
      const list = res?.subjects || [];
      setSubjects(list);
      if (list.length > 0) setSelectedSubject(list[0]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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
          Loading prescribed subjects...
        </p>
      </div>
    );
  }

  // Full-Page Master-Detail Lecture Archive (Same format as teacher view)
  if (archiveViewSubject) {
    const subjectLectures = lectures.filter(
      (l) =>
        l.subjectName?.toLowerCase() === archiveViewSubject.name?.toLowerCase() ||
        archiveViewSubject.name?.toLowerCase().includes(l.subjectName?.toLowerCase())
    );
    const activeLec = inspectedLectureId
      ? subjectLectures.find((l) => l.id === inspectedLectureId) || subjectLectures[0]
      : subjectLectures[0];

    const resourceUrl = activeLec?.resources || '';
    const isWebUrl = resourceUrl.startsWith('http://') || resourceUrl.startsWith('https://');

    // Linked official assignments for this subject
    const linkedAssignments = assignments.filter((a: any) =>
      a.subject?.toLowerCase() === archiveViewSubject.name?.toLowerCase() ||
      archiveViewSubject.name?.toLowerCase().includes(a.subject?.toLowerCase())
    );

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontFamily: "'Poppins', sans-serif" }}>
        {/* Top Navigation Strip */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: T.white, border: `1px solid ${T.border}`, borderRadius: '8px', padding: '14px 20px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              type="button"
              onClick={() => {
                setArchiveViewSubject(null);
                setInspectedLectureId(null);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '6px',
                border: `1px solid ${T.border}`,
                background: T.chip,
                color: T.navy,
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <ArrowLeft size={15} /> Back to Subjects
            </button>
            <div style={{ borderLeft: `1px solid ${T.border}`, paddingLeft: '14px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: T.blue, textTransform: 'uppercase' }}>
                {archiveViewSubject.name} • Classroom Lectures &amp; Notes Vault
              </div>
              <h2 style={{ margin: '2px 0 0', fontSize: '17px', fontWeight: 700, color: T.navy }}>
                {activeLec ? activeLec.topic : 'Subject Lecture Archive'}
              </h2>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: T.slate, background: T.chip, padding: '5px 12px', borderRadius: '6px', border: `1px solid ${T.border}` }}>
              Instructor: {archiveViewSubject.teacherName || activeLec?.teacherName || 'Subject Teacher'}
            </span>
          </div>
        </div>

        {/* Master-Detail Canvas */}
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '16px', alignItems: 'start' }}>
          {/* Master List of Sessions (Left) */}
          <div
            style={{
              background: T.white,
              border: `1px solid ${T.border}`,
              borderRadius: '8px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              maxHeight: 'calc(100vh - 180px)',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px', borderBottom: `1px solid ${T.border}` }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: T.navy, textTransform: 'uppercase' }}>
                Class Sessions ({subjectLectures.length})
              </span>
              <span style={{ fontSize: '11px', color: T.slate }}>
                Chronological
              </span>
            </div>

            {subjectLectures.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: T.slate, fontSize: '12px', fontStyle: 'italic' }}>
                No lectures logged yet for this subject.
              </div>
            ) : (
              subjectLectures.map((lec: any) => {
                const isActive = activeLec?.id === lec.id;
                return (
                  <div
                    key={lec.id}
                    onClick={() => setInspectedLectureId(lec.id)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: isActive ? `2px solid ${T.navy}` : `1px solid ${T.border}`,
                      background: isActive ? T.chip : T.white,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12.5px', fontWeight: 700, color: T.navy, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {lec.topic}
                      </span>
                      <ChevronRight size={14} color={isActive ? T.navy : T.slate} />
                    </div>
                    <div style={{ fontSize: '11px', color: T.slate, display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span>{lec.date}</span>
                      {lec.periodInfo && (
                        <span style={{ fontSize: '10px', fontWeight: 600, background: T.chip, color: T.navy, padding: '1px 5px', borderRadius: '4px', border: `1px solid ${T.border}` }}>
                          {lec.periodInfo}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                      {lec.homework && (
                        <span style={{ fontSize: '9.5px', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', background: '#fef3c7', color: '#92400e' }}>
                          Homework
                        </span>
                      )}
                      {lec.resources ? (
                        <span style={{ fontSize: '9.5px', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', background: T.skyBg, color: T.skyDark }}>
                          Study Material
                        </span>
                      ) : (
                        <span style={{ fontSize: '9.5px', color: T.slate, background: T.chip, padding: '2px 6px', borderRadius: '4px' }}>
                          Whiteboard only
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right: Side-by-Side Canvas */}
          {activeLec ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px', alignItems: 'start' }}>
              {/* Left Sub-Column: Study Material & Document View */}
              <div
                style={{
                  background: T.white,
                  border: `1px solid ${T.border}`,
                  borderRadius: '8px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: '620px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                }}
              >
                <div
                  style={{
                    padding: '10px 16px',
                    background: T.chip,
                    borderBottom: `1px solid ${T.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 600, color: T.navy }}>
                    <FileText size={15} color={T.blue} />
                    <span>Study Material &amp; Document View</span>
                  </div>
                  {resourceUrl && (
                    <a
                      href={isWebUrl ? resourceUrl : `/${resourceUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: T.blue,
                        textDecoration: 'none',
                      }}
                    >
                      <ExternalLink size={12} /> Open in New Tab
                    </a>
                  )}
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
                  {resourceUrl ? (
                    isWebUrl || resourceUrl.endsWith('.pdf') || resourceUrl.includes('/') || resourceUrl.startsWith('data:') ? (
                      <iframe
                        src={isWebUrl ? resourceUrl : `/${resourceUrl}`}
                        title="Lecture Document"
                        style={{
                          width: '100%',
                          height: '100%',
                          minHeight: '580px',
                          border: 'none',
                          display: 'block',
                          background: '#525659',
                        }}
                      />
                    ) : (
                      <div style={{ padding: '32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                        <FileText size={36} color={T.navy} />
                        <h4 style={{ margin: '12px 0 4px', fontSize: '15px', color: T.navy }}>{resourceUrl}</h4>
                        <span style={{ fontSize: '12px', color: T.slate }}>Document attached by teacher for this session.</span>
                      </div>
                    )
                  ) : (
                    /* SVG Illustration when no study material is available */
                    <div
                      style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '48px 24px',
                        textAlign: 'center',
                        background: T.pageBg,
                      }}
                    >
                      <div
                        style={{
                          marginBottom: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <svg width="220" height="160" viewBox="0 0 220 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="70" y="24" width="95" height="18" rx="9" fill="#E2E8F0" />
                          <rect x="35" y="46" width="145" height="34" rx="17" fill="#F1F5F9" />
                          <rect x="30" y="96" width="155" height="38" rx="19" fill="#F1F5F9" />
                          <line x1="48" y1="16" x2="44" y2="24" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />
                          <line x1="32" y1="28" x2="42" y2="28" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />
                          <line x1="38" y1="40" x2="45" y2="34" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />
                          <path
                            d="M72 32H120C125 32 128 35 128 39V54H58C52 54 48 58 48 64V116C48 120 51 123 55 123H115"
                            stroke="#94A3B8"
                            strokeWidth="2"
                            strokeDasharray="4 4"
                            strokeLinecap="round"
                          />
                          <g transform="translate(68, 48)">
                            <rect x="66" y="66" width="14" height="34" rx="4" transform="rotate(-45 66 66)" fill="#94A3B8" />
                            <rect x="65" y="65" width="6" height="10" rx="1" transform="rotate(-45 65 65)" fill="#CBD5E1" />
                            <circle cx="42" cy="42" r="38" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="5" />
                            <circle cx="42" cy="42" r="32" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="2" />
                            <text
                              x="42"
                              y="52"
                              textAnchor="middle"
                              fontSize="32"
                              fontWeight="700"
                              fontFamily="system-ui, -apple-system, sans-serif"
                              fill="#94A3B8"
                            >
                              ?
                            </text>
                          </g>
                        </svg>
                      </div>
                      <h4 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 700, color: T.navy }}>
                        No Document Uploaded for this Period
                      </h4>
                      <p style={{ margin: 0, fontSize: '12.5px', color: T.slate, maxWidth: '340px', lineHeight: 1.55 }}>
                        This session was conducted via whiteboard &amp; verbal discussion. Review teacher notes and homework on the right.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Sub-Column: Notes, Homework & Linked Assignments */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Classroom Notes & Key Concepts */}
                <div
                  style={{
                    background: T.white,
                    border: `1px solid ${T.border}`,
                    borderRadius: '8px',
                    padding: '18px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <BookOpen size={16} color={T.blue} />
                    <span style={{ fontSize: "12px", fontWeight: 700, color: T.navy, textTransform: "uppercase" }}>
                      Key Concepts &amp; Classroom Notes
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: '13px',
                      color: T.navy,
                      lineHeight: 1.65,
                      whiteSpace: 'pre-wrap',
                      background: T.chip,
                      padding: '14px',
                      borderRadius: '6px',
                      border: `1px solid ${T.border}`,
                    }}
                  >
                    {activeLec.notes || 'No additional concept notes recorded by the teacher for this session.'}
                  </div>
                </div>

                {/* Homework Assigned */}
                {activeLec.homework && (
                  <div
                    style={{
                      background: '#fffbeb',
                      border: '1px solid #fef3c7',
                      borderRadius: '8px',
                      padding: '18px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <CheckCircle2 size={16} color="#b45309" />
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#b45309', textTransform: 'uppercase' }}>
                        Assigned Daily Homework
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: '13px',
                        color: '#92400e',
                        lineHeight: 1.6,
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {activeLec.homework}
                    </div>
                  </div>
                )}

                {/* Linked Official School Assignments */}
                {linkedAssignments.length > 0 && (
                  <div
                    style={{
                      background: T.white,
                      border: `1px solid ${T.border}`,
                      borderRadius: '8px',
                      padding: '18px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: T.navy, textTransform: 'uppercase' }}>
                        Linked Coursework &amp; Tasks ({linkedAssignments.length})
                      </span>
                      <span style={{ fontSize: '10.5px', color: T.slate }}>
                        Assigned for this Subject
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {linkedAssignments.slice(0, 3).map((asg: any) => {
                        const isSubmitted = asg.status === 'submitted' || asg.status === 'evaluated' || asg.status === 'graded';
                        return (
                          <div
                            key={asg.id}
                            style={{
                              padding: '12px 14px',
                              borderRadius: '6px',
                              border: `1px solid ${T.border}`,
                              background: T.chip,
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '6px',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                              <span style={{ fontSize: '13px', fontWeight: 600, color: T.navy }}>
                                {asg.title}
                              </span>
                              <span
                                style={{
                                  fontSize: '10px',
                                  fontWeight: 600,
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  background: isSubmitted ? '#dcfce7' : '#fee2e2',
                                  color: isSubmitted ? '#166534' : '#991b1b',
                                }}
                              >
                                {isSubmitted ? 'Submitted' : 'Pending'}
                              </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: T.slate }}>
                              <span>Due: {asg.dueDate || 'Standard Term Deadline'}</span>
                              <button
                                type="button"
                                onClick={() => onNavigateTab('assignments')}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: T.blue,
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  padding: 0,
                                  textDecoration: 'underline',
                                }}
                              >
                                Open &amp; Submit →
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Session Info card */}
                <div
                  style={{
                    background: T.chip,
                    border: `1px solid ${T.border}`,
                    borderRadius: '8px',
                    padding: '14px 18px',
                    fontSize: '12px',
                    color: T.slate,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <span style={{ fontSize: '10px', fontWeight: 700, color: T.slate, textTransform: 'uppercase' }}>
                    Session Info
                  </span>
                  <div><strong>Subject:</strong> {archiveViewSubject.name}</div>
                  <div><strong>Instructor:</strong> {archiveViewSubject.teacherName || activeLec.teacherName || 'Subject Teacher'}</div>
                  <div><strong>Date:</strong> {activeLec.date}</div>
                  {activeLec.periodInfo && <div><strong>Timetable Period:</strong> {activeLec.periodInfo}</div>}
                  <div><strong>Topic:</strong> {activeLec.topic}</div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  // Full-Page Inside App Reader Mode
  if (readerLecture) {
    const resourceUrl = readerLecture.resources || '';
    const isWebUrl = resourceUrl.startsWith('http://') || resourceUrl.startsWith('https://');

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          width: '100%',
        }}
      >
        {/* Reader Top Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: T.white,
            border: `1px solid ${T.border}`,
            borderRadius: '8px',
            padding: '12px 20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setReaderLecture(null)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '6px',
                border: `1px solid ${T.border}`,
                background: T.chip,
                color: T.navy,
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <ArrowLeft size={15} /> Back to Subject
            </button>
            <div style={{ borderLeft: `1px solid ${T.border}`, paddingLeft: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: T.blue, textTransform: 'uppercase' }}>
                  {readerLecture.classSection || selectedSubject?.name} • {readerLecture.subjectName || selectedSubject?.name}
                </span>
                <span style={{ fontSize: '11px', color: T.slate }}>
                  • {readerLecture.date} • Conducted by {readerLecture.teacherName || 'Subject Teacher'}
                </span>
              </div>
              <h2 style={{ margin: '2px 0 0', fontSize: '16px', fontWeight: 700, color: T.navy }}>
                {readerLecture.topic}
              </h2>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {resourceUrl && (
              <a
                href={isWebUrl ? resourceUrl : `/${resourceUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  borderRadius: '6px',
                  border: `1px solid ${T.border}`,
                  background: T.white,
                  color: T.slate,
                  fontSize: '12px',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                <ExternalLink size={13} /> Open in External Window
              </a>
            )}
          </div>
        </div>

        {/* Reader Full Page Workspace: Embed Viewer + Side Notes */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 340px',
            gap: '16px',
            alignItems: 'start',
          }}
        >
          {/* Main Document Viewer Container */}
          <div
            style={{
              background: T.white,
              border: `1px solid ${T.border}`,
              borderRadius: '8px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              minHeight: '680px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            {/* Document Viewer Title Strip */}
            <div
              style={{
                padding: '10px 16px',
                background: T.chip,
                borderBottom: `1px solid ${T.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 600, color: T.navy }}>
                <FileText size={15} color={T.blue} />
                <span>Document &amp; Notes Reader (Full Page)</span>
              </div>
              <span style={{ fontSize: '11px', color: T.slate }}>
                In-App Reader Mode
              </span>
            </div>

            {/* Document Body */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
              {isWebUrl || resourceUrl.endsWith('.pdf') || resourceUrl.includes('/') ? (
                <iframe
                  src={isWebUrl ? resourceUrl : `/${resourceUrl}`}
                  title="Document Preview"
                  style={{
                    width: '100%',
                    height: '100%',
                    minHeight: '640px',
                    border: 'none',
                    display: 'block',
                    background: '#525659',
                  }}
                />
              ) : (
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '48px 24px',
                    textAlign: 'center',
                    background: T.pageBg,
                  }}
                >
                  <div
                    style={{
                      width: '88px',
                      height: '88px',
                      borderRadius: '50%',
                      background: T.white,
                      border: `1px solid ${T.border}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '16px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    }}
                  >
                    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                      <path d="M6 6h10" />
                      <path d="M6 10h10" />
                      <path d="M6 14h6" />
                    </svg>
                  </div>
                  <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 700, color: T.navy }}>
                    {resourceUrl || 'No Document Attached for this Period'}
                  </h3>
                  <p style={{ margin: '0 0 20px', fontSize: '12.5px', color: T.slate, maxWidth: '440px', lineHeight: 1.6 }}>
                    This class session was conducted via interactive whiteboard &amp; discussion. Review key formulas and assigned homework on the right.
                  </p>
                  {resourceUrl && (
                    <a
                      href={resourceUrl.startsWith('http') ? resourceUrl : `/${resourceUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '10px 20px',
                        borderRadius: '6px',
                        background: T.navy,
                        color: '#ffffff',
                        fontSize: '13px',
                        fontWeight: 600,
                        textDecoration: 'none',
                      }}
                    >
                      <ExternalLink size={15} /> Access Document Asset
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Side Panel: Teacher Lecture Notes & Assigned Homework */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Notes Card */}
            <div
              style={{
                background: T.white,
                border: `1px solid ${T.border}`,
                borderRadius: '8px',
                padding: '18px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
            >
              <span style={{ fontSize: '11px', fontWeight: 700, color: T.slate, textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                Classroom Notes &amp; Highlights
              </span>
              <div style={{ fontSize: '13px', color: T.navy, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {readerLecture.notes || 'No extra notes recorded for this lecture.'}
              </div>
            </div>

            {/* Homework Card */}
            {readerLecture.homework && (
              <div
                style={{
                  background: '#fffbeb',
                  border: '1px solid #fef3c7',
                  borderRadius: '8px',
                  padding: '18px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                }}
              >
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#b45309', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                  Assigned Homework
                </span>
                <div style={{ fontSize: '13px', color: '#92400e', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {readerLecture.homework}
                </div>
              </div>
            )}

            {/* Session Summary Card */}
            <div
              style={{
                background: T.chip,
                border: `1px solid ${T.border}`,
                borderRadius: '8px',
                padding: '14px 18px',
                fontSize: '12px',
                color: T.slate,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <span style={{ fontSize: '10px', fontWeight: 700, color: T.slate, textTransform: 'uppercase' }}>
                Class Session Info
              </span>
              <div><strong>Conducted By:</strong> {readerLecture.teacherName || 'Subject Teacher'}</div>
              <div><strong>Date:</strong> {readerLecture.date}</div>
              <div><strong>Topic:</strong> {readerLecture.topic}</div>
              {readerLecture.resources && (
                <div style={{ wordBreak: 'break-all' }}>
                  <strong>Attached Asset:</strong> {readerLecture.resources}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            Academic Portfolio
          </span>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: T.navy }}>
            Enrolled Subjects &amp; Curriculum Tracks
          </h2>
          <p style={{ margin: 0, fontSize: '13px', color: T.slate }}>
            NCERT Curriculum • Academic Year 2026–2027 • Class Section Term Enrollment
          </p>
        </div>
      </div>

      {/* 2. Subjects Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '16px',
        }}
      >
        {subjects.map((sub) => {
          const isSelected = selectedSubject?.id === sub.id;
          return (
            <div
              key={sub.id}
              onClick={() => setSelectedSubject(sub)}
              style={{
                background: T.white,
                border: `2px solid ${isSelected ? T.navy : T.border}`,
                borderRadius: '10px',
                padding: '20px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                boxShadow: isSelected ? '0 4px 12px rgba(12, 30, 51, 0.08)' : 'none',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      color: T.blue,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {sub.code}
                  </span>
                  <h3 style={{ margin: '2px 0 0', fontSize: '16px', fontWeight: 700, color: T.navy }}>
                    {sub.name}
                  </h3>
                </div>
                <div
                  style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    background: T.chip,
                    fontSize: '11px',
                    fontWeight: 600,
                    color: T.slate,
                  }}
                >
                  Grade {sub.grade || 'A'}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: T.slate }}>
                <User size={14} color={T.slate} />
                <span>{sub.teacher}</span>
              </div>

              {/* Progress Mini Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '8px',
                  background: T.chip,
                  padding: '10px',
                  borderRadius: '6px',
                  textAlign: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: T.navy }}>{sub.attendanceRate}%</div>
                  <div style={{ fontSize: '10px', color: T.slate }}>Attendance</div>
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: T.navy }}>{sub.assignmentsCompleted}%</div>
                  <div style={{ fontSize: '10px', color: T.slate }}>Homework</div>
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: T.navy }}>{sub.curriculumProgress}%</div>
                  <div style={{ fontSize: '10px', color: T.slate }}>Curriculum</div>
                </div>
              </div>

              {/* Current Topic Strip */}
              <div
                style={{
                  background: T.pageBg,
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  color: T.slate,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                <strong style={{ color: T.navy }}>Topic:</strong> {sub.currentTopic || 'Instruction in progress'}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Selected Subject Detail Card */}
      {selectedSubject && (
        <div
          style={{
            background: T.white,
            border: `1px solid ${T.border}`,
            borderRadius: '10px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', paddingBottom: '16px', borderBottom: `1px solid ${T.border}` }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '10px', fontWeight: 600, color: T.slate, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Active Learning Track
              </span>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: T.navy }}>
                {selectedSubject.name} ({selectedSubject.code})
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: T.slate }}>
                Faculty: <strong style={{ color: T.navy }}>{selectedSubject.teacher}</strong> {selectedSubject.teacherEmail ? `• ${selectedSubject.teacherEmail}` : ''}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                onClick={() => onNavigateTab('resources')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 16px',
                  border: `1px solid ${T.line}`,
                  borderRadius: '6px',
                  background: T.white,
                  fontSize: '13px',
                  fontWeight: 600,
                  color: T.navy,
                  cursor: 'pointer',
                  fontFamily: "'Poppins', sans-serif",
                }}
              >
                Study Material
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('assignments')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 18px',
                  border: `1px solid ${T.navy}`,
                  borderRadius: '6px',
                  background: T.navy,
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontFamily: "'Poppins', sans-serif",
                }}
              >
                Subject Homework
              </button>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '12px',
            }}
          >
            <div
              style={{
                padding: '16px',
                background: T.pageBg,
                border: `1px solid ${T.border}`,
                borderRadius: '6px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', color: T.slate }}>
                Current Chapter
              </span>
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: T.navy }}>
                {selectedSubject.currentTopic || 'NCERT Curriculum Module'}
              </h4>
              <p style={{ margin: 0, fontSize: '12px', color: T.slate }}>Instruction in session</p>
            </div>

            <div
              style={{
                padding: '16px',
                background: T.pageBg,
                border: `1px solid ${T.border}`,
                borderRadius: '6px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', color: T.slate }}>
                Learning Outcomes
              </span>
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: T.navy }}>
                {selectedSubject.learningOutcomesAchieved || 12} of {selectedSubject.totalLearningOutcomes || 16} LOs
              </h4>
              <p style={{ margin: 0, fontSize: '12px', color: T.slate }}>Verified through assessments</p>
            </div>

            <div
              style={{
                padding: '16px',
                background: T.pageBg,
                border: `1px solid ${T.border}`,
                borderRadius: '6px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', color: T.slate }}>
                Classroom Pacing
              </span>
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: T.greenDark }}>
                On Schedule (NCERT)
              </h4>
              <p style={{ margin: 0, fontSize: '12px', color: T.slate }}>Academic Year 2026–2027</p>
            </div>
          </div>

          {/* Daily Classroom Lectures List for Selected Subject */}
          {(() => {
            const subjectLectures = lectures.filter(
              (l) => l.subjectName?.toLowerCase() === selectedSubject.name?.toLowerCase() || selectedSubject.name?.toLowerCase().includes(l.subjectName?.toLowerCase())
            );
            const todayStr = new Date().toISOString().slice(0, 10);
            const todayLectures = subjectLectures.filter((l) => l.date === todayStr);

            return (
              <div style={{ marginTop: '14px', borderTop: `1px solid ${T.border}`, paddingTop: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: T.navy }}>
                        Today&apos;s Classroom Session
                      </h4>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: T.navy, background: T.chip, padding: '2px 8px', borderRadius: '6px', border: `1px solid ${T.border}` }}>
                        Today • {todayStr}
                      </span>
                    </div>
                    <p style={{ margin: '2px 0 0', fontSize: '11px', color: T.slate }}>
                      Daily period instruction for {selectedSubject.name} • Resets every morning
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setArchiveViewSubject(selectedSubject);
                      setInspectedLectureId(subjectLectures[0]?.id || null);
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 14px',
                      borderRadius: '6px',
                      background: T.white,
                      color: T.navy,
                      fontSize: '12px',
                      fontWeight: 600,
                      border: `1px solid ${T.border}`,
                      cursor: 'pointer',
                    }}
                  >
                    <BookOpen size={13} /> Complete Lecture Archive ({subjectLectures.length}) →
                  </button>
                </div>

                {/* Today's Lecture Item */}
                {todayLectures.length === 0 ? (
                  <div
                    style={{
                      padding: '20px',
                      textAlign: 'center',
                      color: T.slate,
                      background: T.chip,
                      borderRadius: '8px',
                      fontSize: '12px',
                      border: `1px dashed ${T.border}`,
                    }}
                  >
                    <div style={{ fontWeight: 600, color: T.navy }}>
                      No classroom session recorded for {selectedSubject.name} today ({todayStr}).
                    </div>
                    <span style={{ fontSize: '11.5px', marginTop: '4px', display: 'block' }}>
                      Check back after your scheduled period, or view previous sessions in the complete archive above.
                    </span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {todayLectures.map((lec: any) => (
                      <div
                        key={lec.id}
                        onClick={() => {
                          setArchiveViewSubject(selectedSubject);
                          setInspectedLectureId(lec.id);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 16px',
                          background: T.white,
                          border: `1px solid ${T.border}`,
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.borderColor = T.navy)}
                        onMouseLeave={(e) => (e.currentTarget.style.borderColor = T.border)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: T.chip, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.navy, flexShrink: 0 }}>
                            <FileText size={16} />
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontWeight: 600, color: T.navy, fontSize: '13px' }}>
                                {lec.topic}
                              </span>
                              {lec.periodInfo && (
                                <span style={{ fontSize: '10px', fontWeight: 700, background: T.skyBg, color: T.skyDark, padding: '1px 6px', borderRadius: '4px' }}>
                                  {lec.periodInfo}
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '11px', color: T.slate }}>
                              Conducted Today by {lec.teacherName || 'Subject Teacher'}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {lec.homework && (
                            <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', background: '#fef3c7', color: '#92400e' }}>
                              Homework Attached
                            </span>
                          )}
                          {lec.resources ? (
                            <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', background: T.skyBg, color: T.skyDark }}>
                              Study Material
                            </span>
                          ) : (
                            <span style={{ fontSize: '10px', color: T.slate, background: T.chip, padding: '2px 8px', borderRadius: '4px' }}>
                              Whiteboard only
                            </span>
                          )}
                          <span style={{ fontSize: '11px', color: T.blue, fontWeight: 600 }}>
                            Open Session →
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Lecture Details Drawer */}
      {selectedLecture && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(12, 30, 51, 0.55)',
            backdropFilter: 'blur(2px)',
            zIndex: 1000,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedLecture(null);
          }}
        >
          <aside
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              height: '100%',
              width: 'min(580px, 100vw)',
              background: T.white,
              boxShadow: '-12px 0 30px rgba(0,0,0,0.18)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '18px 24px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: T.blue, textTransform: 'uppercase' }}>
                  {selectedLecture.classSection} • {selectedLecture.subjectName}
                </span>
                <h3 style={{ margin: '4px 0 0', fontSize: '17px', fontWeight: 700, color: T.navy }}>
                  {selectedLecture.topic}
                </h3>
                <span style={{ fontSize: '12px', color: T.slate }}>
                  Conducted by {selectedLecture.teacherName} on {selectedLecture.date}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLecture(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: T.slate, padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ background: T.chip, padding: '16px', borderRadius: '8px', border: `1px solid ${T.border}` }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: T.slate, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                  Classroom Notes &amp; Highlights
                </span>
                <div style={{ fontSize: '13px', color: T.navy, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {selectedLecture.notes || 'No extra notes recorded for this lecture.'}
                </div>
              </div>

              {selectedLecture.homework && (
                <div style={{ background: '#fffbeb', padding: '16px', borderRadius: '8px', border: '1px solid #fef3c7' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#b45309', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    Assigned Homework
                  </span>
                  <div style={{ fontSize: '13px', color: '#92400e', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                    {selectedLecture.homework}
                  </div>
                </div>
              )}

              {selectedLecture.resources && (
                <div style={{ background: T.skyBg, padding: '16px', borderRadius: '8px', border: `1px solid ${T.line}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: T.skyDark, textTransform: 'uppercase' }}>
                      Study Material &amp; Resources
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setReaderLecture(selectedLecture);
                        setSelectedLecture(null);
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '5px 12px',
                        borderRadius: '6px',
                        background: T.navy,
                        color: '#ffffff',
                        border: 'none',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <BookOpen size={12} /> Open Full Page Inside App
                    </button>
                  </div>
                  <div style={{ fontSize: '13px', color: T.skyDark, wordBreak: 'break-all' }}>
                    {selectedLecture.resources}
                  </div>
                </div>
              )}
            </div>

            <div style={{ padding: '14px 24px', borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'flex-end', background: '#f8fafc', flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => setSelectedLecture(null)}
                style={{ padding: '8px 18px', borderRadius: '6px', border: `1px solid ${T.border}`, background: T.white, fontSize: '12px', fontWeight: 600, color: T.navy, cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};

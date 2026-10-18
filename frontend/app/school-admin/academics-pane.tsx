'use client';
import React, { useEffect, useState } from 'react';
import {
  getSchoolAdminAcademics,
  getSchoolAdminStudents,
  batchPromoteStudents,
  createSchoolAdminCurriculum,
} from '../edops-api';
import {
  BookOpen,
  Calendar,
  Layers,
  GraduationCap,
  ArrowRight,
  Plus,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Users,
  Award,
  ChevronRight,
} from 'lucide-react';

const S = {
  navy: '#0c1e33',
  slate: '#495d72',
  muted: '#a6abb5',
  faint: '#b3b3b3',
  bg: '#f4f6f7',
  white: '#ffffff',
  border: '#e4e6e9',
  line: '#ced8e5',
  chip: '#f5f6f8',
  greenBg: '#d9eed1',
  green: '#61a249',
  greenDk: '#1a5c0a',
};

export function AcademicsPane({
  organizationId,
  onOpenQuickAction,
}: {
  organizationId?: string;
  onOpenQuickAction: (action: string) => void;
}) {
  const [tab, setTab] = useState<'structure' | 'sections' | 'subjects' | 'curriculum' | 'calendar' | 'promotions'>('structure');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Batch Promotion state
  const [sourceSectionId, setSourceSectionId] = useState('');
  const [targetSectionId, setTargetSectionId] = useState('');
  const [targetYearId, setTargetYearId] = useState('');
  const [action, setAction] = useState<'promote' | 'graduate'>('promote');
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  // Curriculum Chapter form state
  const [showAddChapter, setShowAddChapter] = useState(false);
  const [chapterGrade, setChapterGrade] = useState('');
  const [chapterSubjectId, setChapterSubjectId] = useState('');
  const [chapterSubjectName, setChapterSubjectName] = useState('');
  const [chapterUnit, setChapterUnit] = useState('');
  const [chapterName, setChapterName] = useState('');
  const [chapterWeek, setChapterWeek] = useState('10');
  const [chapterOutcomes, setChapterOutcomes] = useState('');
  const [chapterBusy, setChapterBusy] = useState(false);

  const load = async () => {
    if (!organizationId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const [academics, students] = await Promise.all([
        getSchoolAdminAcademics(organizationId),
        getSchoolAdminStudents(organizationId).catch(() => []),
      ]);
      setData(academics);
      setAllStudents(students || []);
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : 'Unable to load academics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [organizationId]);

  const sections = data?.sections || [];
  const years = data?.academicYears || [];
  const programs = data?.programs || [];
  const subjects = data?.subjects || [];
  const curriculum = data?.curriculum || [];
  const events = data?.events || [];
  const sourceSection = sections.find((s: any) => s.id === sourceSectionId);

  const handleSaveCurriculumChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationId || !chapterGrade || !chapterSubjectName || !chapterName.trim()) return;
    setChapterBusy(true);
    setError('');
    try {
      await createSchoolAdminCurriculum(organizationId, {
        grade: chapterGrade.startsWith('Class ') ? chapterGrade : `Class ${chapterGrade}`,
        subjectId: chapterSubjectId || undefined,
        subjectName: chapterSubjectName,
        unitName: chapterUnit.trim() || 'General Unit',
        chapterName: chapterName.trim(),
        expectedCompletionWeek: Number(chapterWeek) || 10,
        learningOutcomes: chapterOutcomes
          ? chapterOutcomes.split(',').map((s) => s.trim()).filter(Boolean)
          : undefined,
      });
      setNotice(`✓ Saved curriculum chapter "${chapterName.trim()}" for ${chapterGrade}.`);
      setShowAddChapter(false);
      setChapterUnit('');
      setChapterName('');
      setChapterOutcomes('');
      await load();
    } catch (err: any) {
      setError(err?.message || 'Failed to save curriculum chapter');
    } finally {
      setChapterBusy(false);
    }
  };

  const sectionStudents = allStudents.filter((st: any) => {
    if (!sourceSection) return false;
    return st.section === sourceSection.name || st.sectionName === sourceSection.name;
  });

  const handleSourceChange = (secId: string) => {
    setSourceSectionId(secId);
    setNotice('');
    const sec = sections.find((s: any) => s.id === secId);
    if (sec) {
      const matching = allStudents.filter((st: any) => st.section === sec.name || st.sectionName === sec.name);
      setSelectedStudentIds(matching.map((st: any) => st.id || st.userId));
    } else {
      setSelectedStudentIds([]);
    }
  };

  const handleExecutePromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationId || !sourceSectionId || selectedStudentIds.length === 0) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const res = await batchPromoteStudents(organizationId, {
        sourceSectionId,
        targetSectionId: action === 'promote' ? targetSectionId : undefined,
        targetAcademicYearId: action === 'promote' ? targetYearId : undefined,
        action,
        studentUserIds: selectedStudentIds,
      });
      setNotice(`✓ Successfully ${action === 'promote' ? 'promoted' : 'graduated'} ${res.count || selectedStudentIds.length} student(s).`);
      setSourceSectionId('');
      setSelectedStudentIds([]);
      await load();
    } catch (err: any) {
      setError(err?.message || 'Failed to execute batch promotion');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* ── 1. HEADER & ACTION BUTTONS ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: S.navy, letterSpacing: '-0.02em' }}>
            Academic Structure &amp; Curriculum
          </h2>
          <p style={{ margin: '3px 0 0', fontSize: '13px', color: S.slate }}>
            Configure academic years, class sections, board subject registries, and batch promotions.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => onOpenQuickAction('year')}
            style={{
              padding: '8px 14px',
              background: '#FFFFFF',
              border: `1px solid ${S.line}`,
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: 600,
              color: S.navy,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#FAF8F5'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFFFF'; }}
          >
            + Academic Year
          </button>
          <button
            onClick={() => onOpenQuickAction('section')}
            style={{
              padding: '8px 14px',
              background: '#FFFFFF',
              border: `1px solid ${S.line}`,
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: 600,
              color: S.navy,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#FAF8F5'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFFFF'; }}
          >
            + Section
          </button>
          <button
            onClick={() => onOpenQuickAction('subject')}
            style={{
              padding: '8px 14px',
              background: '#FFFFFF',
              border: `1px solid ${S.line}`,
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: 600,
              color: S.navy,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#FAF8F5'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFFFF'; }}
          >
            + Subject
          </button>
          <button
            onClick={() => { setTab('curriculum'); setShowAddChapter(true); }}
            style={{
              padding: '8px 16px',
              background: S.navy,
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#132840'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = S.navy; }}
          >
            <Plus size={15} />
            + Syllabus Chapter
          </button>
        </div>
      </div>

      {/* ── 2. TOP PASTEL STAT CARDS (Strictly 148px) ── */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '12px',
        }}
      >
        {/* Card 1: Sections */}
        <article
          onClick={() => setTab('sections')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '148px',
            padding: '20px',
            background: '#e1d2ff',
            border: '1px solid #e1d2ff',
            borderRadius: '10px',
            color: '#4a0e8f',
            cursor: 'pointer',
            transition: 'transform 0.15s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Active Sections
            </span>
            <Layers size={18} />
          </div>
          <p style={{ margin: 0, fontSize: '36px', fontWeight: 700, lineHeight: 1, color: '#4a0e8f' }}>
            {sections.length}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px' }}>Across {programs.length} Grade Programs</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600 }}>
              View <ArrowRight size={13} />
            </span>
          </div>
        </article>

        {/* Card 2: Subjects */}
        <article
          onClick={() => setTab('subjects')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '148px',
            padding: '20px',
            background: '#ccefbf',
            border: '1px solid #ccefbf',
            borderRadius: '10px',
            color: '#1a5c0a',
            cursor: 'pointer',
            transition: 'transform 0.15s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Core Subjects
            </span>
            <BookOpen size={18} />
          </div>
          <p style={{ margin: 0, fontSize: '36px', fontWeight: 700, lineHeight: 1, color: '#1a5c0a' }}>
            {subjects.length}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px' }}>Course syllabi registered</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600 }}>
              View <ArrowRight size={13} />
            </span>
          </div>
        </article>

        {/* Card 3: Academic Years */}
        <article
          onClick={() => setTab('structure')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '148px',
            padding: '20px',
            background: '#bae5f5',
            border: '1px solid #bae5f5',
            borderRadius: '10px',
            color: '#0a5a7a',
            cursor: 'pointer',
            transition: 'transform 0.15s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Academic Years
            </span>
            <Calendar size={18} />
          </div>
          <p style={{ margin: 0, fontSize: '36px', fontWeight: 700, lineHeight: 1, color: '#0a5a7a' }}>
            {years.length}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px' }}>Current: {years.find((y: any) => y.is_current)?.name || 'Active Session'}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600 }}>
              View <ArrowRight size={13} />
            </span>
          </div>
        </article>

        {/* Card 4: Curriculum Progress */}
        <article
          onClick={() => setTab('curriculum')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '148px',
            padding: '20px',
            background: '#ffd8c7',
            border: '1px solid #ffd8c7',
            borderRadius: '10px',
            color: '#782a00',
            cursor: 'pointer',
            transition: 'transform 0.15s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Curriculum Units
            </span>
            <Award size={18} />
          </div>
          <p style={{ margin: 0, fontSize: '36px', fontWeight: 700, lineHeight: 1, color: '#782a00' }}>
            {curriculum.length > 0 ? curriculum.length : '18'}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px' }}>Tracked learning outcomes</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600 }}>
              View <ArrowRight size={13} />
            </span>
          </div>
        </article>
      </section>

      {/* ── 3. SUBTAB SELECTOR ── */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${S.border}`, paddingBottom: '10px', gap: '6px', overflowX: 'auto' }}>
        {[
          { id: 'structure', label: 'Academic Years' },
          { id: 'sections', label: `Sections & Programs (${sections.length})` },
          { id: 'subjects', label: `Subjects (${subjects.length})` },
          { id: 'curriculum', label: 'Curriculum & LOs' },
          { id: 'calendar', label: 'Academic Calendar' },
          { id: 'promotions', label: 'Batch Rollover & Promotion' },
        ].map((item) => {
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => { setTab(item.id as any); setNotice(''); }}
              style={{
                all: 'unset',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: active ? 700 : 500,
                background: active ? S.navy : 'transparent',
                color: active ? '#ffffff' : S.slate,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (!active) { e.currentTarget.style.background = '#f4f6f7'; e.currentTarget.style.color = S.navy; }
              }}
              onMouseLeave={(e) => {
                if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = S.slate; }
              }}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Feedback Messages */}
      {error && (
        <p role="alert" style={{ margin: 0, padding: '10px 14px', background: '#FEF3F2', border: '1px solid #FECDCA', borderRadius: '8px', color: '#B42318', fontSize: '13px' }}>
          {error} <button onClick={load} style={{ textDecoration: 'underline', marginLeft: '6px', cursor: 'pointer', background: 'none', border: 'none', color: '#B42318', fontWeight: 600 }}>Retry</button>
        </p>
      )}
      {notice && (
        <p role="status" style={{ margin: 0, padding: '10px 14px', background: S.greenBg, border: `1px solid ${S.border}`, borderRadius: '8px', color: S.greenDk, fontSize: '13px' }}>
          {notice}
        </p>
      )}

      {/* ── 4. SUBTAB CONTENTS ── */}

      {/* Academic Years */}
      {tab === 'structure' && (
        <div style={{ background: '#FFFFFF', border: `1px solid ${S.border}`, borderRadius: '10px', padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600, color: S.navy }}>
            Institutional Academic Sessions
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${S.border}`, color: S.slate }}>
                  <th style={{ padding: '10px' }}>Academic Session</th>
                  <th style={{ padding: '10px' }}>Start Date</th>
                  <th style={{ padding: '10px' }}>End Date</th>
                  <th style={{ padding: '10px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {years.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: S.slate }}>No academic years registered yet.</td>
                  </tr>
                ) : (
                  years.map((y: any, i: number) => (
                    <tr key={y.id || i} style={{ borderBottom: `1px solid ${S.chip}` }}>
                      <td style={{ padding: '12px 10px', fontWeight: 600, color: S.navy }}>{y.name}</td>
                      <td style={{ padding: '12px 10px', color: S.slate }}>{y.start_date || '—'}</td>
                      <td style={{ padding: '12px 10px', color: S.slate }}>{y.end_date || '—'}</td>
                      <td style={{ padding: '12px 10px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '10px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: y.is_current ? S.greenBg : S.chip,
                          color: y.is_current ? S.greenDk : S.slate,
                        }}>
                          {y.is_current ? 'Active Session' : 'Concluded'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sections */}
      {tab === 'sections' && (
        <div style={{ background: '#FFFFFF', border: `1px solid ${S.border}`, borderRadius: '10px', padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600, color: S.navy }}>
            Class Sections &amp; Capacity
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${S.border}`, color: S.slate }}>
                  <th style={{ padding: '10px' }}>Section</th>
                  <th style={{ padding: '10px' }}>Program / Grade</th>
                  <th style={{ padding: '10px' }}>Max Capacity</th>
                  <th style={{ padding: '10px' }}>Enrolled Count</th>
                  <th style={{ padding: '10px' }}>Capacity Health</th>
                </tr>
              </thead>
              <tbody>
                {sections.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: S.slate }}>No sections registered yet.</td>
                  </tr>
                ) : (
                  sections.map((sec: any, i: number) => {
                    const enrolled = Number(sec.enrolledCount || 0);
                    const cap = Number(sec.capacity || 0);
                    const over = cap > 0 && enrolled > cap;
                    return (
                      <tr key={sec.id || i} style={{ borderBottom: `1px solid ${S.chip}` }}>
                        <td style={{ padding: '12px 10px', fontWeight: 600, color: S.navy }}>Section {sec.name}</td>
                        <td style={{ padding: '12px 10px', color: S.slate }}>{sec.programName || 'Standard'}</td>
                        <td style={{ padding: '12px 10px', color: S.slate }}>{cap > 0 ? `${cap} students` : '—'}</td>
                        <td style={{ padding: '12px 10px', fontWeight: 600, color: S.navy }}>{enrolled}</td>
                        <td style={{ padding: '12px 10px' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '10px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: over ? '#FEF3F2' : S.greenBg,
                            color: over ? '#B42318' : S.greenDk,
                          }}>
                            {over ? 'Over Capacity' : 'Within Limits'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subjects */}
      {tab === 'subjects' && (
        <div style={{ background: '#FFFFFF', border: `1px solid ${S.border}`, borderRadius: '10px', padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600, color: S.navy }}>
            Registered Instructional Subjects
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${S.border}`, color: S.slate }}>
                  <th style={{ padding: '10px' }}>Subject Name</th>
                  <th style={{ padding: '10px' }}>Subject Code</th>
                  <th style={{ padding: '10px' }}>Assigned Faculty</th>
                  <th style={{ padding: '10px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {subjects.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: S.slate }}>No subjects found.</td>
                  </tr>
                ) : (
                  subjects.map((sub: any, i: number) => (
                    <tr key={sub.id || i} style={{ borderBottom: `1px solid ${S.chip}` }}>
                      <td style={{ padding: '12px 10px', fontWeight: 600, color: S.navy }}>{sub.name}</td>
                      <td style={{ padding: '12px 10px', color: S.slate }}>{sub.code || 'SUB'}</td>
                      <td style={{ padding: '12px 10px', color: S.slate }}>{sub.assignedTeachersCount || 0} Faculty members</td>
                      <td style={{ padding: '12px 10px' }}>
                        <span style={{ padding: '3px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 700, background: S.greenBg, color: S.greenDk }}>
                          Active Curriculum
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Curriculum & Learning Outcomes */}
      {tab === 'curriculum' && (
        <div style={{ display: 'grid', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: S.navy }}>Curriculum Syllabus &amp; Learning Outcomes</h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: S.slate }}>Board pacing, expected completion weeks, and tracked syllabus execution.</p>
            </div>
            <button
              onClick={() => {
                setShowAddChapter((v) => !v);
                if (!chapterGrade && programs.length > 0) setChapterGrade(programs[0].name);
                if (!chapterSubjectName && subjects.length > 0) {
                  setChapterSubjectId(subjects[0].id);
                  setChapterSubjectName(subjects[0].name);
                }
              }}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                background: showAddChapter ? '#f4f6f7' : S.navy,
                color: showAddChapter ? S.navy : '#FFFFFF',
                border: `1px solid ${S.border}`,
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {showAddChapter ? '✕ Cancel' : '+ Add Syllabus Chapter'}
            </button>
          </div>

          {showAddChapter && (
            <form onSubmit={handleSaveCurriculumChapter} style={{ background: '#FFFFFF', border: `1px solid ${S.border}`, borderRadius: '10px', padding: '20px', display: 'grid', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <label style={{ display: 'grid', gap: '4px', fontSize: '12px', fontWeight: 600, color: S.navy }}>
                  <span>Class <span style={{ color: '#D92D20' }}>*</span></span>
                  <select
                    required
                    value={chapterGrade}
                    onChange={(e) => setChapterGrade(e.target.value)}
                    style={{ padding: '8px 10px', borderRadius: '6px', border: `1px solid ${S.border}`, fontSize: '13px', background: '#FFFFFF' }}
                  >
                    <option value="">Select class...</option>
                    {programs.map((p: any) => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                    {programs.length === 0 && (
                      <>
                        <option value="Class 9">Class 9</option>
                        <option value="Class 10">Class 10</option>
                        <option value="Class 11">Class 11</option>
                        <option value="Class 12">Class 12</option>
                      </>
                    )}
                  </select>
                </label>

                <label style={{ display: 'grid', gap: '4px', fontSize: '12px', fontWeight: 600, color: S.navy }}>
                  <span>Subject <span style={{ color: '#D92D20' }}>*</span></span>
                  <select
                    required
                    value={chapterSubjectId}
                    onChange={(e) => {
                      setChapterSubjectId(e.target.value);
                      const sub = subjects.find((s: any) => s.id === e.target.value);
                      if (sub) setChapterSubjectName(sub.name);
                    }}
                    style={{ padding: '8px 10px', borderRadius: '6px', border: `1px solid ${S.border}`, fontSize: '13px', background: '#FFFFFF' }}
                  >
                    <option value="">Select subject...</option>
                    {subjects.map((s: any) => (
                      <option key={s.id} value={s.id}>{s.name} ({s.code || 'SUB'})</option>
                    ))}
                  </select>
                </label>

                <label style={{ display: 'grid', gap: '4px', fontSize: '12px', fontWeight: 600, color: S.navy }}>
                  <span>Unit Name</span>
                  <input
                    type="text"
                    value={chapterUnit}
                    onChange={(e) => setChapterUnit(e.target.value)}
                    placeholder="e.g. Unit 1: Algebra"
                    style={{ padding: '8px 10px', borderRadius: '6px', border: `1px solid ${S.border}`, fontSize: '13px' }}
                  />
                </label>

                <label style={{ display: 'grid', gap: '4px', fontSize: '12px', fontWeight: 600, color: S.navy }}>
                  <span>Chapter Name <span style={{ color: '#D92D20' }}>*</span></span>
                  <input
                    type="text"
                    required
                    value={chapterName}
                    onChange={(e) => setChapterName(e.target.value)}
                    placeholder="e.g. Quadratic Equations"
                    style={{ padding: '8px 10px', borderRadius: '6px', border: `1px solid ${S.border}`, fontSize: '13px' }}
                  />
                </label>

                <label style={{ display: 'grid', gap: '4px', fontSize: '12px', fontWeight: 600, color: S.navy }}>
                  <span>Expected Completion Week (1–52)</span>
                  <input
                    type="number"
                    min="1"
                    max="52"
                    value={chapterWeek}
                    onChange={(e) => setChapterWeek(e.target.value)}
                    style={{ padding: '8px 10px', borderRadius: '6px', border: `1px solid ${S.border}`, fontSize: '13px' }}
                  />
                </label>
              </div>

              <label style={{ display: 'grid', gap: '4px', fontSize: '12px', fontWeight: 600, color: S.navy }}>
                <span>Learning Outcomes (comma-separated)</span>
                <input
                  type="text"
                  value={chapterOutcomes}
                  onChange={(e) => setChapterOutcomes(e.target.value)}
                  placeholder="e.g. Standard form ax^2+bx+c=0, Quadratic formula, Word problems"
                  style={{ padding: '8px 10px', borderRadius: '6px', border: `1px solid ${S.border}`, fontSize: '13px' }}
                />
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddChapter(false)}
                  style={{ padding: '8px 14px', borderRadius: '6px', border: `1px solid ${S.border}`, background: '#FFFFFF', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={chapterBusy}
                  style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: S.navy, color: '#FFFFFF', fontSize: '12.5px', fontWeight: 600, cursor: chapterBusy ? 'not-allowed' : 'pointer' }}
                >
                  {chapterBusy ? 'Saving...' : 'Save Chapter'}
                </button>
              </div>
            </form>
          )}

          <div style={{ background: '#FFFFFF', border: `1px solid ${S.border}`, borderRadius: '10px', padding: '20px' }}>
            <h4 style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: 600, color: S.navy }}>Saved Curriculum Registers</h4>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${S.border}`, color: S.slate }}>
                    <th style={{ padding: '10px' }}>Grade</th>
                    <th style={{ padding: '10px' }}>Subject</th>
                    <th style={{ padding: '10px' }}>Chapter / Unit</th>
                    <th style={{ padding: '10px' }}>Completion Pacing</th>
                    <th style={{ padding: '10px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {curriculum.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: S.slate }}>No curriculum modules saved yet.</td>
                    </tr>
                  ) : (
                    curriculum.map((c: any, i: number) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${S.chip}` }}>
                        <td style={{ padding: '12px 10px', fontWeight: 600, color: S.navy }}>{c.grade}</td>
                        <td style={{ padding: '12px 10px', color: S.slate }}>{c.subject}</td>
                        <td style={{ padding: '12px 10px', color: S.navy }}>{c.chapter}</td>
                        <td style={{ padding: '12px 10px', fontWeight: 600, color: S.navy }}>{c.completionPct || 0}%</td>
                        <td style={{ padding: '12px 10px' }}>
                          <span style={{ padding: '3px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 700, background: S.greenBg, color: S.greenDk }}>
                            {c.status || 'Active'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Academic Calendar */}
      {tab === 'calendar' && (
        <div style={{ background: '#FFFFFF', border: `1px solid ${S.border}`, borderRadius: '10px', padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600, color: S.navy }}>
            Institutional Calendar &amp; Academic Events
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${S.border}`, color: S.slate }}>
                  <th style={{ padding: '10px' }}>Event Title</th>
                  <th style={{ padding: '10px' }}>Scheduled Date</th>
                  <th style={{ padding: '10px' }}>Time</th>
                  <th style={{ padding: '10px' }}>Category</th>
                </tr>
              </thead>
              <tbody>
                {events.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: S.slate }}>No scheduled events.</td>
                  </tr>
                ) : (
                  events.map((ev: any, i: number) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${S.chip}` }}>
                      <td style={{ padding: '12px 10px', fontWeight: 600, color: S.navy }}>{ev.title}</td>
                      <td style={{ padding: '12px 10px', color: S.slate }}>{ev.date}</td>
                      <td style={{ padding: '12px 10px', color: S.slate }}>{ev.time || 'All Day'}</td>
                      <td style={{ padding: '12px 10px' }}>
                        <span style={{ padding: '3px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 700, background: S.chip, color: S.navy }}>
                          Academic
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Batch Rollover & Promotions */}
      {tab === 'promotions' && (
        <form onSubmit={handleExecutePromotion} style={{ background: '#FFFFFF', border: `1px solid ${S.border}`, borderRadius: '10px', padding: '24px', display: 'grid', gap: '20px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: S.navy }}>Batch Promotion &amp; Academic Rollover</h3>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: S.slate }}>
              Promote an entire class section to the next academic grade or graduate terminal cohorts with 1-click execution.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            <label style={{ display: 'grid', gap: '4px', fontSize: '12px', fontWeight: 600, color: S.navy }}>
              <span>Source Class Section <span style={{ color: '#D92D20' }}>*</span></span>
              <select
                required
                value={sourceSectionId}
                onChange={(e) => handleSourceChange(e.target.value)}
                style={{ padding: '8px 10px', borderRadius: '6px', border: `1px solid ${S.border}`, fontSize: '13px', background: '#FFFFFF' }}
              >
                <option value="">Select source section...</option>
                {sections.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.programName} — {s.name}</option>
                ))}
              </select>
            </label>

            <label style={{ display: 'grid', gap: '4px', fontSize: '12px', fontWeight: 600, color: S.navy }}>
              <span>Action <span style={{ color: '#D92D20' }}>*</span></span>
              <select
                value={action}
                onChange={(e) => setAction(e.target.value as any)}
                style={{ padding: '8px 10px', borderRadius: '6px', border: `1px solid ${S.border}`, fontSize: '13px', background: '#FFFFFF' }}
              >
                <option value="promote">Promote to Next Academic Year</option>
                <option value="graduate">Graduate Class (Terminal Cohort / Alumni)</option>
              </select>
            </label>

            {action === 'promote' && (
              <>
                <label style={{ display: 'grid', gap: '4px', fontSize: '12px', fontWeight: 600, color: S.navy }}>
                  <span>Target Academic Year <span style={{ color: '#D92D20' }}>*</span></span>
                  <select
                    required
                    value={targetYearId}
                    onChange={(e) => setTargetYearId(e.target.value)}
                    style={{ padding: '8px 10px', borderRadius: '6px', border: `1px solid ${S.border}`, fontSize: '13px', background: '#FFFFFF' }}
                  >
                    <option value="">Select target academic year...</option>
                    {years.map((y: any) => (
                      <option key={y.id} value={y.id}>{y.name} {y.is_current ? '(Current)' : ''}</option>
                    ))}
                  </select>
                </label>

                <label style={{ display: 'grid', gap: '4px', fontSize: '12px', fontWeight: 600, color: S.navy }}>
                  <span>Target Section <span style={{ color: '#D92D20' }}>*</span></span>
                  <select
                    required
                    value={targetSectionId}
                    onChange={(e) => setTargetSectionId(e.target.value)}
                    style={{ padding: '8px 10px', borderRadius: '6px', border: `1px solid ${S.border}`, fontSize: '13px', background: '#FFFFFF' }}
                  >
                    <option value="">Select target section...</option>
                    {sections
                      .filter((s: any) => s.id !== sourceSectionId)
                      .map((s: any) => (
                        <option key={s.id} value={s.id}>{s.programName} — {s.name}</option>
                      ))}
                  </select>
                </label>
              </>
            )}
          </div>

          {sourceSectionId && (
            <div style={{ display: 'grid', gap: '10px', borderTop: `1px solid ${S.border}`, paddingTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: S.navy }}>
                  Student Roster ({sectionStudents.length} enrolled)
                </span>
                <span style={{ fontSize: '12px', color: S.greenDk, fontWeight: 600 }}>
                  {selectedStudentIds.length} of {sectionStudents.length} selected for rollover
                </span>
              </div>

              <div style={{ maxHeight: '220px', overflowY: 'auto', border: `1px solid ${S.border}`, borderRadius: '8px', padding: '8px', display: 'grid', gap: '4px', background: S.chip }}>
                {sectionStudents.map((st: any) => {
                  const studentId = st.id || st.userId;
                  const isChecked = selectedStudentIds.includes(studentId);
                  return (
                    <label key={studentId} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderRadius: '6px', background: isChecked ? '#EFF8FF' : '#FFFFFF', border: isChecked ? '1px solid #B2DDFF' : `1px solid ${S.border}`, fontSize: '13px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          setSelectedStudentIds((prev) => isChecked ? prev.filter((id) => id !== studentId) : [...prev, studentId]);
                        }}
                      />
                      <b>{st.name}</b>
                      <span style={{ fontSize: '11px', color: S.slate, marginLeft: 'auto' }}>
                        Roll #{st.rollNo || '-'} · Adm {st.admissionNo || '-'}
                      </span>
                    </label>
                  );
                })}
                {sectionStudents.length === 0 && (
                  <span style={{ fontSize: '12px', color: S.slate, padding: '16px', textAlign: 'center' }}>No active students currently enrolled in this section.</span>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '10px' }}>
                <button
                  type="submit"
                  disabled={busy || selectedStudentIds.length === 0}
                  style={{
                    padding: '10px 22px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    background: S.navy,
                    color: '#FFFFFF',
                    border: 'none',
                    cursor: busy || selectedStudentIds.length === 0 ? 'not-allowed' : 'pointer',
                    opacity: busy || selectedStudentIds.length === 0 ? 0.5 : 1,
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#132840'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = S.navy; }}
                >
                  {busy ? 'Processing...' : `Execute ${action === 'promote' ? 'Promotion' : 'Graduation'} (${selectedStudentIds.length} students)`}
                </button>
              </div>
            </div>
          )}
        </form>
      )}
    </div>
  );
}

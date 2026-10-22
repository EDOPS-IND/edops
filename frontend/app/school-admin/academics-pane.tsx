'use client';
import React, { useEffect, useState } from 'react';
import {
  getSchoolAdminAcademics,
  getSchoolAdminStudents,
  batchPromoteStudents,
  createSchoolAdminCurriculum,
  bulkCreateCurriculumChapters,
  deleteCurriculumChapter,
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
  Trash2,
  X,
  Check,
  FileText,
  List,
  Grid,
} from 'lucide-react';
import { ClassSectionManager } from '../components/class-command-center';

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
  activeTab,
  onTabChange,
  onNavigate,
}: {
  organizationId?: string;
  onOpenQuickAction: (action: string) => void;
  activeTab?: 'structure' | 'sections' | 'subjects' | 'curriculum' | 'calendar' | 'promotions';
  onTabChange?: (tab: 'structure' | 'sections' | 'subjects' | 'curriculum' | 'calendar' | 'promotions') => void;
  onNavigate?: (tab: any, sub?: string) => void;
}) {
  const [tab, setTab] = useState<'structure' | 'sections' | 'subjects' | 'curriculum' | 'calendar' | 'promotions'>(activeTab || 'structure');

  useEffect(() => {
    if (activeTab && activeTab !== tab) {
      setTab(activeTab);
    }
  }, [activeTab]);

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

  // Curriculum Subject Grid & Bulk Builder state
  const [selectedClassGrade, setSelectedClassGrade] = useState<string>('');
  const [activeModalSubject, setActiveModalSubject] = useState<any | null>(null);
  const [bulkRows, setBulkRows] = useState<Array<{
    id?: string;
    unitName: string;
    chapterName: string;
    expectedCompletionWeek: string;
    learningOutcomes: string;
  }>>([
    { unitName: 'Unit 1', chapterName: '', expectedCompletionWeek: '1', learningOutcomes: '' },
    { unitName: 'Unit 1', chapterName: '', expectedCompletionWeek: '2', learningOutcomes: '' },
    { unitName: 'Unit 2', chapterName: '', expectedCompletionWeek: '3', learningOutcomes: '' },
  ]);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [curriculumViewMode, setCurriculumViewMode] = useState<'grid' | 'table'>('grid');

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

  useEffect(() => {
    if (activeModalSubject || showAddChapter) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setActiveModalSubject(null);
          setShowAddChapter(false);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [activeModalSubject, showAddChapter]);

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

  useEffect(() => {
    if (programs.length > 0 && !selectedClassGrade) {
      setSelectedClassGrade(programs[0].name);
    }
  }, [programs, selectedClassGrade]);

  const handleBulkSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationId || !selectedClassGrade || !activeModalSubject) return;
    const validChapters = bulkRows.filter((r) => r.chapterName.trim().length > 0);
    if (validChapters.length === 0) {
      setError('Please provide at least one chapter name.');
      return;
    }
    setBulkSaving(true);
    setError('');
    try {
      await bulkCreateCurriculumChapters(organizationId, {
        grade: selectedClassGrade.startsWith('Class ') ? selectedClassGrade : `Class ${selectedClassGrade}`,
        subjectId: activeModalSubject.id,
        subjectName: activeModalSubject.name,
        chapters: validChapters.map((r) => ({
          id: r.id || undefined,
          unitName: r.unitName.trim() || 'General Unit',
          chapterName: r.chapterName.trim(),
          expectedCompletionWeek: Number(r.expectedCompletionWeek) || 10,
          learningOutcomes: r.learningOutcomes
            ? r.learningOutcomes.split(',').map((s) => s.trim()).filter(Boolean)
            : [],
        })),
      });
      setNotice(`✓ Saved ${validChapters.length} curriculum chapters for ${selectedClassGrade} - ${activeModalSubject.name}.`);
      setActiveModalSubject(null);
      setBulkRows([
        { unitName: 'Unit 1', chapterName: '', expectedCompletionWeek: '1', learningOutcomes: '' },
      ]);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save chapters');
    } finally {
      setBulkSaving(false);
    }
  };

  const handleDeleteChapter = async (chapterId: string) => {
    if (!organizationId || !chapterId) return;
    if (!confirm('Are you sure you want to delete this chapter?')) return;
    try {
      await deleteCurriculumChapter(organizationId, chapterId);
      setNotice('✓ Chapter removed.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete chapter');
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
          onClick={() => { setTab('sections'); setNotice(''); if (onTabChange) onTabChange('sections'); }}
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
          onClick={() => { setTab('subjects'); setNotice(''); if (onTabChange) onTabChange('subjects'); }}
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
          onClick={() => { setTab('structure'); setNotice(''); if (onTabChange) onTabChange('structure'); }}
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
          onClick={() => { setTab('curriculum'); setNotice(''); if (onTabChange) onTabChange('curriculum'); }}
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
            {curriculum.length}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px' }}>{curriculum.length > 0 ? 'Tracked learning outcomes' : 'No curriculum registered'}</span>
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
              onClick={() => { setTab(item.id as any); setNotice(''); if (onTabChange) onTabChange(item.id as any); }}
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
        <ClassSectionManager
          organizationId={organizationId || ''}
          role="school-admin"
          sections={sections}
          programs={programs}
          onRefresh={() => {
            if (organizationId) {
              getSchoolAdminAcademics(organizationId).then((res) => setData(res));
            }
          }}
          onOpenStudent={(_studentId) => {
            if (onNavigate) {
              onNavigate('students');
            } else if (onOpenQuickAction) {
              onOpenQuickAction('students');
            }
          }}
        />
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
        <div style={{ display: 'grid', gap: '20px' }}>
          {/* Header & Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: S.navy }}>Curriculum Syllabus &amp; Subject Registers</h3>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: S.slate }}>
                Select a class to view all assigned subjects in a grid, and manage their complete chapter breakdown in one shot.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ display: 'flex', background: S.chip, borderRadius: '8px', padding: '3px', border: `1px solid ${S.border}` }}>
                <button
                  type="button"
                  onClick={() => setCurriculumViewMode('grid')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    background: curriculumViewMode === 'grid' ? '#FFFFFF' : 'transparent',
                    color: curriculumViewMode === 'grid' ? S.navy : S.slate,
                    fontWeight: curriculumViewMode === 'grid' ? 700 : 500,
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: curriculumViewMode === 'grid' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                  }}
                >
                  <Grid size={14} /> Subject Grid
                </button>
                <button
                  type="button"
                  onClick={() => setCurriculumViewMode('table')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    background: curriculumViewMode === 'table' ? '#FFFFFF' : 'transparent',
                    color: curriculumViewMode === 'table' ? S.navy : S.slate,
                    fontWeight: curriculumViewMode === 'table' ? 700 : 500,
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: curriculumViewMode === 'table' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                  }}
                >
                  <List size={14} /> All Registers
                </button>
              </div>
            </div>
          </div>

          {/* 1. Class Selector Pill Strip */}
          <div style={{ background: '#FFFFFF', border: `1px solid ${S.border}`, borderRadius: '10px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '10px', overflowX: 'auto' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 700, color: S.navy, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Layers size={15} /> Select Class:
            </span>
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', flex: 1, paddingBottom: '2px' }}>
              {programs.length === 0 ? (
                <span style={{ fontSize: '12px', color: S.slate }}>No classes created yet. Please create classes first.</span>
              ) : (
                programs.map((p: any) => {
                  const isSelected = selectedClassGrade === p.name || (!selectedClassGrade && p === programs[0]);
                  const gradeChapters = curriculum.filter(
                    (c: any) =>
                      c.grade === p.name ||
                      c.grade === `Class ${p.name}` ||
                      (p.name && c.grade?.replace(/^Class\s*/i, '') === p.name.replace(/^Class\s*/i, ''))
                  );
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedClassGrade(p.name)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '8px',
                        border: isSelected ? `2px solid ${S.navy}` : `1px solid ${S.border}`,
                        background: isSelected ? S.navy : S.chip,
                        color: isSelected ? '#FFFFFF' : S.navy,
                        fontWeight: isSelected ? 700 : 500,
                        fontSize: '12.5px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span>{p.name}</span>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '10px',
                          background: isSelected ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                          color: isSelected ? '#FFFFFF' : S.slate,
                        }}
                      >
                        {gradeChapters.length} Ch
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* 2. Subject Grid View */}
          {curriculumViewMode === 'grid' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: S.navy }}>
                  Showing Subjects for {selectedClassGrade || 'Selected Class'} ({subjects.length} Subjects in School)
                </span>
                <span style={{ fontSize: '11.5px', color: S.slate }}>
                  Click any subject card to add or edit its full syllabus
                </span>
              </div>

              {subjects.length === 0 ? (
                <div style={{ background: '#FFFFFF', border: `1px solid ${S.border}`, borderRadius: '10px', padding: '36px 20px', textAlign: 'center', color: S.slate }}>
                  <BookOpen size={32} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
                  <p style={{ margin: 0, fontWeight: 600, fontSize: '14px', color: S.navy }}>No subjects created yet</p>
                  <p style={{ margin: '4px 0 0', fontSize: '12px' }}>Go to the Subjects tab above to add subjects like Math, Science, English, etc.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
                  {subjects.map((sub: any) => {
                    const subjectChapters = curriculum.filter(
                      (c: any) =>
                        (c.grade === selectedClassGrade ||
                         c.grade === `Class ${selectedClassGrade}` ||
                         (selectedClassGrade && c.grade?.replace(/^Class\s*/i, '') === selectedClassGrade.replace(/^Class\s*/i, ''))) &&
                        (c.subjectId === sub.id || c.subject?.toLowerCase() === sub.name?.toLowerCase())
                    );
                    const totalCh = subjectChapters.length;
                    const avgProgress = totalCh > 0
                      ? Math.round(subjectChapters.reduce((acc: number, c: any) => acc + (Number(c.completionPct) || 0), 0) / totalCh)
                      : 0;

                    return (
                      <div
                        key={sub.id}
                        onClick={() => {
                          setActiveModalSubject(sub);
                          setBulkRows([
                            { unitName: 'Unit 1', chapterName: '', expectedCompletionWeek: String(totalCh + 1), learningOutcomes: '' },
                            { unitName: 'Unit 1', chapterName: '', expectedCompletionWeek: String(totalCh + 2), learningOutcomes: '' },
                            { unitName: 'Unit 2', chapterName: '', expectedCompletionWeek: String(totalCh + 3), learningOutcomes: '' },
                          ]);
                        }}
                        style={{
                          background: '#FFFFFF',
                          border: `1px solid ${S.border}`,
                          borderRadius: '12px',
                          padding: '18px 20px',
                          cursor: 'pointer',
                          transition: 'all 0.18s ease',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '14px',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = S.navy;
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 6px 16px rgba(12,30,51,0.08)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = S.border;
                          e.currentTarget.style.transform = 'none';
                          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.02)';
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <span style={{ fontSize: '10.5px', fontWeight: 700, color: S.slate, background: S.chip, padding: '2px 7px', borderRadius: '4px', letterSpacing: '0.04em' }}>
                              {sub.code || 'SUBJECT'}
                            </span>
                            <h4 style={{ margin: '8px 0 2px', fontSize: '16px', fontWeight: 700, color: S.navy }}>
                              {sub.name}
                            </h4>
                            <span style={{ fontSize: '12px', color: S.slate }}>
                              {selectedClassGrade || 'Class'}
                            </span>
                          </div>
                          <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: S.chip, display: 'flex', alignItems: 'center', justifyContent: 'center', color: S.navy }}>
                            <BookOpen size={18} />
                          </div>
                        </div>

                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                            <span style={{ color: S.slate, fontWeight: 500 }}>
                              {totalCh > 0 ? `${totalCh} Chapters Mapped` : 'No chapters yet'}
                            </span>
                            <span style={{ color: S.navy, fontWeight: 700 }}>
                              {avgProgress}% Covered
                            </span>
                          </div>
                          <div style={{ height: '6px', background: S.chip, borderRadius: '4px', overflow: 'hidden' }}>
                            <div
                              style={{
                                height: '100%',
                                width: `${avgProgress}%`,
                                background: avgProgress >= 100 ? S.green : S.navy,
                                borderRadius: '4px',
                                transition: 'width 0.3s ease',
                              }}
                            />
                          </div>
                        </div>

                        <div style={{ paddingTop: '10px', borderTop: `1px solid ${S.chip}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              color: totalCh > 0 ? (avgProgress >= 100 ? S.greenDk : '#0284C7') : S.slate,
                              background: totalCh > 0 ? (avgProgress >= 100 ? S.greenBg : '#e0f2fe') : S.chip,
                              padding: '2px 8px',
                              borderRadius: '4px',
                            }}
                          >
                            {totalCh === 0 ? 'Draft' : avgProgress >= 100 ? 'Completed' : 'In Progress'}
                          </span>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: S.navy, display: 'flex', alignItems: 'center', gap: '3px' }}>
                            Manage Syllabus <ChevronRight size={14} />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 3. Full Table View */}
          {curriculumViewMode === 'table' && (
            <div style={{ background: '#FFFFFF', border: `1px solid ${S.border}`, borderRadius: '10px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: S.navy }}>Saved Curriculum Registers (All Classes &amp; Subjects)</h4>
                <span style={{ fontSize: '12px', color: S.slate }}>{curriculum.length} total entries recorded</span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${S.border}`, color: S.slate }}>
                      <th style={{ padding: '10px' }}>Grade</th>
                      <th style={{ padding: '10px' }}>Subject</th>
                      <th style={{ padding: '10px' }}>Unit</th>
                      <th style={{ padding: '10px' }}>Chapter</th>
                      <th style={{ padding: '10px' }}>Target Week</th>
                      <th style={{ padding: '10px' }}>Completion Pacing</th>
                      <th style={{ padding: '10px' }}>Status</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {curriculum.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ padding: '24px', textAlign: 'center', color: S.slate }}>No curriculum modules saved yet.</td>
                      </tr>
                    ) : (
                      curriculum.map((c: any, i: number) => (
                        <tr key={c.id || i} style={{ borderBottom: `1px solid ${S.chip}` }}>
                          <td style={{ padding: '12px 10px', fontWeight: 700, color: S.navy }}>{c.grade}</td>
                          <td style={{ padding: '12px 10px', color: S.slate }}>{c.subject}</td>
                          <td style={{ padding: '12px 10px', color: S.slate }}>{c.unit || 'General'}</td>
                          <td style={{ padding: '12px 10px', fontWeight: 600, color: S.navy }}>{c.chapter}</td>
                          <td style={{ padding: '12px 10px', color: S.slate }}>Week {c.expectedWeek || c.expected_completion_week || 10}</td>
                          <td style={{ padding: '12px 10px', fontWeight: 600, color: S.navy }}>{c.completionPct || 0}%</td>
                          <td style={{ padding: '12px 10px' }}>
                            <span style={{ padding: '3px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 700, background: S.greenBg, color: S.greenDk }}>
                              {c.status || 'On Track'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                            <button
                              type="button"
                              onClick={() => handleDeleteChapter(c.id)}
                              style={{
                                border: 'none',
                                background: 'transparent',
                                color: '#EF4444',
                                cursor: 'pointer',
                                padding: '4px',
                              }}
                              title="Delete Chapter"
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. Bulk Syllabus Builder Modal (Opened on clicking Subject Card) */}
          {activeModalSubject && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(12, 30, 51, 0.65)',
                backdropFilter: 'blur(3px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                padding: '16px',
              }}
              onClick={(e) => {
                if (e.target === e.currentTarget && !bulkSaving) setActiveModalSubject(null);
              }}
            >
              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: '14px',
                  width: '100%',
                  maxWidth: '920px',
                  maxHeight: '90vh',
                  overflowY: 'auto',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Modal Header */}
                <div style={{ padding: '20px 24px', borderBottom: `1px solid ${S.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FAFAFB', borderTopLeftRadius: '14px', borderTopRightRadius: '14px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '4px', background: S.navy, color: '#FFFFFF', fontSize: '11px', fontWeight: 700 }}>
                        {selectedClassGrade || 'Class'}
                      </span>
                      <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: S.navy }}>
                        {activeModalSubject.name} ({activeModalSubject.code || 'SUB'}) Syllabus Builder
                      </h3>
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: S.slate }}>
                      Add or edit all chapters, units, and learning outcomes for this subject in one shot.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveModalSubject(null)}
                    disabled={bulkSaving}
                    style={{
                      border: `1px solid ${S.border}`,
                      background: '#FFFFFF',
                      borderRadius: '8px',
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: S.slate,
                    }}
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Modal Body */}
                <div style={{ padding: '24px', display: 'grid', gap: '22px' }}>
                  {/* Part A: Currently Saved Chapters */}
                  {(() => {
                    const savedSubjectChapters = curriculum.filter(
                      (c: any) =>
                        (c.grade === selectedClassGrade ||
                         c.grade === `Class ${selectedClassGrade}` ||
                         (selectedClassGrade && c.grade?.replace(/^Class\s*/i, '') === selectedClassGrade.replace(/^Class\s*/i, ''))) &&
                        (c.subjectId === activeModalSubject.id || c.subject?.toLowerCase() === activeModalSubject.name?.toLowerCase())
                    );
                    if (savedSubjectChapters.length === 0) return null;
                    return (
                      <div style={{ background: '#f8fafc', border: `1px solid ${S.border}`, borderRadius: '10px', padding: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: 700, color: S.navy }}>
                            Existing Saved Chapters ({savedSubjectChapters.length})
                          </h4>
                          <span style={{ fontSize: '11px', color: S.slate }}>Click trash to remove any chapter</span>
                        </div>
                        <div style={{ display: 'grid', gap: '6px' }}>
                          {savedSubjectChapters.map((sc: any, sIdx: number) => (
                            <div
                              key={sc.id || sIdx}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                background: '#FFFFFF',
                                border: `1px solid ${S.border}`,
                                borderRadius: '6px',
                                padding: '8px 12px',
                                fontSize: '12.5px',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: S.chip, color: S.navy, fontWeight: 700, fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  {sIdx + 1}
                                </span>
                                <div>
                                  <span style={{ fontWeight: 700, color: S.navy }}>{sc.chapter}</span>
                                  <span style={{ color: S.slate, marginLeft: '8px', fontSize: '11.5px' }}>
                                    ({sc.unit || 'General'} · Week {sc.expectedWeek || sc.expected_completion_week || 10})
                                  </span>
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ fontSize: '11px', fontWeight: 700, color: sc.completionPct >= 100 ? S.greenDk : S.navy, background: sc.completionPct >= 100 ? S.greenBg : S.chip, padding: '2px 8px', borderRadius: '4px' }}>
                                  {sc.completionPct || 0}% Complete
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteChapter(sc.id)}
                                  style={{
                                    border: 'none',
                                    background: 'transparent',
                                    color: '#EF4444',
                                    cursor: 'pointer',
                                    padding: '2px',
                                  }}
                                  title="Delete Chapter"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Part B: Bulk Add Chapters Table */}
                  <form onSubmit={handleBulkSave}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: S.navy }}>
                          Add Chapters in Bulk
                        </h4>
                        <p style={{ margin: '2px 0 0', fontSize: '12px', color: S.slate }}>
                          Fill out the rows below to map multiple chapters simultaneously.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setBulkRows([
                            ...bulkRows,
                            {
                              unitName: bulkRows[bulkRows.length - 1]?.unitName || `Unit ${bulkRows.length + 1}`,
                              chapterName: '',
                              expectedCompletionWeek: String(bulkRows.length + 1),
                              learningOutcomes: '',
                            },
                          ])
                        }
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: `1px solid ${S.navy}`,
                          background: '#FFFFFF',
                          color: S.navy,
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Plus size={14} /> Add Row
                      </button>
                    </div>

                    <div style={{ border: `1px solid ${S.border}`, borderRadius: '8px', overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                        <thead>
                          <tr style={{ background: '#f8fafc', borderBottom: `1px solid ${S.border}`, color: S.slate, textAlign: 'left' }}>
                            <th style={{ padding: '8px 10px', width: '40px' }}>#</th>
                            <th style={{ padding: '8px 10px', width: '160px' }}>Unit / Theme</th>
                            <th style={{ padding: '8px 10px' }}>Chapter Title <span style={{ color: '#D92D20' }}>*</span></th>
                            <th style={{ padding: '8px 10px', width: '90px' }}>Week (1–52)</th>
                            <th style={{ padding: '8px 10px' }}>Learning Outcomes / Topics</th>
                            <th style={{ padding: '8px 10px', width: '40px', textAlign: 'center' }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {bulkRows.map((row, idx) => (
                            <tr key={idx} style={{ borderBottom: idx === bulkRows.length - 1 ? 'none' : `1px solid ${S.chip}` }}>
                              <td style={{ padding: '8px 10px', color: S.slate, fontWeight: 700 }}>
                                {idx + 1}
                              </td>
                              <td style={{ padding: '8px 10px' }}>
                                <input
                                  type="text"
                                  value={row.unitName}
                                  onChange={(e) => {
                                    const next = [...bulkRows];
                                    next[idx].unitName = e.target.value;
                                    setBulkRows(next);
                                  }}
                                  placeholder="e.g. Unit 1: Algebra"
                                  style={{
                                    width: '100%',
                                    padding: '6px 8px',
                                    borderRadius: '5px',
                                    border: `1px solid ${S.border}`,
                                    fontSize: '12.5px',
                                    boxSizing: 'border-box',
                                  }}
                                />
                              </td>
                              <td style={{ padding: '8px 10px' }}>
                                <input
                                  type="text"
                                  required={idx === 0}
                                  value={row.chapterName}
                                  onChange={(e) => {
                                    const next = [...bulkRows];
                                    next[idx].chapterName = e.target.value;
                                    setBulkRows(next);
                                  }}
                                  placeholder="e.g. Quadratic Equations"
                                  style={{
                                    width: '100%',
                                    padding: '6px 8px',
                                    borderRadius: '5px',
                                    border: `1px solid ${S.border}`,
                                    fontSize: '12.5px',
                                    fontWeight: 600,
                                    color: S.navy,
                                    boxSizing: 'border-box',
                                  }}
                                />
                              </td>
                              <td style={{ padding: '8px 10px' }}>
                                <input
                                  type="number"
                                  min="1"
                                  max="52"
                                  value={row.expectedCompletionWeek}
                                  onChange={(e) => {
                                    const next = [...bulkRows];
                                    next[idx].expectedCompletionWeek = e.target.value;
                                    setBulkRows(next);
                                  }}
                                  style={{
                                    width: '100%',
                                    padding: '6px 8px',
                                    borderRadius: '5px',
                                    border: `1px solid ${S.border}`,
                                    fontSize: '12.5px',
                                    boxSizing: 'border-box',
                                  }}
                                />
                              </td>
                              <td style={{ padding: '8px 10px' }}>
                                <input
                                  type="text"
                                  value={row.learningOutcomes}
                                  onChange={(e) => {
                                    const next = [...bulkRows];
                                    next[idx].learningOutcomes = e.target.value;
                                    setBulkRows(next);
                                  }}
                                  placeholder="e.g. Factorization, roots, formula (comma-separated)"
                                  style={{
                                    width: '100%',
                                    padding: '6px 8px',
                                    borderRadius: '5px',
                                    border: `1px solid ${S.border}`,
                                    fontSize: '12px',
                                    boxSizing: 'border-box',
                                  }}
                                />
                              </td>
                              <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                                {bulkRows.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const next = bulkRows.filter((_, rIdx) => rIdx !== idx);
                                      setBulkRows(next);
                                    }}
                                    style={{
                                      border: 'none',
                                      background: 'transparent',
                                      color: S.slate,
                                      cursor: 'pointer',
                                      padding: '2px',
                                    }}
                                    title="Remove Row"
                                  >
                                    <X size={15} />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Modal Footer */}
                    <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={() => setActiveModalSubject(null)}
                        disabled={bulkSaving}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '8px',
                          border: `1px solid ${S.border}`,
                          background: '#FFFFFF',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          color: S.slate,
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={bulkSaving}
                        style={{
                          padding: '8px 20px',
                          borderRadius: '8px',
                          border: 'none',
                          background: S.navy,
                          color: '#FFFFFF',
                          fontSize: '13px',
                          fontWeight: 700,
                          cursor: bulkSaving ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        {bulkSaving ? 'Saving Syllabus...' : 'Save All Chapters'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
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

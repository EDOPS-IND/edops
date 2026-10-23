'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  getSchoolAdminAcademics,
  getSchoolAdminStudents,
  batchPromoteStudents,
  createSchoolAdminCurriculum,
  bulkCreateCurriculumChapters,
  deleteCurriculumChapter,
  createAcademicSubject,
  updateAcademicSubject,
  updateAcademicSection,
  updateAcademicYear,
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
  Search,
  Filter,
  CheckSquare,
  Square,
  AlertTriangle,
  User,
  Shield,
  Eye,
  Building2,
  ExternalLink,
  Edit2,
  Settings,
} from 'lucide-react';
import { ClassSectionManager } from '../components/class-command-center';

/* -------------------------------------------------------------------------- */
/* DESIGN SYSTEM CONSTANTS & TOKENS                                           */
/* -------------------------------------------------------------------------- */

const S = {
  navy: '#0C1E33',
  slate: '#64748B',
  muted: '#94A3B8',
  faint: '#CBD5E1',
  bg: '#F8FAFC',
  white: '#FFFFFF',
  border: '#E2E8F0',
  line: '#E2E8F0',
  chip: '#F1F5F9',
  greenBg: '#D9EED1',
  green: '#16A34A',
  greenDk: '#15803D',
  amberBg: '#FEF3C7',
  amber: '#D97706',
  amberDk: '#B45309',
  redBg: '#FEE2E2',
  red: '#DC2626',
  redDk: '#B91C1C',
  blueBg: '#E0F2FE',
  blue: '#0284C7',
  blueDk: '#0369A1',
  purpleBg: '#F3E8FF',
  purple: '#9333EA',
  purpleDk: '#6B21A8',
};

const displayVal = (val: number | null | undefined): string => {
  if (val === null || val === undefined || val === 0) return '-';
  return String(val);
};

/* -------------------------------------------------------------------------- */
/* SKELETON LOADERS & EMPTY STATES                                            */
/* -------------------------------------------------------------------------- */

function KpiSkeletonGrid() {
  const cards = [
    { bg: '#E0D3FF' },
    { bg: '#D0EDC0' },
    { bg: '#BCE6F3' },
    { bg: '#FADAC9' },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {cards.map((c, i) => (
        <div
          key={i}
          style={{
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '164px',
            padding: '20px',
            gap: '12px',
            background: c.bg,
            borderRadius: '10px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div className="edops-skeleton-kpi" style={{ width: '110px', height: '12px', borderRadius: '4px' }} />
            <div className="edops-skeleton-kpi" style={{ width: '20px', height: '20px', borderRadius: '50%' }} />
          </div>
          <div className="edops-skeleton-kpi" style={{ width: '75px', height: '36px', borderRadius: '6px' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
            <div className="edops-skeleton-kpi" style={{ width: '140px', height: '10px', borderRadius: '4px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <div className="edops-skeleton-kpi" style={{ width: '55px', height: '10px', borderRadius: '4px' }} />
              <div className="edops-skeleton-kpi" style={{ width: '14px', height: '14px', borderRadius: '3px' }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function TableSkeletonRows({ rows = 6, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rIdx) => {
        const isEven = rIdx % 2 === 0;
        return (
          <tr
            key={rIdx}
            style={{
              height: '52px',
              minHeight: '52px',
              background: isEven ? '#FFFFFF' : '#F8FAFC',
              borderBottom: '1px solid #E0E5EB',
              boxSizing: 'border-box',
            }}
          >
            <td style={{ padding: '0 24px', height: '52px', verticalAlign: 'middle' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  className="edops-skeleton"
                  style={{ width: '30px', height: '30px', borderRadius: '6px', flexShrink: 0 }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', width: '130px' }}>
                  <div className="edops-skeleton" style={{ height: '12px', width: '85%' }} />
                  <div className="edops-skeleton" style={{ height: '9px', width: '60%' }} />
                </div>
              </div>
            </td>
            {Array.from({ length: columns - 2 }).map((_, cIdx) => (
              <td key={cIdx} style={{ padding: '0 18px', height: '52px', verticalAlign: 'middle' }}>
                <div
                  className="edops-skeleton"
                  style={{
                    height: '12px',
                    width: cIdx % 2 === 0 ? '75px' : '110px',
                    maxWidth: '90%',
                  }}
                />
              </td>
            ))}
            <td style={{ padding: '0 24px', height: '52px', textAlign: 'right', verticalAlign: 'middle' }}>
              <div style={{ display: 'inline-flex', justifyContent: 'flex-end', width: '100%' }}>
                <div
                  className="edops-skeleton"
                  style={{ height: '26px', width: '80px', borderRadius: '6px' }}
                />
              </div>
            </td>
          </tr>
        );
      })}
    </>
  );
}


function SubjectGridSkeleton() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
        gap: '16px',
      }}
    >
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          style={{
            background: '#FFFFFF',
            border: `1px solid ${S.border}`,
            borderRadius: '10px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '60%' }}>
              <div className="edops-skeleton" style={{ height: '14px', width: '50px' }} />
              <div className="edops-skeleton" style={{ height: '18px', width: '120px' }} />
              <div className="edops-skeleton" style={{ height: '12px', width: '70px' }} />
            </div>
            <div className="edops-skeleton" style={{ width: '38px', height: '38px', borderRadius: '8px' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div className="edops-skeleton" style={{ height: '12px', width: '100%' }} />
            <div className="edops-skeleton" style={{ height: '6px', width: '100%', borderRadius: '4px' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '10px', borderTop: `1px solid ${S.border}` }}>
            <div className="edops-skeleton" style={{ height: '20px', width: '60px' }} />
            <div className="edops-skeleton" style={{ height: '24px', width: '90px' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function NoResultState({
  title,
  description,
  onReset,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  onReset?: () => void;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        width: '100%',
        textAlign: 'center',
        boxSizing: 'border-box',
        background: '#FFFFFF',
        borderRadius: '10px',
        border: `1px solid ${S.border}`,
      }}
    >
      <img
        src="/noresult.png"
        alt="No results found"
        style={{
          width: '130px',
          height: 'auto',
          maxHeight: '110px',
          objectFit: 'contain',
          marginBottom: '16px',
          opacity: 0.95,
        }}
      />
      <b
        style={{
          fontFamily: "'Poppins', sans-serif",
          fontSize: '15px',
          fontWeight: 700,
          color: S.navy,
          marginBottom: '6px',
          letterSpacing: '-0.01em',
        }}
      >
        {title}
      </b>
      <p
        style={{
          margin: 0,
          fontFamily: "'Poppins', sans-serif",
          fontSize: '12.5px',
          color: S.slate,
          maxWidth: '440px',
          lineHeight: 1.55,
        }}
      >
        {description}
      </p>
      <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            style={{
              padding: '7px 16px',
              borderRadius: '6px',
              background: '#FFFFFF',
              color: S.navy,
              border: `1px solid ${S.border}`,
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: "'Poppins', sans-serif",
              transition: 'all 0.15s ease',
            }}
          >
            Reset Filters
          </button>
        )}
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            style={{
              padding: '7px 18px',
              borderRadius: '6px',
              background: S.navy,
              color: '#FFFFFF',
              border: 'none',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: "'Poppins', sans-serif",
              transition: 'all 0.15s ease',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#1B3554')}
            onMouseLeave={(e) => (e.currentTarget.style.background = S.navy)}
          >
            <Plus size={13} />
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* MAIN COMPONENT: ACADEMICS PANE                                             */
/* -------------------------------------------------------------------------- */

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
  const [tab, setTab] = useState<'structure' | 'sections' | 'subjects' | 'curriculum' | 'calendar' | 'promotions'>(
    activeTab || 'structure'
  );

  useEffect(() => {
    if (activeTab && activeTab !== tab) {
      setTab(activeTab);
    }
  }, [activeTab]);

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Dossier Drawers state
  const [selectedYearDossier, setSelectedYearDossier] = useState<any | null>(null);
  const [selectedSectionDossier, setSelectedSectionDossier] = useState<any | null>(null);
  const [selectedSubjectDossier, setSelectedSubjectDossier] = useState<any | null>(null);

  // Subject Creation & Edit Dossier Drawer state (Stacked at top z-index: 1300)
  const [showSubjectDrawer, setShowSubjectDrawer] = useState(false);
  const [subjectDrawerMode, setSubjectDrawerMode] = useState<'create' | 'edit'>('create');
  const [subjectFormId, setSubjectFormId] = useState('');
  const [subjectFormName, setSubjectFormName] = useState('');
  const [subjectFormCode, setSubjectFormCode] = useState('');
  const [subjectFormIsElective, setSubjectFormIsElective] = useState(false);
  const [subjectFormBusy, setSubjectFormBusy] = useState(false);

  // Section Edit Dossier Drawer state (Stacked at top z-index: 1300)
  const [showSectionDrawer, setShowSectionDrawer] = useState(false);
  const [sectionFormId, setSectionFormId] = useState('');
  const [sectionFormName, setSectionFormName] = useState('');
  const [sectionFormCapacity, setSectionFormCapacity] = useState<number>(40);
  const [sectionFormBusy, setSectionFormBusy] = useState(false);

  // Academic Year Edit Dossier Drawer state (Stacked at top z-index: 1300)
  const [showYearDrawer, setShowYearDrawer] = useState(false);
  const [yearFormId, setYearFormId] = useState('');
  const [yearFormName, setYearFormName] = useState('');
  const [yearFormStartDate, setYearFormStartDate] = useState('');
  const [yearFormEndDate, setYearFormEndDate] = useState('');
  const [yearFormIsCurrent, setYearFormIsCurrent] = useState(false);
  const [yearFormBusy, setYearFormBusy] = useState(false);

  // Prevent background scrolling when any dossier drawer is open
  useEffect(() => {
    const isAnyDrawerOpen = Boolean(
      selectedYearDossier ||
      selectedSectionDossier ||
      selectedSubjectDossier ||
      showSubjectDrawer ||
      showSectionDrawer ||
      showYearDrawer
    );
    if (isAnyDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [
    selectedYearDossier,
    selectedSectionDossier,
    selectedSubjectDossier,
    showSubjectDrawer,
    showSectionDrawer,
    showYearDrawer,
  ]);


  // Batch Promotion state
  const [sourceSectionId, setSourceSectionId] = useState('');
  const [targetSectionId, setTargetSectionId] = useState('');
  const [targetYearId, setTargetYearId] = useState('');
  const [action, setAction] = useState<'promote' | 'graduate'>('promote');
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [busy, setBusy] = useState(false);

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
  const [bulkRows, setBulkRows] = useState<
    Array<{
      id?: string;
      unitName: string;
      chapterName: string;
      expectedCompletionWeek: string;
      learningOutcomes: string;
    }>
  >([
    { unitName: 'Unit 1', chapterName: '', expectedCompletionWeek: '1', learningOutcomes: '' },
    { unitName: 'Unit 1', chapterName: '', expectedCompletionWeek: '2', learningOutcomes: '' },
    { unitName: 'Unit 2', chapterName: '', expectedCompletionWeek: '3', learningOutcomes: '' },
  ]);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [curriculumViewMode, setCurriculumViewMode] = useState<'grid' | 'table'>('grid');
  const [curriculumSearch, setCurriculumSearch] = useState('');

  // Filters for subtabs
  const [sectionSearch, setSectionSearch] = useState('');
  const [sectionProgramFilter, setSectionProgramFilter] = useState<string>('all');
  const [subjectSearch, setSubjectSearch] = useState('');
  const [calendarFilter, setCalendarFilter] = useState<'all' | 'ptm' | 'exam' | 'academic'>('all');

  const load = async (isSilent = false) => {
    if (!organizationId) {
      setLoading(false);
      return;
    }
    if (!isSilent) {
      setLoading(true);
    }
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
  const currentAcademicYear = years.find((y: any) => y.is_current) || years[0] || null;

  useEffect(() => {
    if (programs.length > 0 && !selectedClassGrade) {
      setSelectedClassGrade(programs[0].name);
    }
  }, [programs, selectedClassGrade]);

  const sourceSection = sections.find((s: any) => s.id === sourceSectionId);
  const targetSection = sections.find((s: any) => s.id === targetSectionId);
  const targetYear = years.find((y: any) => y.id === targetYearId);

  // Subject Creation & Edit Handlers
  const handleOpenCreateSubject = () => {
    setSubjectDrawerMode('create');
    setSubjectFormId('');
    setSubjectFormName('');
    setSubjectFormCode('');
    setSubjectFormIsElective(false);
    setShowSubjectDrawer(true);
  };

  const handleOpenEditSubject = (sub: any) => {
    setSubjectDrawerMode('edit');
    setSubjectFormId(sub.id);
    setSubjectFormName(sub.name);
    setSubjectFormCode(sub.code || '');
    setSubjectFormIsElective(Boolean(sub.isElective));
    setShowSubjectDrawer(true);
  };

  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationId || !subjectFormName.trim() || !subjectFormCode.trim()) return;
    setSubjectFormBusy(true);
    setError('');
    try {
      if (subjectDrawerMode === 'create') {
        await createAcademicSubject(organizationId, {
          name: subjectFormName.trim(),
          code: subjectFormCode.trim().toUpperCase(),
          isElective: subjectFormIsElective,
        });
        setNotice(`Subject "${subjectFormName.trim()}" created successfully.`);
      } else {
        await updateAcademicSubject(organizationId, subjectFormId, {
          name: subjectFormName.trim(),
          code: subjectFormCode.trim().toUpperCase(),
          isElective: subjectFormIsElective,
        });
        setNotice(`Subject "${subjectFormName.trim()}" updated successfully.`);
        if (selectedSubjectDossier && selectedSubjectDossier.id === subjectFormId) {
          setSelectedSubjectDossier((prev: any) => ({
            ...prev,
            name: subjectFormName.trim(),
            code: subjectFormCode.trim().toUpperCase(),
            isElective: subjectFormIsElective,
          }));
        }
      }
      setShowSubjectDrawer(false);
      await load(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to save subject');
    } finally {
      setSubjectFormBusy(false);
    }
  };

  // Section Edit Handlers
  const handleOpenEditSection = (sec: any) => {
    setSectionFormId(sec.id);
    setSectionFormName(sec.name || '');
    setSectionFormCapacity(Number(sec.capacity || 40));
    setShowSectionDrawer(true);
  };

  const handleSaveSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationId || !sectionFormName.trim() || sectionFormCapacity <= 0) return;
    setSectionFormBusy(true);
    setError('');
    try {
      await updateAcademicSection(organizationId, sectionFormId, {
        name: sectionFormName.trim(),
        capacity: Number(sectionFormCapacity),
      });
      setNotice(`Section ${sectionFormName.trim()} updated successfully.`);
      setData((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          sections: (prev.sections || []).map((s: any) =>
            s.id === sectionFormId ? { ...s, name: sectionFormName.trim(), capacity: Number(sectionFormCapacity) } : s
          ),
        };
      });
      if (selectedSectionDossier && selectedSectionDossier.id === sectionFormId) {
        setSelectedSectionDossier((prev: any) => ({
          ...prev,
          name: sectionFormName.trim(),
          capacity: Number(sectionFormCapacity),
        }));
      }
      setShowSectionDrawer(false);
      await load(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to update section');
    } finally {
      setSectionFormBusy(false);
    }
  };

  // Academic Year Edit Handlers
  const handleOpenEditYear = (y: any) => {
    setYearFormId(y.id);
    setYearFormName(y.name || '');
    setYearFormStartDate(y.start_date || y.startDate || '');
    setYearFormEndDate(y.end_date || y.endDate || '');
    setYearFormIsCurrent(Boolean(y.is_current || y.isCurrent));
    setShowYearDrawer(true);
  };

  const handleSaveYear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationId || !yearFormName.trim()) return;
    setYearFormBusy(true);
    setError('');
    try {
      await updateAcademicYear(organizationId, yearFormId, {
        name: yearFormName.trim(),
        startDate: yearFormStartDate || undefined,
        endDate: yearFormEndDate || undefined,
        isCurrent: yearFormIsCurrent,
      });
      setNotice(`Academic session ${yearFormName.trim()} updated successfully.`);
      setData((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          academicYears: (prev.academicYears || []).map((y: any) =>
            y.id === yearFormId
              ? {
                  ...y,
                  name: yearFormName.trim(),
                  start_date: yearFormStartDate,
                  end_date: yearFormEndDate,
                  is_current: yearFormIsCurrent,
                }
              : y
          ),
        };
      });
      if (selectedYearDossier && selectedYearDossier.id === yearFormId) {
        setSelectedYearDossier((prev: any) => ({
          ...prev,
          name: yearFormName.trim(),
          start_date: yearFormStartDate,
          end_date: yearFormEndDate,
          is_current: yearFormIsCurrent,
        }));
      }
      setShowYearDrawer(false);
      await load(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to update academic session');
    } finally {
      setYearFormBusy(false);
    }
  };


  // Curriculum Single Chapter Save
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
          ? chapterOutcomes
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : undefined,
      });
      setNotice(`Saved curriculum chapter "${chapterName.trim()}" for ${chapterGrade}.`);
      setShowAddChapter(false);
      setChapterUnit('');
      setChapterName('');
      setChapterOutcomes('');
      await load(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to save curriculum chapter');
    } finally {
      setChapterBusy(false);
    }
  };

  // Curriculum Bulk Save
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
            ? r.learningOutcomes
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)
            : [],
        })),
      });
      setNotice(`Saved ${validChapters.length} curriculum chapters for ${selectedClassGrade} - ${activeModalSubject.name}.`);
      setActiveModalSubject(null);
      setBulkRows([{ unitName: 'Unit 1', chapterName: '', expectedCompletionWeek: '1', learningOutcomes: '' }]);
      await load(true);
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
      setNotice('Chapter removed.');
      await load(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete chapter');
    }
  };

  // Batch Promotion student selection
  const sectionStudents = useMemo(() => {
    if (!sourceSection) return [];
    return allStudents.filter((st: any) => {
      return (
        st.section === sourceSection.name ||
        st.sectionName === sourceSection.name ||
        st.sectionId === sourceSection.id ||
        st.section_id === sourceSection.id
      );
    });
  }, [allStudents, sourceSection]);

  const filteredSectionStudents = useMemo(() => {
    if (!studentSearch.trim()) return sectionStudents;
    const q = studentSearch.toLowerCase();
    return sectionStudents.filter(
      (st: any) =>
        st.name?.toLowerCase().includes(q) ||
        st.rollNo?.toLowerCase().includes(q) ||
        st.admissionNo?.toLowerCase().includes(q)
    );
  }, [sectionStudents, studentSearch]);

  const handleSourceChange = (secId: string) => {
    setSourceSectionId(secId);
    setNotice('');
    const sec = sections.find((s: any) => s.id === secId);
    if (sec) {
      const matching = allStudents.filter(
        (st: any) =>
          st.section === sec.name ||
          st.sectionName === sec.name ||
          st.sectionId === sec.id ||
          st.section_id === sec.id
      );
      setSelectedStudentIds(matching.map((st: any) => st.id || st.userId));
    } else {
      setSelectedStudentIds([]);
    }
  };

  const handleToggleSelectAllStudents = () => {
    if (selectedStudentIds.length === filteredSectionStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredSectionStudents.map((st: any) => st.id || st.userId));
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
      setNotice(
        `Successfully ${action === 'promote' ? 'promoted' : 'graduated'} ${res.count || selectedStudentIds.length} student(s).`
      );
      setSourceSectionId('');
      setSelectedStudentIds([]);
      await load(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to execute batch promotion');
    } finally {
      setBusy(false);
    }
  };

  // Filtered sections
  const filteredSections = useMemo(() => {
    return sections.filter((s: any) => {
      const matchesSearch =
        !sectionSearch.trim() ||
        s.name?.toLowerCase().includes(sectionSearch.toLowerCase()) ||
        s.programName?.toLowerCase().includes(sectionSearch.toLowerCase());
      const matchesProgram =
        sectionProgramFilter === 'all' || s.programName?.toLowerCase() === sectionProgramFilter.toLowerCase();
      return matchesSearch && matchesProgram;
    });
  }, [sections, sectionSearch, sectionProgramFilter]);

  // Filtered subjects
  const filteredSubjects = useMemo(() => {
    if (!subjectSearch.trim()) return subjects;
    const q = subjectSearch.toLowerCase();
    return subjects.filter(
      (sub: any) => sub.name?.toLowerCase().includes(q) || sub.code?.toLowerCase().includes(q)
    );
  }, [subjects, subjectSearch]);

  // Filtered curriculum
  const filteredCurriculum = useMemo(() => {
    return curriculum.filter((c: any) => {
      const matchesGrade =
        !selectedClassGrade ||
        c.grade === selectedClassGrade ||
        c.grade === `Class ${selectedClassGrade}` ||
        c.grade?.replace(/^Class\s*/i, '') === selectedClassGrade.replace(/^Class\s*/i, '');
      const matchesSearch =
        !curriculumSearch.trim() ||
        c.chapter?.toLowerCase().includes(curriculumSearch.toLowerCase()) ||
        c.subject?.toLowerCase().includes(curriculumSearch.toLowerCase()) ||
        c.unit?.toLowerCase().includes(curriculumSearch.toLowerCase());
      return matchesGrade && matchesSearch;
    });
  }, [curriculum, selectedClassGrade, curriculumSearch]);

  // Filtered events
  const filteredEvents = useMemo(() => {
    if (calendarFilter === 'all') return events;
    return events.filter((ev: any) => {
      const cat = (ev.category || ev.type || '').toLowerCase();
      if (calendarFilter === 'ptm') return cat.includes('ptm') || cat.includes('meeting') || cat.includes('parent');
      if (calendarFilter === 'exam') return cat.includes('exam') || cat.includes('test') || cat.includes('assessment');
      return true;
    });
  }, [events, calendarFilter]);

  // Subtabs configuration (NO numbers in labels as requested!)
  const SUBTABS = [
    { id: 'structure', label: 'Academic Years', icon: Calendar },
    { id: 'sections', label: 'Sections & Programs', icon: Layers },
    { id: 'subjects', label: 'Subjects', icon: BookOpen },
    { id: 'curriculum', label: 'Curriculum & LOs', icon: Award },
    { id: 'calendar', label: 'Academic Calendar', icon: Clock },
    { id: 'promotions', label: 'Batch Rollover & Promotion', icon: ArrowRight },
  ] as const;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        width: '100%',
        boxSizing: 'border-box',
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      <style>{`
        @keyframes edopsShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .edops-skeleton {
          background: linear-gradient(90deg, #EDF2F7 25%, #F7FAFC 50%, #EDF2F7 75%);
          background-size: 200% 100%;
          animation: edopsShimmer 1.4s ease-in-out infinite;
          border-radius: 4px;
        }
        .edops-skeleton-kpi {
          background: linear-gradient(90deg, rgba(255, 255, 255, 0.35) 25%, rgba(255, 255, 255, 0.75) 50%, rgba(255, 255, 255, 0.35) 75%);
          background-size: 200% 100%;
          animation: edopsShimmer 1.4s ease-in-out infinite;
          border-radius: 4px;
        }

        @keyframes edopsSlideInRight {
          from {
            transform: translateX(100%);
            opacity: 0.6;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes edopsFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

      {/* ── 1. PAGE HEADER & RELEVANT CONTEXTUAL ACTION BUTTON ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          width: '100%',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', minWidth: 0, flex: 1 }}>
          <h1
            style={{
              margin: 0,
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 600,
              fontSize: '22px',
              lineHeight: '30px',
              color: S.navy,
              letterSpacing: '-0.02em',
            }}
          >
            Academic Structure
          </h1>
          <p
            style={{
              margin: 0,
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 400,
              fontSize: '13px',
              lineHeight: '150%',
              color: S.slate,
            }}
          >
            Manage academic sessions, class sections, course syllabi, and student promotions.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flexShrink: 0 }}>
          {/* Contextual primary action button aligned to current active tab */}
          {tab === 'structure' && (
            <button
              type="button"
              onClick={() => onOpenQuickAction('year')}
              style={{
                boxSizing: 'border-box',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                height: '36px',
                padding: '0 16px',
                background: S.navy,
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12.5px',
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#1B3554')}
              onMouseLeave={(e) => (e.currentTarget.style.background = S.navy)}
            >
              <Plus size={15} strokeWidth={2} />
              Academic Year
            </button>
          )}

          {tab === 'sections' && (
            <button
              type="button"
              onClick={() => onOpenQuickAction('section')}
              style={{
                boxSizing: 'border-box',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                height: '36px',
                padding: '0 16px',
                background: S.navy,
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12.5px',
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#1B3554')}
              onMouseLeave={(e) => (e.currentTarget.style.background = S.navy)}
            >
              <Plus size={15} strokeWidth={2} />
              Section
            </button>
          )}

          {tab === 'subjects' && (
            <button
              type="button"
              onClick={handleOpenCreateSubject}
              style={{
                boxSizing: 'border-box',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                height: '36px',
                padding: '0 16px',
                background: S.navy,
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12.5px',
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#1B3554')}
              onMouseLeave={(e) => (e.currentTarget.style.background = S.navy)}
            >
              <Plus size={15} strokeWidth={2} />
              Subject
            </button>
          )}

          {tab === 'curriculum' && (
            <button
              type="button"
              onClick={() => setShowAddChapter(true)}
              style={{
                boxSizing: 'border-box',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                height: '36px',
                padding: '0 16px',
                background: S.navy,
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12.5px',
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#1B3554')}
              onMouseLeave={(e) => (e.currentTarget.style.background = S.navy)}
            >
              <Plus size={15} strokeWidth={2} />
              Syllabus Chapter
            </button>
          )}
        </div>
      </div>

      {/* ── 2. EXACT 4 COMMON KPI CARDS (Height 164px, 10px radius, Common for all tabs) ── */}
      {loading ? (
        <KpiSkeletonGrid />
      ) : (
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          {/* Card 1: Academic Years (Pastel Violet) */}
          <article
            onClick={() => {
              setTab('structure');
              setNotice('');
              if (onTabChange) onTabChange('structure');
            }}
            style={{
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '164px',
              padding: '20px',
              gap: '12px',
              background: '#E0D3FF',
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
              }}
            >
              <span
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 600,
                  fontSize: '10px',
                  lineHeight: '15px',
                  color: '#51249A',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                ACADEMIC YEARS
              </span>
              <Calendar size={19} strokeWidth={1.8} style={{ color: '#51249A' }} />
            </div>
            <p
              style={{
                margin: 0,
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 700,
                fontSize: '34px',
                lineHeight: '115%',
                color: S.navy,
              }}
            >
              {displayVal(years.length)}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', width: '100%' }}>
              <span
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 400,
                  fontSize: '10px',
                  lineHeight: '150%',
                  color: '#51249A',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {currentAcademicYear?.name ? `Current: ${currentAcademicYear.name}` : 'No active session'}
              </span>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  width: '100%',
                }}
              >
                <span
                  style={{
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: 600,
                    fontSize: '10px',
                    lineHeight: '150%',
                    color: '#51249A',
                  }}
                >
                  Manage Years
                </span>
                <ArrowRight size={14} strokeWidth={1.8} style={{ color: '#51249A' }} />
              </div>
            </div>
          </article>

          {/* Card 2: Sections & Programs (Pastel Mint Green) */}
          <article
            onClick={() => {
              setTab('sections');
              setNotice('');
              if (onTabChange) onTabChange('sections');
            }}
            style={{
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '164px',
              padding: '20px',
              gap: '12px',
              background: '#D0EDC0',
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
              }}
            >
              <span
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 600,
                  fontSize: '10px',
                  lineHeight: '15px',
                  color: '#305E26',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                SECTIONS &amp; PROGRAMS
              </span>
              <Layers size={19} strokeWidth={1.8} style={{ color: '#305E26' }} />
            </div>
            <p
              style={{
                margin: 0,
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 700,
                fontSize: '34px',
                lineHeight: '115%',
                color: S.navy,
              }}
            >
              {displayVal(sections.length)}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', width: '100%' }}>
              <span
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 400,
                  fontSize: '10px',
                  lineHeight: '150%',
                  color: '#305E26',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {programs.length > 0 ? `Across ${programs.length} Grade Programs` : 'No grade programs'}
              </span>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  width: '100%',
                }}
              >
                <span
                  style={{
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: 600,
                    fontSize: '10px',
                    lineHeight: '150%',
                    color: '#305E26',
                  }}
                >
                  View Sections
                </span>
                <ArrowRight size={14} strokeWidth={1.8} style={{ color: '#305E26' }} />
              </div>
            </div>
          </article>

          {/* Card 3: Core Subjects (Pastel Sky Blue) */}
          <article
            onClick={() => {
              setTab('subjects');
              setNotice('');
              if (onTabChange) onTabChange('subjects');
            }}
            style={{
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '164px',
              padding: '20px',
              gap: '12px',
              background: '#BCE6F3',
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
              }}
            >
              <span
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 600,
                  fontSize: '10px',
                  lineHeight: '15px',
                  color: '#265F79',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                CORE SUBJECTS
              </span>
              <BookOpen size={19} strokeWidth={1.8} style={{ color: '#265F79' }} />
            </div>
            <p
              style={{
                margin: 0,
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 700,
                fontSize: '34px',
                lineHeight: '115%',
                color: S.navy,
              }}
            >
              {displayVal(subjects.length)}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', width: '100%' }}>
              <span
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 400,
                  fontSize: '10px',
                  lineHeight: '150%',
                  color: '#265F79',
                }}
              >
                Course syllabi registered
              </span>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  width: '100%',
                }}
              >
                <span
                  style={{
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: 600,
                    fontSize: '10px',
                    lineHeight: '150%',
                    color: '#265F79',
                  }}
                >
                  Manage Subjects
                </span>
                <ArrowRight size={14} strokeWidth={1.8} style={{ color: '#265F79' }} />
              </div>
            </div>
          </article>

          {/* Card 4: Curriculum & Learning Outcomes (Pastel Warm Coral) */}
          <article
            onClick={() => {
              setTab('curriculum');
              setNotice('');
              if (onTabChange) onTabChange('curriculum');
            }}
            style={{
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '164px',
              padding: '20px',
              gap: '12px',
              background: '#FADAC9',
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
              }}
            >
              <span
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 600,
                  fontSize: '10px',
                  lineHeight: '15px',
                  color: '#82401E',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                CURRICULUM &amp; LOS
              </span>
              <Award size={19} strokeWidth={1.8} style={{ color: '#82401E' }} />
            </div>
            <p
              style={{
                margin: 0,
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 700,
                fontSize: '34px',
                lineHeight: '115%',
                color: S.navy,
              }}
            >
              {displayVal(curriculum.length)}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', width: '100%' }}>
              <span
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 400,
                  fontSize: '10px',
                  lineHeight: '150%',
                  color: '#82401E',
                }}
              >
                Tracked learning outcomes
              </span>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  width: '100%',
                }}
              >
                <span
                  style={{
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: 600,
                    fontSize: '10px',
                    lineHeight: '150%',
                    color: '#82401E',
                  }}
                >
                  View Syllabus
                </span>
                <ArrowRight size={14} strokeWidth={1.8} style={{ color: '#82401E' }} />
              </div>
            </div>
          </article>
        </section>
      )}

      {/* ── 3. SUBTAB SELECTOR (NO Numbers in Tab Labels) ── */}
      <div
        role="tablist"
        className="edops-academic-subtabs"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          borderBottom: `1px solid ${S.border}`,
          overflowX: 'auto',
          width: '100%',
          boxSizing: 'border-box',
          padding: '0 4px',
        }}
      >
        {SUBTABS.map((item) => {
          const Icon = item.icon;
          const isActive = tab === item.id;
          return (
            <button
              key={item.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => {
                setTab(item.id as any);
                setNotice('');
                if (onTabChange) onTabChange(item.id as any);
              }}
              style={{
                boxSizing: 'border-box',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 2px',
                background: 'transparent',
                border: 'none',
                borderBottom: isActive ? `3px solid ${S.navy}` : '3px solid transparent',
                marginBottom: '-1px',
                cursor: 'pointer',
                fontSize: '13.5px',
                fontFamily: "'Poppins', sans-serif",
                fontWeight: isActive ? 600 : 500,
                color: isActive ? S.navy : S.slate,
                whiteSpace: 'nowrap',
                flexShrink: 0,
                outline: 'none',
                transition: 'color 0.15s ease',
                letterSpacing: '-0.01em',
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.color = S.navy;
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.color = S.slate;
              }}
            >
              <Icon
                size={16}
                strokeWidth={isActive ? 2 : 1.75}
                style={{
                  color: isActive ? S.navy : '#7B8C9E',
                  transition: 'color 0.15s ease',
                }}
              />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Feedback Messages */}
      {error && (
        <div
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            background: '#FEF3F2',
            border: '1px solid #FECDCA',
            borderRadius: '8px',
            color: '#B42318',
            fontSize: '13px',
            fontFamily: "'Poppins', sans-serif",
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
          <button
            onClick={() => load(true)}
            style={{
              textDecoration: 'underline',
              cursor: 'pointer',
              background: 'none',
              border: 'none',
              color: '#B42318',
              fontWeight: 600,
              fontSize: '12.5px',
            }}
          >
            Retry
          </button>
        </div>
      )}

      {notice && (
        <div
          role="status"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            background: S.greenBg,
            border: `1px solid ${S.border}`,
            borderRadius: '8px',
            color: S.greenDk,
            fontSize: '13px',
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 500,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} />
            <span>{notice}</span>
          </div>
          <button
            onClick={() => setNotice('')}
            style={{
              cursor: 'pointer',
              background: 'none',
              border: 'none',
              color: S.greenDk,
              padding: '2px',
            }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── 4. SUBTAB CONTENTS WITH SLEEK MINIMAL TABLES & SKELETON LOADING ── */}

      {/* SUBTAB 1: Academic Years */}
      {tab === 'structure' && (
        <div
          style={{
            background: '#FFFFFF',
            border: `1px solid ${S.border}`,
            borderRadius: '10px',
            boxShadow: '0 1px 3px rgba(12, 30, 51, 0.04)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px 24px',
              borderBottom: `1px solid ${S.border}`,
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: '16px',
                  fontWeight: 600,
                  color: S.navy,
                }}
              >
                Institutional Academic Sessions
              </h2>
            </div>
            <button
              onClick={() => onOpenQuickAction('year')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '6px',
                background: S.navy,
                color: '#FFFFFF',
                fontSize: '12.5px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                fontFamily: "'Poppins', sans-serif",
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#1B3554')}
              onMouseLeave={(e) => (e.currentTarget.style.background = S.navy)}
            >
              <Plus size={14} strokeWidth={2} />
              Academic Year
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr
                  style={{
                    background: '#F8FAFC',
                    borderBottom: `1px solid ${S.border}`,
                    color: S.slate,
                  }}
                >
                  <th style={{ padding: '12px 24px', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Academic Session
                  </th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Start Date
                  </th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    End Date
                  </th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Status
                  </th>
                  <th style={{ padding: '12px 24px', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'right' }}>
                    Dossier
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeletonRows rows={5} columns={5} />
                ) : years.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '32px' }}>
                      <NoResultState
                        title="No Academic Years Registered"
                        description="Establish your school's inaugural academic year to begin managing classes, curricula, and student cohorts."
                        actionLabel="Academic Year"
                        onAction={() => onOpenQuickAction('year')}
                      />
                    </td>
                  </tr>
                ) : (
                  years.map((y: any, i: number) => {
                    const isCur = Boolean(y.is_current);
                    return (
                      <tr
                        key={y.id || i}
                        onClick={() => setSelectedYearDossier(y)}
                        style={{
                          borderBottom: i === years.length - 1 ? 'none' : `1px solid ${S.border}`,
                          cursor: 'pointer',
                          transition: 'background 0.15s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td style={{ padding: '14px 24px', fontWeight: 600, color: S.navy }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '6px',
                                background: '#E0D3FF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#51249A',
                              }}
                            >
                              <Calendar size={16} />
                            </div>
                            <span>{y.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: '14px 18px', color: S.slate }}>{y.start_date || '—'}</td>
                        <td style={{ padding: '14px 18px', color: S.slate }}>{y.end_date || '—'}</td>
                        <td style={{ padding: '14px 18px' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '3px 10px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: 700,
                              background: isCur ? S.greenBg : S.chip,
                              color: isCur ? S.greenDk : S.slate,
                            }}
                          >
                            {isCur ? (
                              <>
                                <span
                                  style={{
                                    width: '6px',
                                    height: '6px',
                                    borderRadius: '50%',
                                    background: '#16A34A',
                                  }}
                                />
                                Active Session
                              </>
                            ) : (
                              'Concluded'
                            )}
                          </span>
                        </td>
                        <td style={{ padding: '14px 24px', textAlign: 'right' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '12px',
                              fontWeight: 600,
                              color: S.navy,
                            }}
                          >
                            View Dossier <ChevronRight size={14} />
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

      {/* SUBTAB 2: Sections & Programs */}
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

      {/* SUBTAB 3: Subjects */}
      {tab === 'subjects' && (
        <div
          style={{
            background: '#FFFFFF',
            border: `1px solid ${S.border}`,
            borderRadius: '10px',
            boxShadow: '0 1px 3px rgba(12, 30, 51, 0.04)',
            overflow: 'hidden',
          }}
        >
          <div
            className="edops-subjects-header"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px 24px',
              borderBottom: `1px solid ${S.border}`,
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: S.navy }}>
                Core Instructional Subjects
              </h2>
            </div>

            <div className="edops-subjects-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: '#FFFFFF',
                  border: `1px solid ${S.border}`,
                  borderRadius: '6px',
                  padding: '6px 10px',
                  gap: '6px',
                }}
              >
                <Search size={14} style={{ color: S.muted }} />
                <input
                  type="text"
                  placeholder="Search subjects..."
                  value={subjectSearch}
                  onChange={(e) => setSubjectSearch(e.target.value)}
                  style={{
                    border: 'none',
                    outline: 'none',
                    fontSize: '12.5px',
                    fontFamily: "'Poppins', sans-serif",
                    color: S.navy,
                    width: '180px',
                  }}
                />
              </div>

              <button
                onClick={handleOpenCreateSubject}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  background: S.navy,
                  color: '#FFFFFF',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: "'Poppins', sans-serif",
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#1B3554')}
                onMouseLeave={(e) => (e.currentTarget.style.background = S.navy)}
              >
                <Plus size={14} strokeWidth={2} />
                Subject
              </button>
            </div>
          </div>

          <div className="edops-subjects-table" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr
                  style={{
                    background: '#F8FAFC',
                    borderBottom: `1px solid ${S.border}`,
                    color: S.slate,
                  }}
                >
                  <th style={{ padding: '12px 24px', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Subject Name
                  </th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Code
                  </th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Assigned Faculty
                  </th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Status
                  </th>
                  <th style={{ padding: '12px 24px', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'right' }}>
                    Dossier
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeletonRows rows={5} columns={5} />
                ) : filteredSubjects.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '32px' }}>
                      <NoResultState
                        title="No Subjects Found"
                        description="No registered instructional subjects match your current search query."
                        onReset={subjectSearch ? () => setSubjectSearch('') : undefined}
                        actionLabel="Subject"
                        onAction={handleOpenCreateSubject}
                      />
                    </td>
                  </tr>
                ) : (
                  filteredSubjects.map((sub: any, i: number) => {
                    const assignedTeachers = Number(sub.assignedTeachersCount || 0);
                    return (
                      <tr
                        key={sub.id || i}
                        onClick={() => setSelectedSubjectDossier(sub)}
                        style={{
                          borderBottom: i === filteredSubjects.length - 1 ? 'none' : `1px solid ${S.border}`,
                          cursor: 'pointer',
                          transition: 'background 0.15s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td style={{ padding: '14px 24px', fontWeight: 600, color: S.navy }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '6px',
                                background: '#BCE6F3',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#265F79',
                              }}
                            >
                              <BookOpen size={16} />
                            </div>
                            <span>{sub.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: S.chip,
                              fontFamily: 'monospace',
                              fontWeight: 700,
                              fontSize: '11px',
                              color: S.navy,
                              letterSpacing: '0.04em',
                            }}
                          >
                            {sub.code || 'SUB'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px', color: S.slate }}>
                          {assignedTeachers > 0 ? `${assignedTeachers} Faculty assigned` : '-'}
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <span
                            style={{
                              padding: '3px 8px',
                              borderRadius: '10px',
                              fontSize: '11px',
                              fontWeight: 700,
                              background: S.greenBg,
                              color: S.greenDk,
                            }}
                          >
                            Active Curriculum
                          </span>
                        </td>
                        <td style={{ padding: '14px 24px', textAlign: 'right' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '12px',
                              fontWeight: 600,
                              color: S.navy,
                            }}
                          >
                            View Dossier <ChevronRight size={14} />
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

      {/* SUBTAB 4: Curriculum & LOs (Polished NO Number Layout) */}
      {tab === 'curriculum' && (
        <div style={{ display: 'grid', gap: '20px' }}>
          {/* Header & Controls */}
          <div
            className="edops-curriculum-header"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: S.navy }}>
                Curriculum Syllabus &amp; Learning Outcome Registers
              </h3>
              <p style={{ margin: '3px 0 0', fontSize: '13px', color: S.slate }}>
                Select a grade program to monitor pacing, unit chapters, and learning outcomes in real time.
              </p>
            </div>
            <div className="edops-curriculum-controls" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  display: 'flex',
                  background: S.chip,
                  borderRadius: '6px',
                  padding: '3px',
                  border: `1px solid ${S.border}`,
                }}
              >
                <button
                  type="button"
                  onClick={() => setCurriculumViewMode('grid')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '5px',
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
                    borderRadius: '5px',
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

              <button
                type="button"
                onClick={handleOpenCreateSubject}
                style={{
                  padding: '6px 14px',
                  background: '#FFFFFF',
                  color: S.navy,
                  border: `1px solid ${S.border}`,
                  borderRadius: '6px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFFFF')}
              >
                <Plus size={14} strokeWidth={2} />
                New Subject
              </button>

              <button
                type="button"
                onClick={() => setShowAddChapter(true)}
                style={{
                  padding: '6px 14px',
                  background: S.navy,
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#1B3554')}
                onMouseLeave={(e) => (e.currentTarget.style.background = S.navy)}
              >
                <Plus size={14} strokeWidth={2} />
                Syllabus Chapter
              </button>
            </div>
          </div>

          {/* 1. Class Selector Pill Strip (NO NUMBERS IN PILLS) */}
          <div
            style={{
              background: '#FFFFFF',
              border: `1px solid ${S.border}`,
              borderRadius: '10px',
              padding: '12px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              overflowX: 'auto',
            }}
          >
            <span
              style={{
                fontSize: '12.5px',
                fontWeight: 600,
                color: S.navy,
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Layers size={15} /> Select Class:
            </span>
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', flex: 1, paddingBottom: '2px' }}>
              {programs.length === 0 ? (
                <span style={{ fontSize: '12px', color: S.slate }}>
                  No grade programs registered yet.
                </span>
              ) : (
                programs.map((p: any) => {
                  const isSelected = selectedClassGrade === p.name || (!selectedClassGrade && p === programs[0]);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedClassGrade(p.name)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        border: isSelected ? `2px solid ${S.navy}` : `1px solid ${S.border}`,
                        background: isSelected ? S.navy : S.chip,
                        color: isSelected ? '#FFFFFF' : S.navy,
                        fontWeight: isSelected ? 700 : 500,
                        fontSize: '12.5px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {p.name}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* 2. Subject Grid View */}
          {curriculumViewMode === 'grid' && (
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '14px',
                }}
              >
                <span style={{ fontSize: '13.5px', fontWeight: 600, color: S.navy }}>
                  Instructional Subjects for {selectedClassGrade || 'Selected Class'}
                </span>
                <span style={{ fontSize: '12px', color: S.slate }}>
                  Click card to inspect dossier or build syllabus in bulk
                </span>
              </div>

              {loading ? (
                <SubjectGridSkeleton />
              ) : subjects.length === 0 ? (
                <NoResultState
                  title="No Subjects Registered"
                  description="Add core subjects first (e.g. Mathematics, Science, English) to begin building class curricula."
                  actionLabel="Create Subject"
                  onAction={handleOpenCreateSubject}
                />
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
                    gap: '16px',
                  }}
                >
                  {subjects.map((sub: any) => {
                    const subjectChapters = curriculum.filter(
                      (c: any) =>
                        (c.grade === selectedClassGrade ||
                          c.grade === `Class ${selectedClassGrade}` ||
                          (selectedClassGrade &&
                            c.grade?.replace(/^Class\s*/i, '') === selectedClassGrade.replace(/^Class\s*/i, ''))) &&
                        (c.subjectId === sub.id || c.subject?.toLowerCase() === sub.name?.toLowerCase())
                    );
                    const totalCh = subjectChapters.length;
                    const avgProgress =
                      totalCh > 0
                        ? Math.round(
                            subjectChapters.reduce((acc: number, c: any) => acc + (Number(c.completionPct) || 0), 0) /
                              totalCh
                          )
                        : 0;

                    return (
                      <div
                        key={sub.id}
                        style={{
                          background: '#FFFFFF',
                          border: `1px solid ${S.border}`,
                          borderRadius: '10px',
                          padding: '18px 20px',
                          transition: 'all 0.18s ease',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '14px',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                color: S.slate,
                                background: S.chip,
                                padding: '2px 7px',
                                borderRadius: '4px',
                                letterSpacing: '0.04em',
                              }}
                            >
                              {sub.code || 'SUBJECT'}
                            </span>
                            <h4
                              style={{
                                margin: '8px 0 2px',
                                fontSize: '16px',
                                fontWeight: 700,
                                color: S.navy,
                              }}
                            >
                              {sub.name}
                            </h4>
                            <span style={{ fontSize: '12px', color: S.slate }}>
                              {selectedClassGrade || 'Class'}
                            </span>
                          </div>
                          <div
                            onClick={() => setSelectedSubjectDossier(sub)}
                            title="Inspect Subject Dossier"
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '8px',
                              background: '#BCE6F3',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#265F79',
                              cursor: 'pointer',
                              transition: 'transform 0.15s ease',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                          >
                            <BookOpen size={18} />
                          </div>
                        </div>

                        <div>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: '12px',
                              marginBottom: '6px',
                            }}
                          >
                            <span style={{ color: S.slate, fontWeight: 500 }}>
                              {totalCh > 0 ? `${totalCh} Chapters Mapped` : 'No chapters mapped'}
                            </span>
                            <span style={{ color: S.navy, fontWeight: 700 }}>{avgProgress}% Covered</span>
                          </div>
                          <div style={{ height: '6px', background: S.chip, borderRadius: '4px', overflow: 'hidden' }}>
                            <div
                              style={{
                                height: '100%',
                                width: `${avgProgress}%`,
                                background: avgProgress >= 100 ? '#16A34A' : S.navy,
                                borderRadius: '4px',
                                transition: 'width 0.3s ease',
                              }}
                            />
                          </div>
                        </div>

                        <div
                          style={{
                            paddingTop: '10px',
                            borderTop: `1px solid ${S.border}`,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => setSelectedSubjectDossier(sub)}
                            style={{
                              all: 'unset',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: 600,
                              color: S.slate,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            Dossier <ChevronRight size={13} />
                          </button>



                          <button
                            type="button"
                            onClick={() => {
                              setActiveModalSubject(sub);
                              setBulkRows([
                                {
                                  unitName: 'Unit 1',
                                  chapterName: '',
                                  expectedCompletionWeek: String(totalCh + 1),
                                  learningOutcomes: '',
                                },
                                {
                                  unitName: 'Unit 1',
                                  chapterName: '',
                                  expectedCompletionWeek: String(totalCh + 2),
                                  learningOutcomes: '',
                                },
                                {
                                  unitName: 'Unit 2',
                                  chapterName: '',
                                  expectedCompletionWeek: String(totalCh + 3),
                                  learningOutcomes: '',
                                },
                              ]);
                            }}
                            style={{
                              padding: '5px 12px',
                              borderRadius: '6px',
                              background: S.navy,
                              color: '#FFFFFF',
                              fontSize: '11.5px',
                              fontWeight: 600,
                              border: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            Manage Syllabus <ChevronRight size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 3. Full Table View (NO NUMBERS IN HEADERS) */}
          {curriculumViewMode === 'table' && (
            <div
              style={{
                background: '#FFFFFF',
                border: `1px solid ${S.border}`,
                borderRadius: '10px',
                boxShadow: '0 1px 3px rgba(12, 30, 51, 0.04)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '20px 24px',
                  borderBottom: `1px solid ${S.border}`,
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div>
                  <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: S.navy }}>
                    Curriculum Chapter Registers
                  </h4>
                  <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: S.slate }}>
                    Comprehensive list of syllabus chapters across academic departments.
                  </p>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: '#FFFFFF',
                    border: `1px solid ${S.border}`,
                    borderRadius: '6px',
                    padding: '6px 10px',
                    gap: '6px',
                  }}
                >
                  <Search size={14} style={{ color: S.muted }} />
                  <input
                    type="text"
                    placeholder="Search chapters or topics..."
                    value={curriculumSearch}
                    onChange={(e) => setCurriculumSearch(e.target.value)}
                    style={{
                      border: 'none',
                      outline: 'none',
                      fontSize: '12.5px',
                      fontFamily: "'Poppins', sans-serif",
                      color: S.navy,
                      width: '200px',
                    }}
                  />
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                  <thead>
                    <tr
                      style={{
                        background: '#F8FAFC',
                        borderBottom: `1px solid ${S.border}`,
                        color: S.slate,
                      }}
                    >
                      <th style={{ padding: '12px 24px', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Grade</th>
                      <th style={{ padding: '12px 18px', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Subject</th>
                      <th style={{ padding: '12px 18px', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Unit / Theme</th>
                      <th style={{ padding: '12px 18px', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Chapter Title</th>
                      <th style={{ padding: '12px 18px', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Target Week</th>
                      <th style={{ padding: '12px 18px', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Pacing</th>
                      <th style={{ padding: '12px 18px', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Status</th>
                      <th style={{ padding: '12px 24px', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <TableSkeletonRows rows={6} columns={8} />
                    ) : filteredCurriculum.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ padding: '32px' }}>
                          <NoResultState
                            title="No Curriculum Entries Found"
                            description="No chapters matched your criteria. Add new chapters using the action buttons above."
                            onReset={curriculumSearch ? () => setCurriculumSearch('') : undefined}
                            actionLabel="Syllabus Chapter"
                            onAction={() => setShowAddChapter(true)}
                          />
                        </td>
                      </tr>
                    ) : (
                      filteredCurriculum.map((c: any, i: number) => (
                        <tr
                          key={c.id || i}
                          style={{
                            borderBottom: i === filteredCurriculum.length - 1 ? 'none' : `1px solid ${S.border}`,
                            transition: 'background 0.15s ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <td style={{ padding: '14px 24px', fontWeight: 700, color: S.navy }}>{c.grade}</td>
                          <td style={{ padding: '14px 18px', color: S.slate }}>{c.subject}</td>
                          <td style={{ padding: '14px 18px', color: S.slate }}>{c.unit || 'General'}</td>
                          <td style={{ padding: '14px 18px', fontWeight: 600, color: S.navy }}>{c.chapter}</td>
                          <td style={{ padding: '14px 18px', color: S.slate }}>
                            Week {c.expectedWeek || c.expected_completion_week || 10}
                          </td>
                          <td style={{ padding: '14px 18px', fontWeight: 600, color: S.navy }}>
                            {c.completionPct || 0}%
                          </td>
                          <td style={{ padding: '14px 18px' }}>
                            <span
                              style={{
                                padding: '3px 8px',
                                borderRadius: '10px',
                                fontSize: '11px',
                                fontWeight: 700,
                                background: S.greenBg,
                                color: S.greenDk,
                              }}
                            >
                              {c.status || 'On Track'}
                            </span>
                          </td>
                          <td style={{ padding: '14px 24px', textAlign: 'right' }}>
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

          {/* 4. Single Chapter Modal (Stacked High at zIndex: 1200) */}
          {showAddChapter && (
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
                zIndex: 1200,
                padding: '16px',
              }}
              onClick={(e) => {
                if (e.target === e.currentTarget && !chapterBusy) setShowAddChapter(false);
              }}
            >
              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: '12px',
                  width: '100%',
                  maxWidth: '560px',
                  maxHeight: '90vh',
                  overflowY: 'auto',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div
                  style={{
                    padding: '18px 24px',
                    borderBottom: `1px solid ${S.border}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: '#FAFAFB',
                    borderTopLeftRadius: '12px',
                    borderTopRightRadius: '12px',
                  }}
                >
                  <div>
                    <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: S.navy }}>
                      Create Syllabus Chapter
                    </h3>
                    <p style={{ margin: '3px 0 0', fontSize: '12px', color: S.slate }}>
                      Add a unit chapter module and assign its target instructional week.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddChapter(false)}
                    disabled={chapterBusy}
                    style={{
                      border: `1px solid ${S.border}`,
                      background: '#FFFFFF',
                      borderRadius: '6px',
                      width: '30px',
                      height: '30px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: S.slate,
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>

                <form onSubmit={handleSaveCurriculumChapter} style={{ padding: '24px', display: 'grid', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <label style={{ display: 'grid', gap: '4px', fontSize: '12px', fontWeight: 600, color: S.navy }}>
                      <span>Class / Grade <span style={{ color: '#D92D20' }}>*</span></span>
                      <select
                        required
                        value={chapterGrade}
                        onChange={(e) => setChapterGrade(e.target.value)}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '6px',
                          border: `1px solid ${S.border}`,
                          fontSize: '12.5px',
                          background: '#FFFFFF',
                          color: S.navy,
                        }}
                      >
                        <option value="">Select Class...</option>
                        {programs.map((p: any) => (
                          <option key={p.id} value={p.name}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label style={{ display: 'grid', gap: '4px', fontSize: '12px', fontWeight: 600, color: S.navy }}>
                      <span>Subject <span style={{ color: '#D92D20' }}>*</span></span>
                      <select
                        required
                        value={chapterSubjectId}
                        onChange={(e) => {
                          setChapterSubjectId(e.target.value);
                          const s = subjects.find((sub: any) => sub.id === e.target.value);
                          if (s) setChapterSubjectName(s.name);
                        }}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '6px',
                          border: `1px solid ${S.border}`,
                          fontSize: '12.5px',
                          background: '#FFFFFF',
                          color: S.navy,
                        }}
                      >
                        <option value="">Select Subject...</option>
                        {subjects.map((sub: any) => (
                          <option key={sub.id} value={sub.id}>
                            {sub.name} ({sub.code || 'SUB'})
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                    <label style={{ display: 'grid', gap: '4px', fontSize: '12px', fontWeight: 600, color: S.navy }}>
                      <span>Unit / Theme Name</span>
                      <input
                        type="text"
                        value={chapterUnit}
                        onChange={(e) => setChapterUnit(e.target.value)}
                        placeholder="e.g. Unit 1: Foundations"
                        style={{
                          padding: '8px 10px',
                          borderRadius: '6px',
                          border: `1px solid ${S.border}`,
                          fontSize: '12.5px',
                        }}
                      />
                    </label>

                    <label style={{ display: 'grid', gap: '4px', fontSize: '12px', fontWeight: 600, color: S.navy }}>
                      <span>Target Week (1–52)</span>
                      <input
                        type="number"
                        min="1"
                        max="52"
                        value={chapterWeek}
                        onChange={(e) => setChapterWeek(e.target.value)}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '6px',
                          border: `1px solid ${S.border}`,
                          fontSize: '12.5px',
                        }}
                      />
                    </label>
                  </div>

                  <label style={{ display: 'grid', gap: '4px', fontSize: '12px', fontWeight: 600, color: S.navy }}>
                    <span>Chapter Name <span style={{ color: '#D92D20' }}>*</span></span>
                    <input
                      type="text"
                      required
                      value={chapterName}
                      onChange={(e) => setChapterName(e.target.value)}
                      placeholder="e.g. Linear Equations in Two Variables"
                      style={{
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: `1px solid ${S.border}`,
                        fontSize: '13px',
                        fontWeight: 600,
                        color: S.navy,
                      }}
                    />
                  </label>

                  <label style={{ display: 'grid', gap: '4px', fontSize: '12px', fontWeight: 600, color: S.navy }}>
                    <span>Key Learning Outcomes (Optional)</span>
                    <textarea
                      rows={3}
                      value={chapterOutcomes}
                      onChange={(e) => setChapterOutcomes(e.target.value)}
                      placeholder="Comma-separated topics or outcomes, e.g. Graphical method, elimination, substitution"
                      style={{
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: `1px solid ${S.border}`,
                        fontSize: '12px',
                        fontFamily: "'Poppins', sans-serif",
                      }}
                    />
                  </label>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                    <button
                      type="button"
                      onClick={() => setShowAddChapter(false)}
                      disabled={chapterBusy}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '6px',
                        border: `1px solid ${S.border}`,
                        background: '#FFFFFF',
                        fontSize: '12.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        color: S.slate,
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={chapterBusy}
                      style={{
                        padding: '8px 20px',
                        borderRadius: '6px',
                        border: 'none',
                        background: S.navy,
                        color: '#FFFFFF',
                        fontSize: '12.5px',
                        fontWeight: 600,
                        cursor: chapterBusy ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {chapterBusy ? 'Saving...' : 'Save Chapter'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* 5. Bulk Syllabus Builder Modal (Stacked High at zIndex: 1200) */}
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
                zIndex: 1200,
                padding: '16px',
              }}
              onClick={(e) => {
                if (e.target === e.currentTarget && !bulkSaving) setActiveModalSubject(null);
              }}
            >
              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: '12px',
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
                <div
                  style={{
                    padding: '20px 24px',
                    borderBottom: `1px solid ${S.border}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: '#FAFAFB',
                    borderTopLeftRadius: '12px',
                    borderTopRightRadius: '12px',
                  }}
                >
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
                      Add or edit all chapters, units, and learning outcomes for this subject simultaneously.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveModalSubject(null)}
                    disabled={bulkSaving}
                    style={{
                      border: `1px solid ${S.border}`,
                      background: '#FFFFFF',
                      borderRadius: '6px',
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
                          (selectedClassGrade &&
                            c.grade?.replace(/^Class\s*/i, '') === selectedClassGrade.replace(/^Class\s*/i, ''))) &&
                        (c.subjectId === activeModalSubject.id ||
                          c.subject?.toLowerCase() === activeModalSubject.name?.toLowerCase())
                    );
                    if (savedSubjectChapters.length === 0) return null;
                    return (
                      <div
                        style={{
                          background: '#F8FAFC',
                          border: `1px solid ${S.border}`,
                          borderRadius: '8px',
                          padding: '16px',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '10px',
                          }}
                        >
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
                                <span
                                  style={{
                                    width: '22px',
                                    height: '22px',
                                    borderRadius: '50%',
                                    background: S.chip,
                                    color: S.navy,
                                    fontWeight: 700,
                                    fontSize: '11px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
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
                                <span
                                  style={{
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    color: sc.completionPct >= 100 ? S.greenDk : S.navy,
                                    background: sc.completionPct >= 100 ? S.greenBg : S.chip,
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                  }}
                                >
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
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '12px',
                      }}
                    >
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
                          fontWeight: 600,
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
                          <tr
                            style={{
                              background: '#F8FAFC',
                              borderBottom: `1px solid ${S.border}`,
                              color: S.slate,
                              textAlign: 'left',
                            }}
                          >
                            <th style={{ padding: '8px 10px', width: '40px' }}>#</th>
                            <th style={{ padding: '8px 10px', width: '160px' }}>Unit / Theme</th>
                            <th style={{ padding: '8px 10px' }}>
                              Chapter Title <span style={{ color: '#D92D20' }}>*</span>
                            </th>
                            <th style={{ padding: '8px 10px', width: '90px' }}>Week (1–52)</th>
                            <th style={{ padding: '8px 10px' }}>Learning Outcomes / Topics</th>
                            <th style={{ padding: '8px 10px', width: '40px', textAlign: 'center' }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {bulkRows.map((row, idx) => (
                            <tr
                              key={idx}
                              style={{
                                borderBottom: idx === bulkRows.length - 1 ? 'none' : `1px solid ${S.border}`,
                              }}
                            >
                              <td style={{ padding: '8px 10px', color: S.slate, fontWeight: 700 }}>{idx + 1}</td>
                              <td style={{ padding: '8px 10px' }}>
                                <input
                                  type="text"
                                  value={row.unitName}
                                  onChange={(e) => {
                                    const next = [...bulkRows];
                                    next[idx].unitName = e.target.value;
                                    setBulkRows(next);
                                  }}
                                  placeholder="e.g. Unit 1"
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

                    <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={() => setActiveModalSubject(null)}
                        disabled={bulkSaving}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '6px',
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
                          borderRadius: '6px',
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
                        {bulkSaving ? 'Saving...' : 'Save All Chapters'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 5: Academic Calendar */}
      {tab === 'calendar' && (
        <div
          style={{
            background: '#FFFFFF',
            border: `1px solid ${S.border}`,
            borderRadius: '10px',
            boxShadow: '0 1px 3px rgba(12, 30, 51, 0.04)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px 24px',
              borderBottom: `1px solid ${S.border}`,
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: S.navy }}>
                Institutional Calendar &amp; Academic Events
              </h2>
              <p style={{ margin: '3px 0 0', fontSize: '13px', color: S.slate }}>
                Scheduled examinations, parent-teacher conferences, and institutional terms.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {(['all', 'ptm', 'exam'] as const).map((filterKey) => (
                <button
                  key={filterKey}
                  type="button"
                  onClick={() => setCalendarFilter(filterKey)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    border: calendarFilter === filterKey ? `1px solid ${S.navy}` : `1px solid ${S.border}`,
                    background: calendarFilter === filterKey ? S.navy : S.chip,
                    color: calendarFilter === filterKey ? '#FFFFFF' : S.navy,
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                  }}
                >
                  {filterKey === 'all' ? 'All Events' : filterKey.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr
                  style={{
                    background: '#F8FAFC',
                    borderBottom: `1px solid ${S.border}`,
                    color: S.slate,
                  }}
                >
                  <th style={{ padding: '12px 24px', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Event Title</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Scheduled Date</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Time Slot</th>
                  <th style={{ padding: '12px 24px', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Category</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeletonRows rows={4} columns={4} />
                ) : filteredEvents.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '32px' }}>
                      <NoResultState
                        title="No Calendar Events Scheduled"
                        description="No academic events, examinations, or parent-teacher meets are currently listed on the calendar roster."
                        onReset={calendarFilter !== 'all' ? () => setCalendarFilter('all') : undefined}
                      />
                    </td>
                  </tr>
                ) : (
                  filteredEvents.map((ev: any, i: number) => (
                    <tr
                      key={ev.id || i}
                      style={{
                        borderBottom: i === filteredEvents.length - 1 ? 'none' : `1px solid ${S.border}`,
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '14px 24px', fontWeight: 600, color: S.navy }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Clock size={15} style={{ color: S.slate }} />
                          <span>{ev.title}</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 18px', color: S.slate }}>{ev.date}</td>
                      <td style={{ padding: '14px 18px', color: S.slate }}>{ev.time || 'All Day'}</td>
                      <td style={{ padding: '14px 24px' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '10px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: S.chip,
                            color: S.navy,
                          }}
                        >
                          {ev.category || 'Academic'}
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

      {/* SUBTAB 6: Batch Rollover & Promotions (Redesigned Minimal Executive Layout) */}
      {tab === 'promotions' && (
        <form
          onSubmit={handleExecutePromotion}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '20px',
            alignItems: 'start',
          }}
        >
          {/* Left Column: Rollover Pathway Config */}
          <div
            style={{
              background: '#FFFFFF',
              border: `1px solid ${S.border}`,
              borderRadius: '10px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(12, 30, 51, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: S.navy }}>
                Batch Promotion &amp; Rollover Configuration
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: S.slate }}>
                Select the cohort section to roll over into the next academic year.
              </p>
            </div>

            <div style={{ display: 'grid', gap: '14px' }}>
              {/* Source Section Selection */}
              <label style={{ display: 'grid', gap: '5px', fontSize: '12px', fontWeight: 600, color: S.navy }}>
                <span>Source Class Section <span style={{ color: '#D92D20' }}>*</span></span>
                <select
                  required
                  value={sourceSectionId}
                  onChange={(e) => handleSourceChange(e.target.value)}
                  style={{
                    padding: '9px 12px',
                    borderRadius: '6px',
                    border: `1px solid ${S.border}`,
                    fontSize: '13px',
                    background: '#FFFFFF',
                    color: S.navy,
                    outline: 'none',
                  }}
                >
                  <option value="">Select source section...</option>
                  {sections.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.programName} — Section {s.name} ({s.enrolledCount || 0} students)
                    </option>
                  ))}
                </select>
              </label>

              {/* Action Toggle Pills */}
              <div style={{ display: 'grid', gap: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: S.navy }}>
                  Rollover Action <span style={{ color: '#D92D20' }}>*</span>
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setAction('promote')}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: action === 'promote' ? `2px solid ${S.navy}` : `1px solid ${S.border}`,
                      background: action === 'promote' ? '#F8FAFC' : '#FFFFFF',
                      color: action === 'promote' ? S.navy : S.slate,
                      fontWeight: action === 'promote' ? 700 : 500,
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <GraduationCap size={18} style={{ color: action === 'promote' ? S.navy : S.slate }} />
                    <span>Promote Cohort</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAction('graduate')}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: action === 'graduate' ? `2px solid ${S.navy}` : `1px solid ${S.border}`,
                      background: action === 'graduate' ? '#F8FAFC' : '#FFFFFF',
                      color: action === 'graduate' ? S.navy : S.slate,
                      fontWeight: action === 'graduate' ? 700 : 500,
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Award size={18} style={{ color: action === 'graduate' ? S.navy : S.slate }} />
                    <span>Graduate (Alumni)</span>
                  </button>
                </div>
              </div>

              {action === 'promote' && (
                <>
                  <label style={{ display: 'grid', gap: '5px', fontSize: '12px', fontWeight: 600, color: S.navy }}>
                    <span>Target Academic Year <span style={{ color: '#D92D20' }}>*</span></span>
                    <select
                      required
                      value={targetYearId}
                      onChange={(e) => setTargetYearId(e.target.value)}
                      style={{
                        padding: '9px 12px',
                        borderRadius: '6px',
                        border: `1px solid ${S.border}`,
                        fontSize: '13px',
                        background: '#FFFFFF',
                        color: S.navy,
                        outline: 'none',
                      }}
                    >
                      <option value="">Select target academic year...</option>
                      {years.map((y: any) => (
                        <option key={y.id} value={y.id}>
                          {y.name} {y.is_current ? '(Current)' : ''}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label style={{ display: 'grid', gap: '5px', fontSize: '12px', fontWeight: 600, color: S.navy }}>
                    <span>Target Section <span style={{ color: '#D92D20' }}>*</span></span>
                    <select
                      required
                      value={targetSectionId}
                      onChange={(e) => setTargetSectionId(e.target.value)}
                      style={{
                        padding: '9px 12px',
                        borderRadius: '6px',
                        border: `1px solid ${S.border}`,
                        fontSize: '13px',
                        background: '#FFFFFF',
                        color: S.navy,
                        outline: 'none',
                      }}
                    >
                      <option value="">Select target section...</option>
                      {sections
                        .filter((s: any) => s.id !== sourceSectionId)
                        .map((s: any) => (
                          <option key={s.id} value={s.id}>
                            {s.programName} — Section {s.name}
                          </option>
                        ))}
                    </select>
                  </label>
                </>
              )}
            </div>

            {/* Pathway Summary Preview */}
            {sourceSection && (
              <div
                style={{
                  background: '#F8FAFC',
                  border: `1px solid ${S.border}`,
                  borderRadius: '8px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <span style={{ fontSize: '11px', fontWeight: 700, color: S.slate, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Rollover Pathway Preview
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', fontWeight: 600, color: S.navy }}>
                  <span>{sourceSection.programName} ({sourceSection.name})</span>
                  <ArrowRight size={14} style={{ color: S.slate }} />
                  <span>
                    {action === 'graduate'
                      ? 'Graduated Cohort'
                      : targetSection
                      ? `${targetSection.programName} (${targetSection.name})`
                      : 'Target Section'}
                  </span>
                </div>
                {action === 'promote' && targetYear && (
                  <span style={{ fontSize: '11.5px', color: S.slate }}>
                    Session: {targetYear.name}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Student Cohort Roster & Execution */}
          <div
            style={{
              background: '#FFFFFF',
              border: `1px solid ${S.border}`,
              borderRadius: '10px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(12, 30, 51, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: S.navy }}>
                  Eligible Student Cohort
                </h3>
                <span style={{ fontSize: '12px', color: S.slate }}>
                  {sourceSection
                    ? `${selectedStudentIds.length} of ${sectionStudents.length} students selected`
                    : 'Select a source section to load student roster'}
                </span>
              </div>

              {sourceSection && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      background: '#FFFFFF',
                      border: `1px solid ${S.border}`,
                      borderRadius: '6px',
                      padding: '4px 8px',
                      gap: '4px',
                    }}
                  >
                    <Search size={13} style={{ color: S.muted }} />
                    <input
                      type="text"
                      placeholder="Search roster..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      style={{
                        border: 'none',
                        outline: 'none',
                        fontSize: '12px',
                        fontFamily: "'Poppins', sans-serif",
                        color: S.navy,
                        width: '120px',
                      }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleToggleSelectAllStudents}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '6px',
                      border: `1px solid ${S.border}`,
                      background: '#FFFFFF',
                      color: S.navy,
                      fontSize: '11.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {selectedStudentIds.length === filteredSectionStudents.length && filteredSectionStudents.length > 0
                      ? 'Deselect All'
                      : 'Select All'}
                  </button>
                </div>
              )}
            </div>

            {!sourceSectionId ? (
              <div
                style={{
                  padding: '48px 20px',
                  textAlign: 'center',
                  background: '#F8FAFC',
                  borderRadius: '8px',
                  border: `1px dashed ${S.border}`,
                  color: S.slate,
                  fontSize: '13px',
                }}
              >
                <Users size={32} style={{ margin: '0 auto 8px', color: S.muted }} />
                <p style={{ margin: 0, fontWeight: 600, color: S.navy }}>No Source Section Selected</p>
                <p style={{ margin: '4px 0 0', fontSize: '12px' }}>
                  Choose a class section on the left to review and select students for rollover.
                </p>
              </div>
            ) : filteredSectionStudents.length === 0 ? (
              <div
                style={{
                  padding: '48px 20px',
                  textAlign: 'center',
                  background: '#F8FAFC',
                  borderRadius: '8px',
                  border: `1px solid ${S.border}`,
                  color: S.slate,
                  fontSize: '13px',
                }}
              >
                No active students found in this section.
              </div>
            ) : (
              <div
                style={{
                  maxHeight: '340px',
                  overflowY: 'auto',
                  border: `1px solid ${S.border}`,
                  borderRadius: '8px',
                  background: '#FFFFFF',
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: `1px solid ${S.border}`, color: S.slate }}>
                      <th style={{ padding: '8px 12px', width: '36px' }}></th>
                      <th style={{ padding: '8px 12px', fontWeight: 600 }}>Student Name</th>
                      <th style={{ padding: '8px 12px', fontWeight: 600 }}>Roll #</th>
                      <th style={{ padding: '8px 12px', fontWeight: 600 }}>Adm #</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSectionStudents.map((st: any, sIdx: number) => {
                      const studentId = st.id || st.userId;
                      const isChecked = selectedStudentIds.includes(studentId);
                      return (
                        <tr
                          key={studentId || sIdx}
                          onClick={() => {
                            setSelectedStudentIds((prev) =>
                              isChecked ? prev.filter((id) => id !== studentId) : [...prev, studentId]
                            );
                          }}
                          style={{
                            borderBottom: sIdx === filteredSectionStudents.length - 1 ? 'none' : `1px solid ${S.chip}`,
                            background: isChecked ? '#F0F9FF' : 'transparent',
                            cursor: 'pointer',
                            transition: 'background 0.1s ease',
                          }}
                        >
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              style={{ cursor: 'pointer' }}
                            />
                          </td>
                          <td style={{ padding: '10px 12px', fontWeight: 600, color: S.navy }}>
                            {st.name}
                          </td>
                          <td style={{ padding: '10px 12px', color: S.slate }}>{st.rollNo || '-'}</td>
                          <td style={{ padding: '10px 12px', color: S.slate }}>{st.admissionNo || '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {sourceSectionId && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '10px' }}>
                <button
                  type="submit"
                  disabled={busy || selectedStudentIds.length === 0}
                  style={{
                    padding: '10px 22px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 600,
                    background: S.navy,
                    color: '#FFFFFF',
                    border: 'none',
                    cursor: busy || selectedStudentIds.length === 0 ? 'not-allowed' : 'pointer',
                    opacity: busy || selectedStudentIds.length === 0 ? 0.5 : 1,
                    transition: 'background 0.15s ease',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#1B3554')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = S.navy)}
                >
                  {busy ? (
                    'Executing...'
                  ) : (
                    <>
                      <Check size={15} />
                      Execute {action === 'promote' ? 'Promotion' : 'Graduation'} ({selectedStudentIds.length} Students)
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </form>
      )}

      {/* ── 5. DOSSIER DRAWERS (SLIDE-IN FROM RIGHT WITH FIXED BOTTOM EDIT BUTTONS) ── */}

      {/* 1. ACADEMIC YEAR DOSSIER DRAWER (zIndex: 1050) */}
      {selectedYearDossier && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(12, 30, 51, 0.45)',
            backdropFilter: 'blur(3px)',
            zIndex: 1050,
            display: 'flex',
            justifyContent: 'flex-end',
            overflow: 'hidden',
          }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setSelectedYearDossier(null);
          }}
        >
          <aside
            className="edops-right-drawer"
            role="dialog"
            aria-modal="true"
            aria-label={`Academic Session - ${selectedYearDossier.name}`}
            style={{
              width: 'var(--edops-drawer-width)',
              maxWidth: '100vw',
              height: '100vh',
              background: '#FFFFFF',
              boxShadow: '-8px 0 32px rgba(12, 30, 51, 0.14)',
              display: 'flex',
              flexDirection: 'column',
              animation: 'edopsSlideInRight 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
              position: 'relative',
              zIndex: 1051,
              borderLeft: `1px solid ${S.border}`,
              fontFamily: "'Poppins', sans-serif",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '20px 24px',
                borderBottom: `1px solid ${S.border}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#FAFAFB',
              }}
            >
              <div>
                <span style={{ fontSize: '11.5px', color: S.slate, fontWeight: 500 }}>
                  Academic Session Dossier
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: S.navy }}>
                    {selectedYearDossier.name}
                  </h3>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: '10px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: selectedYearDossier.is_current ? S.greenBg : S.chip,
                      color: selectedYearDossier.is_current ? S.greenDk : S.slate,
                    }}
                  >
                    {selectedYearDossier.is_current ? 'Active Session' : 'Past Session'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedYearDossier(null)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  border: `1px solid ${S.border}`,
                  background: '#FFFFFF',
                  color: S.slate,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Stat Tiles */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ background: '#F8FAFC', border: `1px solid ${S.border}`, borderRadius: '8px', padding: '14px' }}>
                  <span style={{ fontSize: '11px', color: S.slate, fontWeight: 600, textTransform: 'uppercase' }}>
                    Start Date
                  </span>
                  <p style={{ margin: '4px 0 0', fontSize: '15px', fontWeight: 700, color: S.navy }}>
                    {selectedYearDossier.start_date || '—'}
                  </p>
                </div>
                <div style={{ background: '#F8FAFC', border: `1px solid ${S.border}`, borderRadius: '8px', padding: '14px' }}>
                  <span style={{ fontSize: '11px', color: S.slate, fontWeight: 600, textTransform: 'uppercase' }}>
                    End Date
                  </span>
                  <p style={{ margin: '4px 0 0', fontSize: '15px', fontWeight: 700, color: S.navy }}>
                    {selectedYearDossier.end_date || '—'}
                  </p>
                </div>
              </div>

              {/* Programs and Sections active in this year */}
              <div>
                <h4 style={{ margin: '0 0 10px', fontSize: '14px', fontWeight: 600, color: S.navy }}>
                  Active Grade Programs in this Session
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {programs.map((p: any) => (
                    <span
                      key={p.id}
                      style={{
                        padding: '6px 12px',
                        background: S.chip,
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: S.navy,
                      }}
                    >
                      {p.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Sticky Drawer Footer with Fixed Actions */}
            <div
              style={{
                marginTop: 'auto',
                padding: '16px 24px',
                borderTop: `1px solid ${S.border}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#FAFAFB',
                position: 'sticky',
                bottom: 0,
                zIndex: 10,
              }}
            >
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => handleOpenEditYear(selectedYearDossier)}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '6px',
                    background: S.navy,
                    color: '#FFFFFF',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 1px 3px rgba(12, 30, 51, 0.15)',
                  }}
                >
                  <Edit2 size={13} />
                  Edit Details
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedYearDossier(null);
                    onOpenQuickAction('year');
                  }}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '6px',
                    background: '#FFFFFF',
                    color: S.navy,
                    border: `1px solid ${S.border}`,
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Plus size={14} />
                  New Academic Year
                </button>
              </div>

              <button
                type="button"
                onClick={() => setSelectedYearDossier(null)}
                style={{
                  padding: '8px 18px',
                  borderRadius: '6px',
                  background: '#FFFFFF',
                  color: S.slate,
                  border: `1px solid ${S.border}`,
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Close Dossier
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* 2. SECTION 360° DOSSIER DRAWER (zIndex: 1050) */}
      {selectedSectionDossier && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(12, 30, 51, 0.45)',
            backdropFilter: 'blur(3px)',
            zIndex: 1050,
            display: 'flex',
            justifyContent: 'flex-end',
            overflow: 'hidden',
          }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setSelectedSectionDossier(null);
          }}
        >
          <aside
            className="edops-right-drawer"
            role="dialog"
            aria-modal="true"
            aria-label={`Section Profile - ${selectedSectionDossier.name}`}
            style={{
              width: 'var(--edops-drawer-width)',
              maxWidth: '100vw',
              height: '100vh',
              background: '#FFFFFF',
              boxShadow: '-8px 0 32px rgba(12, 30, 51, 0.14)',
              display: 'flex',
              flexDirection: 'column',
              animation: 'edopsSlideInRight 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
              position: 'relative',
              zIndex: 1051,
              borderLeft: `1px solid ${S.border}`,
              fontFamily: "'Poppins', sans-serif",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '20px 24px',
                borderBottom: `1px solid ${S.border}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#FAFAFB',
              }}
            >
              <div>
                <span style={{ fontSize: '11.5px', color: S.slate, fontWeight: 500 }}>
                  Section 360° Dossier
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: S.navy }}>
                    Section {selectedSectionDossier.name}
                  </h3>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: S.chip,
                      fontSize: '11px',
                      fontWeight: 600,
                      color: S.navy,
                    }}
                  >
                    {selectedSectionDossier.programName || 'Standard'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSectionDossier(null)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  border: `1px solid ${S.border}`,
                  background: '#FFFFFF',
                  color: S.slate,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Stat Tiles */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                <div style={{ background: '#F8FAFC', border: `1px solid ${S.border}`, borderRadius: '8px', padding: '12px' }}>
                  <span style={{ fontSize: '10.5px', color: S.slate, fontWeight: 600, textTransform: 'uppercase' }}>
                    Enrolled
                  </span>
                  <p style={{ margin: '4px 0 0', fontSize: '18px', fontWeight: 700, color: S.navy }}>
                    {selectedSectionDossier.enrolledCount || 0}
                  </p>
                </div>
                <div style={{ background: '#F8FAFC', border: `1px solid ${S.border}`, borderRadius: '8px', padding: '12px' }}>
                  <span style={{ fontSize: '10.5px', color: S.slate, fontWeight: 600, textTransform: 'uppercase' }}>
                    Capacity
                  </span>
                  <p style={{ margin: '4px 0 0', fontSize: '18px', fontWeight: 700, color: S.navy }}>
                    {selectedSectionDossier.capacity || 0}
                  </p>
                </div>
                <div style={{ background: '#F8FAFC', border: `1px solid ${S.border}`, borderRadius: '8px', padding: '12px' }}>
                  <span style={{ fontSize: '10.5px', color: S.slate, fontWeight: 600, textTransform: 'uppercase' }}>
                    Utilization
                  </span>
                  <p style={{ margin: '4px 0 0', fontSize: '18px', fontWeight: 700, color: S.navy }}>
                    {selectedSectionDossier.capacity > 0
                      ? `${Math.round(((selectedSectionDossier.enrolledCount || 0) / selectedSectionDossier.capacity) * 100)}%`
                      : '-'}
                  </p>
                </div>
              </div>

              {/* Enrolled Students Roster */}
              <div>
                <h4 style={{ margin: '0 0 10px', fontSize: '14px', fontWeight: 600, color: S.navy }}>
                  Enrolled Students in Section {selectedSectionDossier.name}
                </h4>
                {(() => {
                  const sStudents = allStudents.filter(
                    (st: any) =>
                      st.section === selectedSectionDossier.name ||
                      st.sectionName === selectedSectionDossier.name ||
                      st.sectionId === selectedSectionDossier.id
                  );
                  if (sStudents.length === 0) {
                    return (
                      <p style={{ fontSize: '12.5px', color: S.slate, margin: 0 }}>
                        No enrolled students found in this section roster.
                      </p>
                    );
                  }
                  return (
                    <div style={{ border: `1px solid ${S.border}`, borderRadius: '8px', overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ background: '#F8FAFC', borderBottom: `1px solid ${S.border}`, color: S.slate }}>
                            <th style={{ padding: '8px 12px', fontWeight: 600 }}>Roll #</th>
                            <th style={{ padding: '8px 12px', fontWeight: 600 }}>Student Name</th>
                            <th style={{ padding: '8px 12px', fontWeight: 600 }}>Admission #</th>
                            <th style={{ padding: '8px 12px', fontWeight: 600 }}>Attendance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sStudents.map((st: any, idx: number) => (
                            <tr
                              key={st.id || idx}
                              style={{
                                borderBottom: idx === sStudents.length - 1 ? 'none' : `1px solid ${S.chip}`,
                              }}
                            >
                              <td style={{ padding: '8px 12px', fontWeight: 600, color: S.navy }}>
                                {st.rollNo || '-'}
                              </td>
                              <td style={{ padding: '8px 12px', fontWeight: 600, color: S.navy }}>
                                {st.name}
                              </td>
                              <td style={{ padding: '8px 12px', color: S.slate }}>{st.admissionNo || '-'}</td>
                              <td style={{ padding: '8px 12px', color: S.slate }}>
                                {st.attendancePct != null ? `${st.attendancePct}%` : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Sticky Drawer Footer with Fixed Edit Details Button at the Bottom */}
            <div
              style={{
                marginTop: 'auto',
                padding: '16px 24px',
                borderTop: `1px solid ${S.border}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#FAFAFB',
                position: 'sticky',
                bottom: 0,
                zIndex: 10,
              }}
            >
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => handleOpenEditSection(selectedSectionDossier)}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '6px',
                    background: S.navy,
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 1px 3px rgba(12, 30, 51, 0.15)',
                  }}
                >
                  <Edit2 size={13} />
                  Edit Details
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSectionDossier(null);
                    setTab('promotions');
                    setSourceSectionId(selectedSectionDossier.id);
                  }}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '6px',
                    background: '#FFFFFF',
                    color: S.navy,
                    border: `1px solid ${S.border}`,
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Rollover Desk
                </button>
              </div>

              <button
                type="button"
                onClick={() => setSelectedSectionDossier(null)}
                style={{
                  padding: '8px 18px',
                  borderRadius: '6px',
                  background: '#FFFFFF',
                  color: S.slate,
                  border: `1px solid ${S.border}`,
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Close Dossier
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* 3. SUBJECT 360° DOSSIER DRAWER (zIndex: 1050) */}
      {selectedSubjectDossier && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(12, 30, 51, 0.45)',
            backdropFilter: 'blur(3px)',
            zIndex: 1050,
            display: 'flex',
            justifyContent: 'flex-end',
            overflow: 'hidden',
          }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setSelectedSubjectDossier(null);
          }}
        >
          <aside
            className="edops-right-drawer"
            role="dialog"
            aria-modal="true"
            aria-label={`Subject Dossier - ${selectedSubjectDossier.name}`}
            style={{
              width: 'var(--edops-drawer-width)',
              maxWidth: '100vw',
              height: '100vh',
              background: '#FFFFFF',
              boxShadow: '-8px 0 32px rgba(12, 30, 51, 0.14)',
              display: 'flex',
              flexDirection: 'column',
              animation: 'edopsSlideInRight 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
              position: 'relative',
              zIndex: 1051,
              borderLeft: `1px solid ${S.border}`,
              fontFamily: "'Poppins', sans-serif",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '20px 24px',
                borderBottom: `1px solid ${S.border}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#FAFAFB',
              }}
            >
              <div>
                <span style={{ fontSize: '11.5px', color: S.slate, fontWeight: 500 }}>
                  Instructional Subject Dossier · {selectedSubjectDossier.code || 'SUB'}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: S.navy }}>
                    {selectedSubjectDossier.name}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSubjectDossier(null)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  border: `1px solid ${S.border}`,
                  background: '#FFFFFF',
                  color: S.slate,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Stat Tiles */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                <div style={{ background: '#F8FAFC', border: `1px solid ${S.border}`, borderRadius: '8px', padding: '14px' }}>
                  <span style={{ fontSize: '11px', color: S.slate, fontWeight: 600, textTransform: 'uppercase' }}>
                    Assigned Faculty
                  </span>
                  <p style={{ margin: '4px 0 0', fontSize: '18px', fontWeight: 700, color: S.navy }}>
                    {selectedSubjectDossier.assignedTeachersCount || 0} Members
                  </p>
                </div>
                <div style={{ background: '#F8FAFC', border: `1px solid ${S.border}`, borderRadius: '8px', padding: '14px' }}>
                  <span style={{ fontSize: '11px', color: S.slate, fontWeight: 600, textTransform: 'uppercase' }}>
                    Syllabi Chapters
                  </span>
                  <p style={{ margin: '4px 0 0', fontSize: '18px', fontWeight: 700, color: S.navy }}>
                    {
                      curriculum.filter(
                        (c: any) =>
                          c.subjectId === selectedSubjectDossier.id ||
                          c.subject?.toLowerCase() === selectedSubjectDossier.name?.toLowerCase()
                      ).length
                    }{' '}
                    Mapped
                  </p>
                </div>
              </div>

              {/* Mapped Chapters */}
              <div>
                <h4 style={{ margin: '0 0 10px', fontSize: '14px', fontWeight: 600, color: S.navy }}>
                  Mapped Curriculum Chapters
                </h4>
                {(() => {
                  const sChapters = curriculum.filter(
                    (c: any) =>
                      c.subjectId === selectedSubjectDossier.id ||
                      c.subject?.toLowerCase() === selectedSubjectDossier.name?.toLowerCase()
                  );
                  if (sChapters.length === 0) {
                    return (
                      <p style={{ fontSize: '12.5px', color: S.slate, margin: 0 }}>
                        No curriculum chapters registered yet for this subject.
                      </p>
                    );
                  }
                  return (
                    <div style={{ border: `1px solid ${S.border}`, borderRadius: '8px', overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ background: '#F8FAFC', borderBottom: `1px solid ${S.border}`, color: S.slate }}>
                            <th style={{ padding: '8px 12px', fontWeight: 600 }}>Grade</th>
                            <th style={{ padding: '8px 12px', fontWeight: 600 }}>Chapter</th>
                            <th style={{ padding: '8px 12px', fontWeight: 600 }}>Target Week</th>
                            <th style={{ padding: '8px 12px', fontWeight: 600 }}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sChapters.map((ch: any, idx: number) => (
                            <tr
                              key={ch.id || idx}
                              style={{
                                borderBottom: idx === sChapters.length - 1 ? 'none' : `1px solid ${S.chip}`,
                              }}
                            >
                              <td style={{ padding: '8px 12px', fontWeight: 700, color: S.navy }}>
                                {ch.grade}
                              </td>
                              <td style={{ padding: '8px 12px', fontWeight: 600, color: S.navy }}>
                                {ch.chapter}
                              </td>
                              <td style={{ padding: '8px 12px', color: S.slate }}>
                                Week {ch.expectedWeek || ch.expected_completion_week || 10}
                              </td>
                              <td style={{ padding: '8px 12px' }}>
                                <span
                                  style={{
                                    padding: '2px 8px',
                                    borderRadius: '10px',
                                    fontSize: '10.5px',
                                    fontWeight: 700,
                                    background: S.greenBg,
                                    color: S.greenDk,
                                  }}
                                >
                                  {ch.status || 'Active'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Sticky Drawer Footer with Fixed Edit Details Button at the Bottom */}
            <div
              style={{
                marginTop: 'auto',
                padding: '16px 24px',
                borderTop: `1px solid ${S.border}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#FAFAFB',
                position: 'sticky',
                bottom: 0,
                zIndex: 10,
              }}
            >
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => handleOpenEditSubject(selectedSubjectDossier)}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '6px',
                    background: S.navy,
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 1px 3px rgba(12, 30, 51, 0.15)',
                  }}
                >
                  <Edit2 size={13} />
                  Edit Details
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const sub = selectedSubjectDossier;
                    setSelectedSubjectDossier(null);
                    setTab('curriculum');
                    setActiveModalSubject(sub);
                  }}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '6px',
                    background: '#FFFFFF',
                    color: S.navy,
                    border: `1px solid ${S.border}`,
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Plus size={14} />
                  Bulk Build Chapters
                </button>
              </div>

              <button
                type="button"
                onClick={() => setSelectedSubjectDossier(null)}
                style={{
                  padding: '8px 18px',
                  borderRadius: '6px',
                  background: '#FFFFFF',
                  color: S.slate,
                  border: `1px solid ${S.border}`,
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Close Dossier
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* 4. SUBJECT CREATION & EDIT DOSSIER DRAWER (Stacked TOP at zIndex: 1300) */}
      {showSubjectDrawer && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(12, 30, 51, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 1300,
            display: 'flex',
            justifyContent: 'flex-end',
            overflow: 'hidden',
          }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !subjectFormBusy) setShowSubjectDrawer(false);
          }}
        >
          <aside
            className="edops-right-drawer"
            role="dialog"
            aria-modal="true"
            aria-label={subjectDrawerMode === 'create' ? 'Create Subject' : 'Edit Subject'}
            style={{
              width: 'var(--edops-drawer-width)',
              maxWidth: '100vw',
              height: '100vh',
              background: '#FFFFFF',
              boxShadow: '-10px 0 36px rgba(12, 30, 51, 0.22)',
              display: 'flex',
              flexDirection: 'column',
              animation: 'edopsSlideInRight 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
              position: 'relative',
              zIndex: 1301,
              borderLeft: `1px solid ${S.border}`,
              fontFamily: "'Poppins', sans-serif",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '20px 24px',
                borderBottom: `1px solid ${S.border}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#FAFAFB',
              }}
            >
              <div>
                <span style={{ fontSize: '11.5px', color: S.slate, fontWeight: 500 }}>
                  Subject Registry Dossier
                </span>
                <h3 style={{ margin: '4px 0 0', fontSize: '18px', fontWeight: 700, color: S.navy }}>
                  {subjectDrawerMode === 'create' ? 'Create Instructional Subject' : 'Edit Subject Details'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSubjectDrawer(false)}
                disabled={subjectFormBusy}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  border: `1px solid ${S.border}`,
                  background: '#FFFFFF',
                  color: S.slate,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveSubject} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12.5px', fontWeight: 600, color: S.navy }}>
                  Subject Title <span style={{ color: '#D92D20' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={subjectFormName}
                  onChange={(e) => setSubjectFormName(e.target.value)}
                  placeholder="e.g. Mathematics, Science, English Literature"
                  style={{
                    padding: '10px 14px',
                    borderRadius: '6px',
                    border: `1px solid ${S.border}`,
                    fontSize: '13px',
                    fontFamily: "'Poppins', sans-serif",
                    color: S.navy,
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12.5px', fontWeight: 600, color: S.navy }}>
                  Subject Code <span style={{ color: '#D92D20' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={subjectFormCode}
                  onChange={(e) => setSubjectFormCode(e.target.value.toUpperCase())}
                  placeholder="e.g. MATH-101, SCI-201"
                  style={{
                    padding: '10px 14px',
                    borderRadius: '6px',
                    border: `1px solid ${S.border}`,
                    fontSize: '13px',
                    fontFamily: 'monospace',
                    fontWeight: 600,
                    color: S.navy,
                    outline: 'none',
                    letterSpacing: '0.04em',
                  }}
                />
                <span style={{ fontSize: '11px', color: S.slate }}>
                  Code will be automatically converted to uppercase and trimmed.
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12.5px', fontWeight: 600, color: S.navy }}>
                  Curriculum Classification
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setSubjectFormIsElective(false)}
                    style={{
                      padding: '10px',
                      borderRadius: '8px',
                      border: !subjectFormIsElective ? `2px solid ${S.navy}` : `1px solid ${S.border}`,
                      background: !subjectFormIsElective ? '#F8FAFC' : '#FFFFFF',
                      color: !subjectFormIsElective ? S.navy : S.slate,
                      fontWeight: !subjectFormIsElective ? 700 : 500,
                      fontSize: '12.5px',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    Core Subject
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubjectFormIsElective(true)}
                    style={{
                      padding: '10px',
                      borderRadius: '8px',
                      border: subjectFormIsElective ? `2px solid ${S.navy}` : `1px solid ${S.border}`,
                      background: subjectFormIsElective ? '#F8FAFC' : '#FFFFFF',
                      color: subjectFormIsElective ? S.navy : S.slate,
                      fontWeight: subjectFormIsElective ? 700 : 500,
                      fontSize: '12.5px',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    Elective Course
                  </button>
                </div>
              </div>

              {/* Sticky Drawer Footer with Fixed Save & Cancel Buttons at Bottom */}
              <div
                style={{
                  marginTop: 'auto',
                  padding: '16px 24px',
                  borderTop: `1px solid ${S.border}`,
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px',
                  position: 'sticky',
                  bottom: 0,
                  background: '#FAFAFB',
                  zIndex: 10,
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowSubjectDrawer(false)}
                  disabled={subjectFormBusy}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '6px',
                    background: '#FFFFFF',
                    color: S.slate,
                    border: `1px solid ${S.border}`,
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={subjectFormBusy}
                  style={{
                    padding: '8px 22px',
                    borderRadius: '6px',
                    background: S.navy,
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: subjectFormBusy ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Check size={14} />
                  {subjectFormBusy ? 'Saving...' : subjectDrawerMode === 'create' ? 'Create Subject' : 'Save Changes'}
                </button>
              </div>
            </form>
          </aside>
        </div>
      )}

      {/* 5. SECTION EDIT DOSSIER DRAWER (Stacked TOP at zIndex: 1300) */}
      {showSectionDrawer && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(12, 30, 51, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 1300,
            display: 'flex',
            justifyContent: 'flex-end',
            overflow: 'hidden',
          }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !sectionFormBusy) setShowSectionDrawer(false);
          }}
        >
          <aside
            className="edops-right-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Edit Section Details"
            style={{
              width: 'var(--edops-drawer-width)',
              maxWidth: '100vw',
              height: '100vh',
              background: '#FFFFFF',
              boxShadow: '-10px 0 36px rgba(12, 30, 51, 0.22)',
              display: 'flex',
              flexDirection: 'column',
              animation: 'edopsSlideInRight 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
              position: 'relative',
              zIndex: 1301,
              borderLeft: `1px solid ${S.border}`,
              fontFamily: "'Poppins', sans-serif",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '20px 24px',
                borderBottom: `1px solid ${S.border}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#FAFAFB',
              }}
            >
              <div>
                <span style={{ fontSize: '11.5px', color: S.slate, fontWeight: 500 }}>
                  Section Profile Dossier
                </span>
                <h3 style={{ margin: '4px 0 0', fontSize: '18px', fontWeight: 700, color: S.navy }}>
                  Edit Section Details
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSectionDrawer(false)}
                disabled={sectionFormBusy}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  border: `1px solid ${S.border}`,
                  background: '#FFFFFF',
                  color: S.slate,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveSection} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12.5px', fontWeight: 600, color: S.navy }}>
                  Section Name / Designation <span style={{ color: '#D92D20' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={sectionFormName}
                  onChange={(e) => setSectionFormName(e.target.value)}
                  placeholder="e.g. 10-A, 8-B, Grade 6 Blue"
                  style={{
                    padding: '10px 14px',
                    borderRadius: '6px',
                    border: `1px solid ${S.border}`,
                    fontSize: '13px',
                    fontFamily: "'Poppins', sans-serif",
                    color: S.navy,
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12.5px', fontWeight: 600, color: S.navy }}>
                  Maximum Student Capacity (Seats) <span style={{ color: '#D92D20' }}>*</span>
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={200}
                  value={sectionFormCapacity}
                  onChange={(e) => setSectionFormCapacity(Number(e.target.value))}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '6px',
                    border: `1px solid ${S.border}`,
                    fontSize: '13px',
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: 600,
                    color: S.navy,
                    outline: 'none',
                  }}
                />
                <span style={{ fontSize: '11px', color: S.slate }}>
                  Adjust maximum seating for timetable division and roster management.
                </span>
              </div>

              {/* Sticky Drawer Footer with Fixed Save & Cancel Buttons at Bottom */}
              <div
                style={{
                  marginTop: 'auto',
                  padding: '16px 24px',
                  borderTop: `1px solid ${S.border}`,
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px',
                  position: 'sticky',
                  bottom: 0,
                  background: '#FAFAFB',
                  zIndex: 10,
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowSectionDrawer(false)}
                  disabled={sectionFormBusy}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '6px',
                    background: '#FFFFFF',
                    color: S.slate,
                    border: `1px solid ${S.border}`,
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sectionFormBusy}
                  style={{
                    padding: '8px 22px',
                    borderRadius: '6px',
                    background: S.navy,
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: sectionFormBusy ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Check size={14} />
                  {sectionFormBusy ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </aside>
        </div>
      )}

      {/* 6. ACADEMIC YEAR EDIT DOSSIER DRAWER (Stacked TOP at zIndex: 1300) */}
      {showYearDrawer && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(12, 30, 51, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 1300,
            display: 'flex',
            justifyContent: 'flex-end',
            overflow: 'hidden',
          }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !yearFormBusy) setShowYearDrawer(false);
          }}
        >
          <aside
            className="edops-right-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Edit Academic Session"
            style={{
              width: 'var(--edops-drawer-width)',
              maxWidth: '100vw',
              height: '100vh',
              background: '#FFFFFF',
              boxShadow: '-10px 0 36px rgba(12, 30, 51, 0.22)',
              display: 'flex',
              flexDirection: 'column',
              animation: 'edopsSlideInRight 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
              position: 'relative',
              zIndex: 1301,
              borderLeft: `1px solid ${S.border}`,
              fontFamily: "'Poppins', sans-serif",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '20px 24px',
                borderBottom: `1px solid ${S.border}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#FAFAFB',
              }}
            >
              <div>
                <span style={{ fontSize: '11.5px', color: S.slate, fontWeight: 500 }}>
                  Academic Session Dossier
                </span>
                <h3 style={{ margin: '4px 0 0', fontSize: '18px', fontWeight: 700, color: S.navy }}>
                  Edit Academic Session
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowYearDrawer(false)}
                disabled={yearFormBusy}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  border: `1px solid ${S.border}`,
                  background: '#FFFFFF',
                  color: S.slate,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveYear} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12.5px', fontWeight: 600, color: S.navy }}>
                  Session Name <span style={{ color: '#D92D20' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={yearFormName}
                  onChange={(e) => setYearFormName(e.target.value)}
                  placeholder="e.g. AY 2026-2027"
                  style={{
                    padding: '10px 14px',
                    borderRadius: '6px',
                    border: `1px solid ${S.border}`,
                    fontSize: '13px',
                    fontFamily: "'Poppins', sans-serif",
                    color: S.navy,
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12.5px', fontWeight: 600, color: S.navy }}>
                    Session Start Date
                  </label>
                  <input
                    type="date"
                    value={yearFormStartDate ? yearFormStartDate.slice(0, 10) : ''}
                    onChange={(e) => setYearFormStartDate(e.target.value)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '6px',
                      border: `1px solid ${S.border}`,
                      fontSize: '13px',
                      fontFamily: "'Poppins', sans-serif",
                      color: S.navy,
                      outline: 'none',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12.5px', fontWeight: 600, color: S.navy }}>
                    Session End Date
                  </label>
                  <input
                    type="date"
                    value={yearFormEndDate ? yearFormEndDate.slice(0, 10) : ''}
                    onChange={(e) => setYearFormEndDate(e.target.value)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '6px',
                      border: `1px solid ${S.border}`,
                      fontSize: '13px',
                      fontFamily: "'Poppins', sans-serif",
                      color: S.navy,
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12.5px', fontWeight: 600, color: S.navy }}>
                  Academic Session Status
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setYearFormIsCurrent(true)}
                    style={{
                      padding: '10px',
                      borderRadius: '8px',
                      border: yearFormIsCurrent ? `2px solid ${S.navy}` : `1px solid ${S.border}`,
                      background: yearFormIsCurrent ? '#F8FAFC' : '#FFFFFF',
                      color: yearFormIsCurrent ? S.navy : S.slate,
                      fontWeight: yearFormIsCurrent ? 700 : 500,
                      fontSize: '12.5px',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    Active Current Session
                  </button>
                  <button
                    type="button"
                    onClick={() => setYearFormIsCurrent(false)}
                    style={{
                      padding: '10px',
                      borderRadius: '8px',
                      border: !yearFormIsCurrent ? `2px solid ${S.navy}` : `1px solid ${S.border}`,
                      background: !yearFormIsCurrent ? '#F8FAFC' : '#FFFFFF',
                      color: !yearFormIsCurrent ? S.navy : S.slate,
                      fontWeight: !yearFormIsCurrent ? 700 : 500,
                      fontSize: '12.5px',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    Standard / Inactive
                  </button>
                </div>
              </div>

              {/* Sticky Drawer Footer with Fixed Save & Cancel Buttons at Bottom */}
              <div
                style={{
                  marginTop: 'auto',
                  padding: '16px 24px',
                  borderTop: `1px solid ${S.border}`,
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px',
                  position: 'sticky',
                  bottom: 0,
                  background: '#FAFAFB',
                  zIndex: 10,
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowYearDrawer(false)}
                  disabled={yearFormBusy}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '6px',
                    background: '#FFFFFF',
                    color: S.slate,
                    border: `1px solid ${S.border}`,
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={yearFormBusy}
                  style={{
                    padding: '8px 22px',
                    borderRadius: '6px',
                    background: S.navy,
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: yearFormBusy ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Check size={14} />
                  {yearFormBusy ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </aside>
        </div>
      )}
    </div>
  );
}


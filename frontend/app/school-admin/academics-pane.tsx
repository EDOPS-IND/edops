'use client';
import React, { useEffect, useState } from 'react';
import { getSchoolAdminAcademics, getSchoolAdminStudents, batchPromoteStudents, createSchoolAdminCurriculum } from '../edops-api';
import { RecordList } from '../parent/components/record-list';

export function AcademicsPane({ organizationId, onOpenQuickAction }: { organizationId?: string; onOpenQuickAction: (action: string) => void }) {
  const [tab, setTab] = useState('structure');
  const [data, setData] = useState<any>(null);
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
    if (!organizationId) return;
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
    }
  };

  useEffect(() => {
    setData(null);
    load();
  }, [organizationId]);

  const sections = data?.sections || [];
  const years = data?.academicYears || [];
  const programs = data?.programs || [];
  const subjects = data?.subjects || [];
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

  // Filter students belonging to the chosen source section
  const sectionStudents = allStudents.filter((st: any) => {
    if (!sourceSection) return false;
    return st.section === sourceSection.name || st.sectionName === sourceSection.name;
  });

  // When source section changes, pre-select all students in that section
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
    <div className="space-y-5">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="text-xl font-bold">Academic Structure</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={{ padding: '6px 12px', background: '#FFFFFF', border: '1px solid #D0D5DD', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }} onClick={() => onOpenQuickAction('year')}>+ Academic Year</button>
          <button style={{ padding: '6px 12px', background: '#FFFFFF', border: '1px solid #D0D5DD', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }} onClick={() => onOpenQuickAction('section')}>+ Section</button>
          <button style={{ padding: '6px 12px', background: '#FFFFFF', border: '1px solid #D0D5DD', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }} onClick={() => onOpenQuickAction('subject')}>+ Subject</button>
          <button style={{ padding: '6px 12px', background: '#101828', color: '#FFFFFF', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }} onClick={() => { setTab('curriculum'); setShowAddChapter(true); }}>+ Curriculum Chapter</button>
        </div>
      </div>

      <nav className="flex gap-4 border-b border-[#EAECF0] pb-2">
        {['structure', 'sections', 'subjects', 'curriculum', 'calendar', 'promotions'].map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setNotice(''); }}
            aria-pressed={tab === t}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: tab === t ? 700 : 500,
              background: tab === t ? '#101828' : 'transparent',
              color: tab === t ? '#FFFFFF' : '#475467',
              border: 'none',
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {t === 'promotions' ? 'Batch Rollover & Promotion' : t}
          </button>
        ))}
      </nav>

      {error && <p role="alert" style={{ padding: '8px 12px', background: '#FEF3F2', border: '1px solid #FECDCA', borderRadius: '6px', color: '#B42318', fontSize: '13px' }}>{error} <button onClick={load} style={{ textDecoration: 'underline', marginLeft: '6px', cursor: 'pointer' }}>Retry</button></p>}
      {notice && <p role="status" style={{ padding: '8px 12px', background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '6px', color: '#065F46', fontSize: '13px' }}>{notice}</p>}

      {tab === 'structure' && <RecordList title="Academic years" rows={data?.academicYears || []} columns={[["name", "Year"], ["start_date", "Start"], ["end_date", "End"], ["is_current", "Current"]]} />}
      {tab === 'sections' && <RecordList title="Sections" rows={data?.sections || []} columns={[["name", "Section"], ["programName", "Program"], ["capacity", "Capacity"], ["enrolledCount", "Enrolled"], ["isOverCapacity", "Over capacity"]]} />}
      {tab === 'subjects' && <RecordList title="Subjects" rows={data?.subjects || []} columns={[["name", "Subject"], ["code", "Code"], ["assignedTeachersCount", "Assigned teachers"]]} />}
      {tab === 'curriculum' && (
        <div style={{ display: 'grid', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#101828' }}>Curriculum Syllabus & Learning Outcomes</h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#667085' }}>Board pacing, expected completion weeks, and tracked syllabus execution.</p>
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
                padding: '6px 14px',
                borderRadius: '6px',
                background: showAddChapter ? '#F2F4F7' : '#101828',
                color: showAddChapter ? '#344054' : '#FFFFFF',
                border: '1px solid #D0D5DD',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {showAddChapter ? '✕ Cancel' : '+ Add Syllabus Chapter'}
            </button>
          </div>

          {showAddChapter && (
            <form onSubmit={handleSaveCurriculumChapter} style={{ background: '#FFFFFF', border: '1px solid #D0D5DD', borderRadius: '10px', padding: '16px', display: 'grid', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <label style={{ display: 'grid', gap: '4px', fontSize: '12px', fontWeight: 600, color: '#344054' }}>
                  <span>Class <span style={{ color: '#D92D20' }}>*</span></span>
                  <select
                    required
                    value={chapterGrade}
                    onChange={(e) => setChapterGrade(e.target.value)}
                    style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #D0D5DD', fontSize: '13px', background: '#FFFFFF' }}
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

                <label style={{ display: 'grid', gap: '4px', fontSize: '12px', fontWeight: 600, color: '#344054' }}>
                  <span>Subject <span style={{ color: '#D92D20' }}>*</span></span>
                  <select
                    required
                    value={chapterSubjectId}
                    onChange={(e) => {
                      setChapterSubjectId(e.target.value);
                      const sub = subjects.find((s: any) => s.id === e.target.value);
                      if (sub) setChapterSubjectName(sub.name);
                    }}
                    style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #D0D5DD', fontSize: '13px', background: '#FFFFFF' }}
                  >
                    <option value="">Select subject...</option>
                    {subjects.map((s: any) => (
                      <option key={s.id} value={s.id}>{s.name} ({s.code || 'SUB'})</option>
                    ))}
                  </select>
                </label>

                <label style={{ display: 'grid', gap: '4px', fontSize: '12px', fontWeight: 600, color: '#344054' }}>
                  <span>Unit Name</span>
                  <input
                    type="text"
                    value={chapterUnit}
                    onChange={(e) => setChapterUnit(e.target.value)}
                    placeholder="e.g. Unit 1: Algebra"
                    style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #D0D5DD', fontSize: '13px' }}
                  />
                </label>

                <label style={{ display: 'grid', gap: '4px', fontSize: '12px', fontWeight: 600, color: '#344054' }}>
                  <span>Chapter Name <span style={{ color: '#D92D20' }}>*</span></span>
                  <input
                    type="text"
                    required
                    value={chapterName}
                    onChange={(e) => setChapterName(e.target.value)}
                    placeholder="e.g. Quadratic Equations"
                    style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #D0D5DD', fontSize: '13px' }}
                  />
                </label>

                <label style={{ display: 'grid', gap: '4px', fontSize: '12px', fontWeight: 600, color: '#344054' }}>
                  <span>Expected Completion Week (1–52)</span>
                  <input
                    type="number"
                    min="1"
                    max="52"
                    value={chapterWeek}
                    onChange={(e) => setChapterWeek(e.target.value)}
                    style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #D0D5DD', fontSize: '13px' }}
                  />
                </label>
              </div>

              <label style={{ display: 'grid', gap: '4px', fontSize: '12px', fontWeight: 600, color: '#344054' }}>
                <span>Learning Outcomes (comma-separated)</span>
                <input
                  type="text"
                  value={chapterOutcomes}
                  onChange={(e) => setChapterOutcomes(e.target.value)}
                  placeholder="e.g. Standard form ax^2+bx+c=0, Quadratic formula, Word problems"
                  style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #D0D5DD', fontSize: '13px' }}
                />
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddChapter(false)}
                  style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #D0D5DD', background: '#FFFFFF', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={chapterBusy}
                  style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#101828', color: '#FFFFFF', fontSize: '12.5px', fontWeight: 600, cursor: chapterBusy ? 'not-allowed' : 'pointer' }}
                >
                  {chapterBusy ? 'Saving...' : 'Save Chapter'}
                </button>
              </div>
            </form>
          )}

          <RecordList
            title="Saved curriculum progress"
            rows={data?.curriculum || []}
            columns={[["grade", "Grade"], ["subject", "Subject"], ["chapter", "Chapter"], ["completionPct", "Completion %"], ["status", "Status"]]}
          />
        </div>
      )}
      {tab === 'calendar' && <RecordList title="School meetings" rows={data?.events || []} columns={[["title", "Title"], ["date", "Date"], ["time", "Time"]]} />}

      {tab === 'promotions' && (
        <form onSubmit={handleExecutePromotion} style={{ background: '#FFFFFF', border: '1px solid #EAECF0', borderRadius: '10px', padding: '20px', display: 'grid', gap: '18px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#101828' }}>Batch Promotion & Academic Rollover</h3>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#667085' }}>Promote an entire class section to the next grade or graduate final-year cohorts with 1-click execution.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            <label style={{ display: 'grid', gap: '4px', fontSize: '12px', fontWeight: 600, color: '#344054' }}>
              <span>Source Class Section <span style={{ color: '#D92D20' }}>*</span></span>
              <select
                required
                value={sourceSectionId}
                onChange={(e) => handleSourceChange(e.target.value)}
                style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #D0D5DD', fontSize: '13px', background: '#FFFFFF' }}
              >
                <option value="">Select source section...</option>
                {sections.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.programName} — {s.name}</option>
                ))}
              </select>
            </label>

            <label style={{ display: 'grid', gap: '4px', fontSize: '12px', fontWeight: 600, color: '#344054' }}>
              <span>Action <span style={{ color: '#D92D20' }}>*</span></span>
              <select
                value={action}
                onChange={(e) => setAction(e.target.value as any)}
                style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #D0D5DD', fontSize: '13px', background: '#FFFFFF' }}
              >
                <option value="promote">Promote to Next Academic Year</option>
                <option value="graduate">Graduate Class (Terminal Cohort / Alumni)</option>
              </select>
            </label>

            {action === 'promote' && (
              <>
                <label style={{ display: 'grid', gap: '4px', fontSize: '12px', fontWeight: 600, color: '#344054' }}>
                  <span>Target Academic Year <span style={{ color: '#D92D20' }}>*</span></span>
                  <select
                    required
                    value={targetYearId}
                    onChange={(e) => setTargetYearId(e.target.value)}
                    style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #D0D5DD', fontSize: '13px', background: '#FFFFFF' }}
                  >
                    <option value="">Select target academic year...</option>
                    {years.map((y: any) => (
                      <option key={y.id} value={y.id}>{y.name} {y.is_current ? '(Current)' : ''}</option>
                    ))}
                  </select>
                </label>

                <label style={{ display: 'grid', gap: '4px', fontSize: '12px', fontWeight: 600, color: '#344054' }}>
                  <span>Target Section <span style={{ color: '#D92D20' }}>*</span></span>
                  <select
                    required
                    value={targetSectionId}
                    onChange={(e) => setTargetSectionId(e.target.value)}
                    style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #D0D5DD', fontSize: '13px', background: '#FFFFFF' }}
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
            <div style={{ display: 'grid', gap: '8px', borderTop: '1px solid #EAECF0', paddingTop: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#344054' }}>
                  Student Roster ({sectionStudents.length} enrolled)
                </span>
                <span style={{ fontSize: '12px', color: '#027A48', fontWeight: 600 }}>
                  {selectedStudentIds.length} of {sectionStudents.length} selected for rollover
                </span>
              </div>

              <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #D0D5DD', borderRadius: '8px', padding: '6px', display: 'grid', gap: '4px', background: '#FAFAFA' }}>
                {sectionStudents.map((st: any) => {
                  const studentId = st.id || st.userId;
                  const isChecked = selectedStudentIds.includes(studentId);
                  return (
                    <label key={studentId} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', borderRadius: '6px', background: isChecked ? '#EFF8FF' : '#FFFFFF', border: isChecked ? '1px solid #B2DDFF' : '1px solid #EAECF0', fontSize: '12.5px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          setSelectedStudentIds((prev) => isChecked ? prev.filter((id) => id !== studentId) : [...prev, studentId]);
                        }}
                      />
                      <b>{st.name}</b>
                      <span style={{ fontSize: '11px', color: '#667085', marginLeft: 'auto' }}>
                        Roll #{st.rollNo || '-'} · Adm {st.admissionNo || '-'}
                      </span>
                    </label>
                  );
                })}
                {sectionStudents.length === 0 && (
                  <span style={{ fontSize: '12px', color: '#667085', padding: '12px', textAlign: 'center' }}>No active students currently enrolled in this section.</span>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px' }}>
                <button
                  type="submit"
                  disabled={busy || selectedStudentIds.length === 0}
                  style={{
                    padding: '9px 20px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    background: '#101828',
                    color: '#FFFFFF',
                    border: 'none',
                    cursor: busy || selectedStudentIds.length === 0 ? 'not-allowed' : 'pointer',
                    opacity: busy || selectedStudentIds.length === 0 ? 0.5 : 1,
                  }}
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

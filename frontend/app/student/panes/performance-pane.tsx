'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, Award, CheckCircle2, AlertCircle, Compass, Target, ArrowRight } from 'lucide-react';
import { getStudentPerformance } from '../../edops-api';

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

interface PerformancePaneProps {
  organizationId: string;
}

export const PerformancePane: React.FC<PerformancePaneProps> = ({ organizationId }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'trends' | 'outcomes' | 'competencies' | 'holistic'>('trends');

  useEffect(() => {
    loadPerformance();
  }, [organizationId]);

  const loadPerformance = async () => {
    setLoading(true);
    try {
      const res = await getStudentPerformance(organizationId);
      setData(res);
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
          Loading academic performance records...
        </p>
      </div>
    );
  }

  const overall = data?.overall || { currentAverage: 88, targetAverage: 92, growthPercentage: 4, trend: '+4% vs last term' };
  const monthlyTrends = data?.monthlyTrends || [];
  const subjectScores = data?.subjectScores || [];
  const learningOutcomes = data?.learningOutcomes || [];
  const competencies = data?.competencies || [];
  const holistic = data?.holisticProgress || { academicGrowth: 88, cognitiveSkills: 90, physicalHealth: 85, socialCollaboration: 92 };

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
            Academic Performance
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
            Academic Performance & Competencies
          </h2>
          <p style={{ margin: 0, fontSize: '13px', color: T.slate, lineHeight: 1.5 }}>
            Holistic tracking: growth trends, CBSE learning outcomes, and multidimensional competencies.
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
          Target: {overall.targetAverage}%
        </div>
      </div>

      {/* 2. Top Banner Card - Section 2.1 Metric Card (Pastel Warm Amber Overall Score Palette) */}
      <div
        style={{
          background: '#fde1ac',
          border: '1px solid #fde1ac',
          borderRadius: '10px',
          padding: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          color: '#7a4a00',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Cumulative Academic Average
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
            <span style={{ fontSize: '36px', fontWeight: 700, lineHeight: 1 }}>
              {overall.currentAverage}%
            </span>
            <span
              style={{
                padding: '3px 8px',
                borderRadius: '100px',
                background: 'rgba(255, 255, 255, 0.6)',
                fontSize: '11px',
                fontWeight: 700,
                color: '#7a4a00',
              }}
            >
              +{overall.growthPercentage}% Growth
            </span>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '12px' }}>
            {overall.trend || '+0% vs last term'} • Target: {overall.targetAverage}%
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Award size={32} />
        </div>
      </div>

      {/* 3. Sub-Tab Filter Pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
        {[
          { id: 'trends', label: 'Monthly Growth Trends' },
          { id: 'outcomes', label: 'CBSE Learning Outcomes' },
          { id: 'competencies', label: 'Core Competencies' },
          { id: 'holistic', label: 'Holistic Progress Card' },
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

      {/* 4. Tab Content Card */}
      <div
        style={{
          background: T.white,
          border: `1px solid ${T.border}`,
          borderRadius: '10px',
          padding: '24px',
          boxSizing: 'border-box',
        }}
      >
        {activeTab === 'trends' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: T.navy }}>
              Subject Performance Distribution
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '12px',
              }}
            >
              {subjectScores.map((sub: any, idx: number) => (
                <div
                  key={idx}
                  style={{
                    padding: '16px',
                    borderRadius: '6px',
                    background: T.pageBg,
                    border: `1px solid ${T.border}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: T.navy }}>
                      {sub.subject}
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: T.navy }}>
                      {sub.score}%
                    </span>
                  </div>

                  {/* 6 px track, radius 12 px */}
                  <div style={{ width: '100%', height: '6px', background: T.track, borderRadius: '12px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        background: sub.score >= 80 ? T.green : T.navy,
                        width: `${sub.score}%`,
                        borderRadius: '12px',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: T.slate }}>
                    <span>Target: {sub.target || 90}%</span>
                    <span style={{ color: T.greenDark, fontWeight: 600 }}>Grade {sub.grade || 'A1'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'outcomes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: T.navy }}>
              CBSE Learning Outcomes Mastered
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {learningOutcomes.map((lo: any, idx: number) => (
                <div
                  key={idx}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '6px',
                    background: T.pageBg,
                    border: `1px solid ${T.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: T.slate, textTransform: 'uppercase' }}>
                      {lo.subject} · {lo.code}
                    </span>
                    <h4 style={{ margin: '2px 0 0', fontSize: '13px', fontWeight: 600, color: T.navy }}>
                      {lo.title}
                    </h4>
                  </div>
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: '100px',
                      background: lo.status === 'Mastered' ? T.greenBg : T.chip,
                      color: lo.status === 'Mastered' ? T.greenDark : T.slate,
                      fontSize: '11px',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {lo.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'competencies' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: T.navy }}>
              Core Cognitive & Applied Competencies
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '12px',
              }}
            >
              {competencies.map((comp: any, idx: number) => (
                <div
                  key={idx}
                  style={{
                    padding: '16px',
                    borderRadius: '6px',
                    background: T.pageBg,
                    border: `1px solid ${T.border}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: T.navy }}>
                      {comp.name}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: T.navy }}>
                      {comp.level}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '12px', color: T.slate, lineHeight: 1.5 }}>
                    {comp.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'holistic' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: T.navy }}>
              Multidimensional Holistic Progress
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '12px',
              }}
            >
              {[
                { label: 'Academic Growth', value: holistic.academicGrowth },
                { label: 'Cognitive Skills', value: holistic.cognitiveSkills },
                { label: 'Physical Health', value: holistic.physicalHealth },
                { label: 'Social & Collaboration', value: holistic.socialCollaboration },
              ].map((dim, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '16px',
                    borderRadius: '6px',
                    background: T.pageBg,
                    border: `1px solid ${T.border}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <span style={{ fontSize: '11px', color: T.slate, textTransform: 'uppercase', fontWeight: 600 }}>
                    {dim.label}
                  </span>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: T.navy }}>
                    {dim.value}%
                  </div>
                  <div style={{ width: '100%', height: '6px', background: T.track, borderRadius: '12px', overflow: 'hidden' }}>
                    <div style={{ width: `${dim.value}%`, height: '100%', background: T.navy, borderRadius: '12px' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

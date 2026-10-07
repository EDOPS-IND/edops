'use client';

import React, { useState, useEffect } from 'react';
import { getTeacherActivity } from '../../edops-api';

interface ActivityPaneProps {
  organizationId: string;
}

export const ActivityPane: React.FC<ActivityPaneProps> = ({ organizationId }) => {
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    loadActivities();
  }, [organizationId]);

  const loadActivities = async () => {
    setLoading(true);
    try {
      const res = await getTeacherActivity(organizationId);
      setActivities(res?.activities || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const displayList = activities;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">Academic Activity Audit & Log</h2>
        <p className="text-sm text-slate-500">Chronological timeline of teaching milestones, grading submissions, and classroom management events.</p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-500 animate-pulse">Loading activity history...</div>
      ) : displayList.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center text-sm text-slate-400">
          No academic activities recorded yet. When you finalize attendance, conduct lessons, or upload materials, they will appear here in chronological order.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="relative pl-6 border-l-2 border-slate-200 space-y-8">
            {displayList.map((item, idx) => (
              <div key={item.id || idx} className="relative group">
                {/* Node dot */}
                <div
                  className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-4 border-white shadow-sm ${
                    item.color || 'bg-indigo-600'
                  }`}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {item.badge || item.type || 'Activity'}
                    </span>
                    <span className="text-xs text-slate-400">{item.timestamp}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 mt-1">{item.action}</h3>
                  <p className="text-xs text-slate-600 mt-1">{item.details}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

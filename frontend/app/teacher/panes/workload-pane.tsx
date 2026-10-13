'use client';

import React, { useState, useEffect } from 'react';
import { getTeacherWorkload, updateTeacherTask } from '../../edops-api';

interface WorkloadPaneProps {
  organizationId: string;
}

export const WorkloadPane: React.FC<WorkloadPaneProps> = ({ organizationId }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  useEffect(() => {
    loadWorkload();
  }, [organizationId]);

  const loadWorkload = async () => {
    setLoading(true);
    try {
      const res = await getTeacherWorkload(organizationId);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    try {
      await updateTeacherTask(organizationId, taskId, { status: newStatus });
      setData((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          tasks: prev.tasks.map((t: any) =>
            t.id === taskId ? { ...t, status: newStatus } : t
          ),
        };
      });
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading academic workload & tasks...</div>;
  }

  const workload = data?.workload || {
    teachingPeriods: 0,
    maxPeriods: 30,
    preparationPeriods: 0,
    remedialPeriods: 0,
    dutyPeriods: 0,
    totalLoad: 0,
    status: 'No Active Workload',
  };

  const tasks = data?.tasks || [];
  const filteredTasks = tasks.filter((t: any) => {
    if (filter === 'all') return true;
    return t.status === filter;
  });

  const percentage = Math.min(Math.round((workload.teachingPeriods / (workload.maxPeriods || 30)) * 100), 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">My Academic Workload & Schedule Balance</h2>
        <p className="text-sm text-slate-500">Track your weekly teaching quota (CBSE 30-period guideline), preparation slots, and pending academic deliverables.</p>
      </div>

      {/* Top Cards: Workload breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Teaching Periods</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              workload.teachingPeriods > 30 ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
            }`}>
              {workload.status}
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {workload.teachingPeriods} <span className="text-sm font-normal text-slate-500">/ {workload.maxPeriods} wk</span>
          </div>
          <div className="mt-3 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full ${percentage > 90 ? 'bg-amber-500' : 'bg-indigo-600'}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">{percentage}% capacity utilized</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Preparation & Planning</span>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {workload.preparationPeriods} <span className="text-sm font-normal text-slate-500">periods</span>
          </div>
          <p className="mt-3 text-xs text-slate-500">Free slots reserved for lesson plans & evaluation</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Remedial Interventions</span>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {workload.remedialPeriods} <span className="text-sm font-normal text-slate-500">slots</span>
          </div>
          <p className="mt-3 text-xs text-slate-500">After-hours & zero-period focus sessions</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Supervision / Duty</span>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {workload.dutyPeriods} <span className="text-sm font-normal text-slate-500">periods</span>
          </div>
          <p className="mt-3 text-xs text-slate-500">Assembly, break corridor, or gate duty</p>
        </div>
      </div>

      {/* Academic Deliverables & Tasks */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="font-semibold text-slate-900">Academic Action Items & Deadlines</h3>
            <p className="text-xs text-slate-500">Mark completion to keep your principal academic audit log in full sync.</p>
          </div>
          <div className="flex items-center gap-2">
            {(['all', 'pending', 'completed'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                  filter === st
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredTasks.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">No tasks in this category.</div>
          ) : (
            filteredTasks.map((task: any) => (
              <div
                key={task.id}
                className="p-4 flex items-start gap-3 hover:bg-slate-50 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={task.status === 'completed'}
                  onChange={() => handleToggleTask(task.id, task.status)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4
                      className={`text-sm font-medium ${
                        task.status === 'completed'
                          ? 'line-through text-slate-400'
                          : 'text-slate-900'
                      }`}
                    >
                      {task.title}
                    </h4>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                        task.priority === 'urgent'
                          ? 'bg-rose-100 text-rose-700'
                          : task.priority === 'high'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {(task.priority || 'medium').toUpperCase()}
                    </span>
                  </div>
                  {task.description && (
                    <p className="text-xs text-slate-500 mt-1">{task.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                    <span>Due: {task.dueDate || 'End of Week'}</span>
                    {task.targetClass && <span>• Class: {task.targetClass}</span>}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

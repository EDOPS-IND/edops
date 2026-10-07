'use client';

import React, { useState } from 'react';
import { X, Trophy, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { submitStudentArenaAttempt } from '../../edops-api';

interface ArenaAttemptModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  activity: any;
  onSuccess?: () => void;
}

export const ArenaAttemptModal: React.FC<ArenaAttemptModalProps> = ({
  isOpen,
  onClose,
  organizationId,
  activity,
  onSuccess,
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  if (!isOpen || !activity) return null;

  const questions = activity.questions || [];
  const currentQ = questions[currentIdx];

  const handleSelect = (idx: number) => {
    if (showExplanation) return;
    setSelectedOption(idx);
    setShowExplanation(true);
    if (currentQ && idx === currentQ.correctIndex) {
      setScore((s) => s + 1);
    }
  };

  const handleNext = async () => {
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx((i) => i + 1);
      setSelectedOption(null);
      setShowExplanation(false);
    } else {
      setFinished(true);
      try {
        await submitStudentArenaAttempt(organizationId, activity.id, {
          submittedAnswer: [selectedOption],
          timeSpentSeconds: 120,
        });
        onSuccess?.();
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">{activity.title}</h3>
              <p className="text-xs text-slate-500">{activity.subject} • Practice Mode</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {finished ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h4 className="text-lg font-bold text-slate-900">Drill Completed!</h4>
            <p className="text-xs text-slate-600">
              You scored <span className="font-bold text-indigo-600">{score} / {questions.length}</span> correct answers.
            </p>
            <button
              onClick={onClose}
              className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs"
            >
              Return to Arena Hub
            </button>
          </div>
        ) : currentQ ? (
          <div className="p-5 space-y-5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Question {currentIdx + 1} of {questions.length}</span>
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> 15m Drill</span>
            </div>

            <div className="text-sm font-semibold text-slate-900 bg-slate-50 p-4 rounded-xl border border-slate-100">
              {currentQ.question}
            </div>

            <div className="space-y-2">
              {currentQ.options.map((opt: string, idx: number) => {
                let btnStyle = 'border-slate-200 hover:bg-slate-50 text-slate-700';
                if (showExplanation) {
                  if (idx === currentQ.correctIndex) {
                    btnStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold';
                  } else if (idx === selectedOption) {
                    btnStyle = 'border-rose-500 bg-rose-50 text-rose-900';
                  }
                }
                return (
                  <button
                    key={idx}
                    onClick={() => handleSelect(idx)}
                    disabled={showExplanation}
                    className={`w-full text-left p-3 rounded-xl border text-xs transition-colors flex items-center justify-between ${btnStyle}`}
                  >
                    <span>{opt}</span>
                    {showExplanation && idx === currentQ.correctIndex && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {showExplanation && (
              <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-950 space-y-1">
                <span className="font-bold text-indigo-900 block">Explanation:</span>
                <p>{currentQ.explanation}</p>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end">
              {showExplanation && (
                <button
                  onClick={handleNext}
                  className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-colors"
                >
                  {currentIdx + 1 < questions.length ? 'Next Question →' : 'Finish & Record'}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-400">No questions available in this drill.</div>
        )}
      </div>
    </div>
  );
};

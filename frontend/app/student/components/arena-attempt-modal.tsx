'use client';

import React, { useState, useEffect } from 'react';
import { X, Trophy, CheckCircle2, AlertCircle, Clock, ArrowRight, RotateCcw, HelpCircle, Flame, Award } from 'lucide-react';
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
  const [answersMap, setAnswersMap] = useState<Record<number, number>>({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15 * 60);

  // Timer countdown
  useEffect(() => {
    if (!isOpen || finished) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, finished]);

  if (!isOpen || !activity) return null;

  const questions = activity.questions || [
    {
      id: 'q1',
      question: 'What is the discriminant of the quadratic equation 2x² - 4x + 3 = 0?',
      options: ['-8', '8', '40', '-40'],
      correctIndex: 0,
      type: 'Single Choice MCQ',
      explanation: 'D = b² - 4ac = (-4)² - 4(2)(3) = 16 - 24 = -8. Since D < 0, the equation has two distinct complex roots.',
    },
    {
      id: 'q2',
      question: 'If the roots of quadratic equation ax² + bx + c = 0 are real and equal, which condition must hold?',
      options: ['b² - 4ac > 0', 'b² - 4ac < 0', 'b² - 4ac = 0', 'b² - 4ac ≥ 0'],
      correctIndex: 2,
      type: 'Single Choice MCQ',
      explanation: 'Equal roots occur when the quadratic discriminant D = 0, giving x = -b / (2a).',
    },
    {
      id: 'q3',
      question: 'Assertion (A): The equation x² + 2x + 1 = 0 has identical roots.\nReason (R): The discriminant of x² + 2x + 1 = 0 is 0.',
      options: [
        'Both (A) and (R) are true, and (R) is the correct explanation of (A)',
        'Both (A) and (R) are true, but (R) is NOT the correct explanation of (A)',
        '(A) is true, but (R) is false',
        '(A) is false, but (R) is true',
      ],
      correctIndex: 0,
      type: 'Assertion-Reasoning',
      explanation: 'D = (2)² - 4(1)(1) = 4 - 4 = 0. Therefore both roots are -1 and identical. (R) correctly explains (A).',
    },
  ];

  const currentQ = questions[currentIdx] || questions[0];

  const handleSelect = (idx: number) => {
    if (showExplanation) return;
    setSelectedOption(idx);
    setShowExplanation(true);
    setAnswersMap({ ...answersMap, [currentIdx]: idx });
    if (currentQ && idx === currentQ.correctIndex) {
      setScore((s) => s + 1);
    }
  };

  const handleNext = async () => {
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx((i) => i + 1);
      setSelectedOption(answersMap[currentIdx + 1] ?? null);
      setShowExplanation(answersMap[currentIdx + 1] !== undefined);
    } else {
      setFinished(true);
      try {
        await submitStudentArenaAttempt(organizationId, activity.id, {
          submittedAnswer: Object.values(answersMap),
          timeSpentSeconds: 15 * 60 - timeLeft,
        });
        onSuccess?.();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#070A10]/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">{activity.title}</h3>
              <p className="text-xs text-slate-500">{activity.subject} • Interactive Objective Arena</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold text-slate-700 bg-white border border-slate-200 px-2.5 py-1 rounded-md flex items-center gap-1 shadow-2xs">
              <Clock size={13} className="text-indigo-600" />
              {formatTime(timeLeft)}
            </span>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {finished ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-xl font-extrabold text-slate-900 font-mono">Drill Completed!</h4>
              <p className="text-xs text-slate-500 mt-1">Instant zero-latency evaluation completed.</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-w-xs mx-auto space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Correct Answers:</span>
                <span className="font-bold font-mono text-slate-900">{score} / {questions.length}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Accuracy Score:</span>
                <span className="font-bold font-mono text-emerald-600">{Math.round((score / questions.length) * 100)}%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Time Expended:</span>
                <span className="font-bold font-mono text-slate-900">{formatTime(15 * 60 - timeLeft)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Arena XP Earned:</span>
                <span className="font-bold font-mono text-indigo-600">+{score * 25} XP</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="bg-[#090D16] hover:bg-[#1E293B] text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-xs"
            >
              Return to Arena Hub
            </button>
          </div>
        ) : currentQ ? (
          <div className="p-5 space-y-5 text-xs">
            {/* Progress Bar & Question Nav Palette */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-[11px]">
                <span className="font-bold text-slate-700">Question {currentIdx + 1} of {questions.length}</span>
                <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono text-[10px] font-bold">
                  {currentQ.type || 'MCQ'}
                </span>
              </div>
              <div className="flex gap-1.5">
                {questions.map((_: any, qIdx: number) => (
                  <button
                    key={qIdx}
                    onClick={() => {
                      setCurrentIdx(qIdx);
                      setSelectedOption(answersMap[qIdx] ?? null);
                      setShowExplanation(answersMap[qIdx] !== undefined);
                    }}
                    className={`flex-1 h-2 rounded-full transition-all ${
                      qIdx === currentIdx
                        ? 'bg-indigo-600'
                        : answersMap[qIdx] !== undefined
                        ? 'bg-emerald-400'
                        : 'bg-slate-200'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Question Text */}
            <div className="text-xs font-semibold text-slate-900 bg-slate-50/80 p-4 rounded-xl border border-slate-200/70 whitespace-pre-line leading-relaxed">
              {currentQ.question}
            </div>

            {/* Interactive Options */}
            <div className="space-y-2">
              {currentQ.options.map((opt: string, idx: number) => {
                let btnStyle = 'border-slate-200 hover:bg-slate-50 text-slate-700 bg-white';
                if (showExplanation) {
                  if (idx === currentQ.correctIndex) {
                    btnStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold';
                  } else if (idx === selectedOption) {
                    btnStyle = 'border-rose-500 bg-rose-50 text-rose-900';
                  }
                } else if (idx === selectedOption) {
                  btnStyle = 'border-indigo-600 bg-indigo-50/40 text-indigo-900 font-semibold';
                }
                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={showExplanation}
                    onClick={() => handleSelect(idx)}
                    className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-start gap-2.5 ${btnStyle}`}
                  >
                    <span className="w-5 h-5 rounded-md border border-slate-300 bg-slate-50 flex items-center justify-center font-bold text-[10px] text-slate-600 shrink-0 font-mono">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="flex-1 pt-0.5">{opt}</span>
                  </button>
                );
              })}
            </div>

            {/* Instant Step-by-Step Explanation */}
            {showExplanation && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 space-y-1 animate-in fade-in">
                <div className="flex items-center gap-1.5 font-bold text-[11px] text-slate-900">
                  <CheckCircle2 size={13} className="text-emerald-600" /> Step-by-Step Mathematical Explanation:
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">{currentQ.explanation}</p>
              </div>
            )}

            {/* Footer Navigation */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-[11px] text-slate-400">
                Score so far: <b className="font-mono text-slate-800">{score}</b>
              </span>
              <button
                type="button"
                onClick={handleNext}
                className="bg-[#090D16] hover:bg-[#1E293B] text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs"
              >
                <span>{currentIdx + 1 === questions.length ? 'Submit Final Attempt' : 'Next Question'}</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

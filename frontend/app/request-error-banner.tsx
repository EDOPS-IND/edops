'use client';

import { useEffect, useState, useRef } from 'react';
import { AlertCircle, X } from 'lucide-react';

export function RequestErrorBanner() {
  const [error, setError] = useState<{ message: string; mutation: boolean } | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const listener = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      setError(detail);

      // Auto-dismiss after 4.5 seconds so intrusive banners don't linger on screen
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setError(null);
      }, 4500);
    };

    window.addEventListener('edops:request-error', listener);
    return () => {
      window.removeEventListener('edops:request-error', listener);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (!error) return null;

  return (
    <div
      role="alert"
      className="fixed top-5 right-5 z-[2000] max-w-sm w-[calc(100vw-2.5rem)] bg-white text-slate-800 border border-rose-200/90 rounded-2xl p-4 shadow-xl shadow-rose-950/10 flex items-start gap-3 transition-all duration-200 animate-in fade-in slide-in-from-top-3"
    >
      <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0 mt-0.5">
        <AlertCircle className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0 pr-1">
        <h4 className="text-xs font-semibold text-rose-900 tracking-tight leading-snug">
          {error.mutation ? 'Changes could not be saved' : 'Connection hiccup'}
        </h4>
        <p className="text-xs text-slate-600 mt-0.5 leading-relaxed break-words">
          {error.message}
          {error.mutation ? ' Please check your inputs and try again.' : ''}
        </p>
      </div>

      <button
        type="button"
        className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-lg transition-colors shrink-0 -mr-1 -mt-1 cursor-pointer"
        aria-label="Dismiss error"
        onClick={() => {
          if (timerRef.current) clearTimeout(timerRef.current);
          setError(null);
        }}
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}


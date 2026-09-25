import React, { useEffect } from 'react';
import { CheckCircle2, X } from 'lucide-react';

export default function Toast({ message, onClose }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, 3500);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className="no-print toast-container fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900/95 dark:bg-white text-white dark:text-slate-900 px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 dark:border-slate-200 animate-slide-up backdrop-blur-md max-w-sm">
      <CheckCircle2 className="w-5 h-5 text-emerald-400 dark:text-emerald-600 shrink-0" />
      <span className="text-xs font-semibold flex-1 leading-snug">
        {message}
      </span>
      <button
        onClick={onClose}
        className="p-1 rounded-lg text-slate-400 hover:text-white dark:hover:text-slate-900"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

'use client';

import { cn } from '@/lib/utils';

export function WizardField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5">
      <label className="mb-1 block text-sm font-semibold text-on-surface">{label}</label>
      {hint && <p className="mb-2 text-xs text-secondary">{hint}</p>}
      {children}
    </div>
  );
}

export function WizardChip({
  label,
  active,
  onClick,
  small,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  small?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border-2 transition-all',
        small ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-sm',
        active
          ? 'border-primary-container bg-primary-container font-semibold text-on-surface'
          : 'border-surface-variant bg-white text-secondary hover:border-primary-container/50',
      )}
    >
      {label}
    </button>
  );
}

export function WizardNav({
  onNext,
  onBack,
  saving,
  isFirst,
  nextLabel = 'Save & continue',
}: {
  onNext: () => void;
  onBack?: () => void;
  saving: boolean;
  isFirst?: boolean;
  nextLabel?: string;
}) {
  return (
    <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row">
      {!isFirst && onBack && (
        <button type="button" onClick={onBack} className="lime-btn-outline sm:w-auto">
          Back
        </button>
      )}
      <button
        type="button"
        onClick={onNext}
        disabled={saving}
        className="lime-btn-primary flex-1 disabled:opacity-60"
      >
        {saving ? 'Saving…' : nextLabel}
      </button>
    </div>
  );
}

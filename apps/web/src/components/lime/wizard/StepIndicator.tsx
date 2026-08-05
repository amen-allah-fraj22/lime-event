'use client';

import { cn } from '@/lib/utils';

type Step = { number: number; label: string };

export function StepIndicator({
  steps,
  currentStep,
  completion,
}: {
  steps: readonly Step[];
  currentStep: number;
  completion: number;
}) {
  return (
    <div className="mb-8">
      <div className="mb-2 flex justify-between text-sm">
        <span className="text-secondary">Profile completion</span>
        <span className="font-semibold text-primary">{completion}%</span>
      </div>
      <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-surface-container-highest">
        <div
          className="h-full rounded-full bg-primary-container transition-all duration-500"
          style={{ width: `${Math.min(100, completion)}%` }}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {steps.map((step) => {
          const done = step.number < currentStep;
          const active = step.number === currentStep;
          return (
            <div
              key={step.number}
              className={cn(
                'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm',
                active && 'border-primary-container bg-primary-container text-on-surface',
                done && !active && 'border-primary-container/40 bg-lime/15 text-primary',
                !active && !done && 'border-surface-variant bg-surface-container-low text-secondary',
              )}
            >
              <span>{done ? '✓' : step.number}</span>
              <span className="hidden sm:inline">{step.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

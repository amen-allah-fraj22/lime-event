'use client';

type ErrorAlertProps = {
  title?: string;
  message: string;
  onRetry?: () => void;
  hint?: string;
};

export function ErrorAlert({ title = 'Something went wrong', message, onRetry, hint }: ErrorAlertProps) {
  return (
    <div
      role="alert"
      className="rounded-xl border-2 border-red-200 bg-red-50 px-4 py-4 text-red-900"
    >
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm">{message}</p>
      {hint && <p className="mt-2 text-xs text-red-800/80">{hint}</p>}
      {onRetry && (
        <button
          type="button"
          className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          onClick={onRetry}
        >
          Try again
        </button>
      )}
    </div>
  );
}

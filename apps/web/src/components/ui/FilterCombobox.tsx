'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { MaterialIcon } from '@/components/ui/MaterialIcon';

type FilterComboboxProps = {
  label: string;
  placeholder: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  emptyHint?: string;
  /** Cap on how many matches are rendered in the popup (scrollable beyond that). */
  maxVisible?: number;
  /** Show a trailing "Other" row that focuses the input so the user can type a
   * custom value not present in `options`. */
  allowOther?: boolean;
  otherLabel?: string;
};

export function FilterCombobox({
  label,
  placeholder,
  value,
  options,
  onChange,
  emptyHint = 'No matches — try another spelling',
  maxVisible = 50,
  allowOther = false,
  otherLabel = 'Other — type your own above',
}: FilterComboboxProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);

  const filtered = useMemo(
    () =>
      options.filter((o) => {
        const q = value.trim().toLowerCase();
        if (!q) return true;
        return o.toLowerCase().includes(q);
      }),
    [options, value],
  );

  const shown = filtered.slice(0, maxVisible);
  const hiddenCount = filtered.length - shown.length;

  useEffect(() => {
    setHighlight(0);
  }, [value, shown.length]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  function selectOption(option: string) {
    onChange(option);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      setOpen(true);
      return;
    }
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, shown.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter' && shown[highlight]) {
      e.preventDefault();
      selectOption(shown[highlight]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <label htmlFor={listId} className="text-xs font-semibold uppercase text-brand-accent">
        {label}
      </label>
      <div className="relative mt-2">
        <MaterialIcon
          name="search"
          size={18}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-secondary"
        />
        <input
          ref={inputRef}
          id={listId}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={`${listId}-listbox`}
          aria-autocomplete="list"
          autoComplete="off"
          className="lime-input w-full pl-9 pr-8"
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />
        {value && (
          <button
            type="button"
            aria-label="Clear"
            className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-full p-1 text-secondary hover:bg-surface-container hover:text-on-surface"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              onChange('');
              inputRef.current?.focus();
            }}
          >
            <MaterialIcon name="close" size={16} />
          </button>
        )}
      </div>
      {open && (
        <ul
          id={`${listId}-listbox`}
          role="listbox"
          className="absolute z-50 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-surface-variant bg-white py-1.5 shadow-float animate-in fade-in-0 zoom-in-95 duration-100"
        >
          {shown.length === 0 ? (
            <li className="px-3 py-2 text-sm text-secondary">{emptyHint}</li>
          ) : (
            <>
              {shown.map((option, i) => (
                <li key={option} role="option" aria-selected={value === option}>
                  <button
                    type="button"
                    className={cn(
                      'w-full px-3 py-2 text-left text-sm transition-colors',
                      i === highlight
                        ? 'bg-primary-container/25 text-on-surface'
                        : 'text-on-surface hover:bg-surface-container-low',
                      value === option && 'font-semibold text-primary',
                    )}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => selectOption(option)}
                    onMouseEnter={() => setHighlight(i)}
                  >
                    {option}
                  </button>
                </li>
              ))}
              {hiddenCount > 0 && (
                <li className="px-3 py-1.5 text-xs text-secondary">
                  +{hiddenCount} more — keep typing to narrow it down
                </li>
              )}
            </>
          )}
          {allowOther && (
            <li role="option" aria-selected={false} className="border-t border-surface-variant">
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm text-primary hover:bg-surface-container-low"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setOpen(false);
                  inputRef.current?.focus();
                }}
              >
                <span className="inline-flex items-center gap-1.5">
                  <MaterialIcon name="edit" size={16} />
                  {otherLabel}
                </span>
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

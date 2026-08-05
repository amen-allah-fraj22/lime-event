'use client';

import { WizardChip, WizardField } from './shared';

export function GuidedPicker({
  label,
  hint,
  options,
  selected,
  onChange,
  otherValue,
  onOtherChange,
}: {
  label: string;
  hint: string;
  options: readonly string[];
  selected: string[];
  onChange: (val: string[]) => void;
  otherValue: string;
  onOtherChange: (val: string) => void;
}) {
  const toggle = (opt: string) => {
    onChange(selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt]);
  };

  return (
    <WizardField label={label} hint={hint}>
      <div className="mt-1 flex flex-wrap gap-2">
        {options.map((opt) => (
          <WizardChip
            key={opt}
            label={opt}
            active={selected.includes(opt)}
            onClick={() => toggle(opt)}
            small={opt.length > 28}
          />
        ))}
      </div>
      {selected.includes('Other') && (
        <input
          className="lime-input mt-3"
          value={otherValue}
          onChange={(e) => onOtherChange(e.target.value)}
          placeholder="Describe your requirement…"
        />
      )}
    </WizardField>
  );
}

'use client';

import { useState } from 'react';
import { MaterialIcon } from '@/components/ui/MaterialIcon';
import type { ArtistProfileFull } from '@/lib/artist-profile-types';
import { NEEDS_OPTIONS, PROVIDES_OPTIONS } from '@/lib/artist-equipment-options';
import { WizardField, WizardNav } from './shared';
import type { StepProps } from './ArtistWizardSteps';

type EquipmentForm = Record<string, boolean | string>;

export function Step4Equipment({ profile, onNext, onBack, saving }: StepProps) {
  const initial: EquipmentForm = {
    provides_sound_system: profile.provides_sound_system ?? false,
    provides_mixing_desk: profile.provides_mixing_desk ?? false,
    provides_lighting: profile.provides_lighting ?? false,
    provides_microphones: profile.provides_microphones ?? false,
    provides_instruments: profile.provides_instruments ?? false,
    provides_stage_backdrop: profile.provides_stage_backdrop ?? false,
    provides_own_transport: profile.provides_own_transport ?? false,
    equipment_notes: profile.equipment_notes ?? '',
    needs_transport: profile.needs_transport ?? false,
    needs_accommodation: profile.needs_accommodation ?? false,
    needs_meals: profile.needs_meals ?? false,
    needs_drinks: profile.needs_drinks ?? false,
    needs_stage_crew: profile.needs_stage_crew ?? false,
    needs_parking: profile.needs_parking ?? false,
    needs_dressing_room: profile.needs_dressing_room ?? false,
    needs_sound_engineer: profile.needs_sound_engineer ?? false,
    requirements_notes: profile.requirements_notes ?? '',
  };

  const [form, setForm] = useState(initial);

  const toggle = (key: string) => {
    setForm((f) => ({ ...f, [key]: !f[key] }));
  };

  return (
    <div>
      <h2 className="font-headline text-xl font-bold">Equipment & requirements</h2>
      <p className="mt-2 text-sm text-secondary">
        Tell organisers what you bring and what you need — fewer surprises before the event.
      </p>

      <div className="mt-6 rounded-xl border-2 border-primary-container/40 bg-lime/10 p-5 md:p-6">
        <h3 className="font-semibold text-on-surface">What I bring to the event</h3>
        <p className="mt-1 text-xs text-secondary">Check everything you arrive with.</p>
        <div className="mt-4 flex flex-col gap-2">
          {PROVIDES_OPTIONS.map((opt) => {
            const checked = !!form[opt.key];
            return (
              <label
                key={opt.key}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 px-3 py-2.5 transition ${
                  checked
                    ? 'border-primary-container bg-lime/20'
                    : 'border-surface-variant bg-white'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(opt.key)}
                  className="accent-lime-container"
                />
                <MaterialIcon name={opt.icon} size={22} className="text-primary" />
                <span className="text-sm font-medium">{opt.label}</span>
              </label>
            );
          })}
        </div>
        <textarea
          className="lime-input mt-3 min-h-[64px]"
          value={String(form.equipment_notes)}
          onChange={(e) => setForm((f) => ({ ...f, equipment_notes: e.target.value }))}
          placeholder="Anything else you bring…"
        />
      </div>

      <div className="mt-6 rounded-xl border-2 border-amber-200/80 bg-amber-50/80 p-5 md:p-6">
        <h3 className="font-semibold text-on-surface">What I need from the organiser</h3>
        <p className="mt-1 text-xs text-secondary">Shown on your profile and offer sheet.</p>
        <div className="mt-4 flex flex-col gap-2">
          {NEEDS_OPTIONS.map((opt) => {
            const checked = !!form[opt.key];
            return (
              <label
                key={opt.key}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 px-3 py-2.5 transition ${
                  checked ? 'border-amber-300 bg-amber-50' : 'border-surface-variant bg-white'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(opt.key)}
                  className="accent-amber-500"
                />
                <MaterialIcon name={opt.icon} size={22} className="text-amber-700" />
                <span className="text-sm font-medium">{opt.label}</span>
              </label>
            );
          })}
        </div>
        <textarea
          className="lime-input mt-3 min-h-[64px]"
          value={String(form.requirements_notes)}
          onChange={(e) => setForm((f) => ({ ...f, requirements_notes: e.target.value }))}
          placeholder="Anything else you need…"
        />
      </div>

      <WizardNav saving={saving} onBack={onBack} onNext={() => onNext(form)} />
    </div>
  );
}

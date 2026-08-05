'use client';

import { useState } from 'react';
import {
  asStringArray,
  HOSPITALITY_OPTIONS,
  TECHNICAL_OPTIONS,
  TRAVEL_OPTIONS,
} from '@/lib/artist-rider-options';
import { GuidedPicker } from './GuidedPicker';
import { WizardField, WizardNav } from './shared';
import type { StepProps } from './ArtistWizardSteps';

export function Step5Pricing({ profile, onNext, onBack, saving }: StepProps) {
  const [form, setForm] = useState({
    pricing_min: profile.pricing_min ?? '',
    travel_options: asStringArray(profile.travel_options),
    travel_other: profile.travel_other ?? '',
    technical_rider: asStringArray(profile.technical_rider),
    technical_other: profile.technical_other ?? '',
    hospitality_rider: asStringArray(profile.hospitality_rider),
    hospitality_other: profile.hospitality_other ?? '',
  });

  return (
    <div>
      <h2 className="font-headline text-xl font-bold">Private rate & travel</h2>
      <p className="mt-2 text-sm text-secondary">
        Set your private minimum and tell organizers what you need on stage.
      </p>

      <WizardField
        label="Minimum acceptable rate (TND)"
        hint="Private — never shown to organisers. Used only to filter out events below your minimum."
      >
        <input
          type="number"
          min={0}
          className="lime-input"
          value={form.pricing_min}
          onChange={(e) => setForm((f) => ({ ...f, pricing_min: e.target.value }))}
          placeholder="e.g. 500"
        />
        <p className="mt-2 text-xs text-secondary">
          When an organiser sends you a booking request, you decide your price then. This minimum
          just filters out requests you would never accept anyway.
        </p>
      </WizardField>

      <GuidedPicker
        label="Travel"
        hint="How far you are willing to perform"
        options={TRAVEL_OPTIONS}
        selected={form.travel_options}
        onChange={(travel_options) => setForm((f) => ({ ...f, travel_options }))}
        otherValue={form.travel_other}
        onOtherChange={(travel_other) => setForm((f) => ({ ...f, travel_other }))}
      />

      <GuidedPicker
        label="Technical rider"
        hint="What you need from the venue or organiser"
        options={TECHNICAL_OPTIONS}
        selected={form.technical_rider}
        onChange={(technical_rider) => setForm((f) => ({ ...f, technical_rider }))}
        otherValue={form.technical_other}
        onOtherChange={(technical_other) => setForm((f) => ({ ...f, technical_other }))}
      />

      <GuidedPicker
        label="Hospitality rider"
        hint="Meals, drinks, parking, accommodation"
        options={HOSPITALITY_OPTIONS}
        selected={form.hospitality_rider}
        onChange={(hospitality_rider) => setForm((f) => ({ ...f, hospitality_rider }))}
        otherValue={form.hospitality_other}
        onOtherChange={(hospitality_other) => setForm((f) => ({ ...f, hospitality_other }))}
      />

      <WizardNav saving={saving} onBack={onBack} onNext={() => onNext(form)} />
    </div>
  );
}

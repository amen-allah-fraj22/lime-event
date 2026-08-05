'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { StepIndicator } from '@/components/lime/wizard/StepIndicator';
import {
  SimplifiedStep1Identity,
  SimplifiedStep2Sound,
  SimplifiedStep3Portfolio,
  SimplifiedStep4Requirements,
} from '@/components/lime/wizard/ArtistSimplifiedSteps';
import { LoadingBlock } from '@/components/feedback/LoadingBlock';
import api from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-errors';
import type { ArtistProfileFull } from '@/lib/artist-profile-types';
import { normalizeWizardPayload } from '@/lib/artist-wizard-normalize';
import { stepFromCompletion, WIZARD_STEPS } from '@/lib/artist-wizard-options';

export function ArtistProfileWizard({ profileId }: { profileId: string }) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [profile, setProfile] = useState<ArtistProfileFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/artists/${profileId}`);
      const data = res.data as ArtistProfileFull;
      setProfile(data);
      setCurrentStep(
        data.is_profile_complete
          ? 1
          : stepFromCompletion(data.profile_completion ?? 0),
      );
    } catch (e) {
      setError(getApiErrorMessage(e).message);
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveStep = useCallback(
    async (stepData: Record<string, unknown>) => {
      setSaving(true);
      setSaveStatus('saving');
      try {
        const payload = normalizeWizardPayload(stepData);
        const res = await api.patch(`/artists/${profileId}`, payload);
        setProfile(res.data as ArtistProfileFull);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (e) {
        setSaveStatus('error');
        setError(getApiErrorMessage(e).message);
        throw e;
      } finally {
        setSaving(false);
      }
    },
    [profileId],
  );

  async function handleNext(stepData: Record<string, unknown>) {
    try {
      await saveStep(stepData);
      if (currentStep < 4) setCurrentStep((s) => s + 1);
    } catch {
      /* error shown */
    }
  }

  async function handlePublish(stepData: Record<string, unknown>) {
    try {
      await saveStep(stepData);
      router.push(`/artists/${profileId}`);
    } catch {
      /* error shown */
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingBlock label="Loading your profile…" />
      </div>
    );
  }

  if (!profile) {
    return (
      <p className="text-center text-sm text-red-600">{error ?? 'Profile not found'}</p>
    );
  }

  const stepProps = {
    profile,
    onNext: handleNext,
    onBack: () => setCurrentStep((s) => Math.max(1, s - 1)),
    onPublish: handlePublish,
    saving,
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link
        href={`/artists/${profileId}`}
        className="text-sm font-semibold text-secondary hover:text-primary"
      >
        ← View public profile
      </Link>

      <header className="mt-4 mb-6">
        <h1 className="font-headline text-2xl font-bold md:text-3xl">
          {profile.is_profile_complete ? 'Edit your profile' : 'Complete your profile'}
        </h1>
        <p className="mt-2 text-sm text-secondary">
          {profile.is_profile_complete
            ? 'Keep your profile up to date to get more bookings.'
            : 'Finish all steps to appear in search and event matches.'}
        </p>
      </header>

      <StepIndicator
        steps={WIZARD_STEPS}
        currentStep={currentStep}
        completion={profile.profile_completion ?? 0}
      />

      {saveStatus !== 'idle' && (
        <p
          className={`mb-4 text-right text-sm ${
            saveStatus === 'saved'
              ? 'text-primary'
              : saveStatus === 'error'
                ? 'text-red-600'
                : 'text-secondary'
          }`}
        >
          {saveStatus === 'saving' && 'Saving…'}
          {saveStatus === 'saved' && 'Saved'}
          {saveStatus === 'error' && 'Save failed — try again'}
        </p>
      )}

      {error && saveStatus === 'error' && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="lime-card p-6 md:p-8">
        {currentStep === 1 && <SimplifiedStep1Identity {...stepProps} />}
        {currentStep === 2 && <SimplifiedStep2Sound {...stepProps} />}
        {currentStep === 3 && <SimplifiedStep3Portfolio {...stepProps} />}
        {currentStep === 4 && <SimplifiedStep4Requirements {...stepProps} />}
      </div>
    </div>
  );
}

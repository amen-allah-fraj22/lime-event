'use client';

import { useState } from 'react';
import type { ArtistProfileFull, BandMember } from '@/lib/artist-profile-types';
import { parseBandMembers } from '@/lib/artist-profile-types';
import { MultiSelectChip } from './MultiSelectChip';
import { MaterialIcon } from '@/components/ui/MaterialIcon';
import { WIZARD_GENRES, WIZARD_INSTRUMENTS, PERFORMANCE_TYPES } from '@/lib/artist-wizard-options';
import { ArtistPhotoUpload } from './ArtistPhotoUpload';

export interface StepProps {
  profile: ArtistProfileFull;
  onNext: (data: Record<string, unknown>) => void;
  onBack: () => void;
  onPublish?: (data: Record<string, unknown>) => void;
  saving?: boolean;
}

export function SimplifiedStep1Identity({ profile, onNext, saving }: StepProps) {
  const [data, setData] = useState({
    display_name: profile.display_name || '',
    city: profile.city || '',
    bio: profile.bio || '',
  });
  // Photos upload and save themselves immediately (their own endpoint), so they're
  // tracked locally just to update the preview shown here — not part of the form
  // payload sent on "Next".
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(profile.profile_photo_url ?? '');
  const [coverPhotoUrl, setCoverPhotoUrl] = useState(profile.cover_photo_url ?? '');

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        onNext(data);
      }}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ArtistPhotoUpload
          profileId={profile.id}
          kind="profile"
          label="Profile photo"
          hint="Shown on your public profile"
          value={profilePhotoUrl}
          onChange={setProfilePhotoUrl}
        />
        <ArtistPhotoUpload
          profileId={profile.id}
          kind="cover"
          label="Cover photo"
          hint="Shown on the artist browse page — this is what gets you noticed"
          value={coverPhotoUrl}
          onChange={setCoverPhotoUrl}
        />
      </div>
      <div>
        <label className="mb-2 block font-label-md font-bold text-on-surface">Artist / Band Name *</label>
        <input
          required
          autoFocus
          className="w-full rounded-xl border-2 border-outline-variant bg-surface-container-lowest p-3 transition-colors focus:border-primary focus:outline-none"
          value={data.display_name}
          onChange={(e) => setData({ ...data, display_name: e.target.value })}
        />
      </div>
      <div>
        <label className="mb-2 block font-label-md font-bold text-on-surface">City</label>
        <input
          className="w-full rounded-xl border-2 border-outline-variant bg-surface-container-lowest p-3 transition-colors focus:border-primary focus:outline-none"
          value={data.city}
          onChange={(e) => setData({ ...data, city: e.target.value })}
        />
      </div>
      <div>
        <label className="mb-2 block font-label-md font-bold text-on-surface">Short Bio</label>
        <textarea
          rows={4}
          className="w-full rounded-xl border-2 border-outline-variant bg-surface-container-lowest p-3 transition-colors focus:border-primary focus:outline-none"
          value={data.bio}
          onChange={(e) => setData({ ...data, bio: e.target.value })}
        />
      </div>
      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-primary px-8 py-3 font-label-lg font-bold text-on-primary transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Next: Sound'}
        </button>
      </div>
    </form>
  );
}

export function SimplifiedStep2Sound({ profile, onNext, onBack, saving }: StepProps) {
  const [type, setType] = useState(profile.artist_type || 'solo');
  const [genres, setGenres] = useState<string[]>(profile.genres || []);
  const [instruments, setInstruments] = useState<string[]>(profile.instruments || []);
  const [bandSize, setBandSize] = useState(
    profile.band_size != null ? String(profile.band_size) : '',
  );
  const [bandMembers, setBandMembers] = useState<BandMember[]>(
    parseBandMembers(profile.band_members),
  );

  const toggleGenre = (g: string) =>
    setGenres((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));

  const toggleInstrument = (i: string) =>
    setInstruments((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));

  const updateMember = (idx: number, field: keyof BandMember, value: string) =>
    setBandMembers((prev) =>
      prev.map((m, i) => (i === idx ? { ...m, [field]: value } : m)),
    );

  const isBand = type === 'band';

  return (
    <form
      className="flex flex-col gap-8"
      onSubmit={(e) => {
        e.preventDefault();
        // When solo, clear any previously-entered lineup so a band→solo switch
        // doesn't leave orphaned members showing on the public profile (which
        // gates the "Band members" section on artist_type === 'band').
        onNext(
          isBand
            ? { artist_type: type, genres, instruments, band_size: bandSize, band_members: bandMembers }
            : { artist_type: type, genres, instruments, band_members: [] },
        );
      }}
    >
      <div>
        <label className="mb-4 block font-label-md font-bold text-on-surface">Are you a solo artist or a band?</label>
        <div className="grid grid-cols-2 gap-4">
          <label className={`flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 p-6 transition-colors ${type === 'solo' ? 'border-primary bg-primary/5 text-primary' : 'border-outline-variant hover:border-outline'}`}>
            <input type="radio" className="sr-only" name="artist_type" value="solo" checked={type === 'solo'} onChange={() => setType('solo')} />
            <MaterialIcon name="person" size={32} />
            <span className="font-bold">Solo Artist</span>
          </label>
          <label className={`flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 p-6 transition-colors ${type === 'band' ? 'border-primary bg-primary/5 text-primary' : 'border-outline-variant hover:border-outline'}`}>
            <input type="radio" className="sr-only" name="artist_type" value="band" checked={type === 'band'} onChange={() => setType('band')} />
            <MaterialIcon name="groups" size={32} />
            <span className="font-bold">Band / Group</span>
          </label>
        </div>
      </div>

      {isBand && (
        <div className="flex flex-col gap-4 rounded-2xl border-2 border-outline-variant bg-surface-container-lowest p-4">
          <div>
            <label className="mb-2 block font-label-md font-bold text-on-surface">
              Number of members
            </label>
            <input
              type="number"
              min={2}
              max={50}
              inputMode="numeric"
              placeholder="e.g. 5"
              className="w-32 rounded-xl border-2 border-outline-variant bg-surface-container-lowest p-3 transition-colors focus:border-primary focus:outline-none"
              value={bandSize}
              onChange={(e) => setBandSize(e.target.value)}
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="font-label-md font-bold text-on-surface">Line-up</label>
              <span className="text-sm text-on-surface-variant">Who plays what</span>
            </div>
            <div className="flex flex-col gap-2">
              {bandMembers.map((member, i) => (
                <div
                  key={i}
                  className="grid grid-cols-1 gap-2 rounded-xl bg-surface-container-low p-3 sm:grid-cols-[1fr_1fr_1fr_auto]"
                >
                  <input
                    className="rounded-lg border-2 border-outline-variant bg-surface-container-lowest p-2 transition-colors focus:border-primary focus:outline-none"
                    placeholder="Name"
                    value={member.name}
                    onChange={(e) => updateMember(i, 'name', e.target.value)}
                  />
                  <input
                    className="rounded-lg border-2 border-outline-variant bg-surface-container-lowest p-2 transition-colors focus:border-primary focus:outline-none"
                    placeholder="Role (e.g. lead singer)"
                    value={member.role}
                    onChange={(e) => updateMember(i, 'role', e.target.value)}
                  />
                  <input
                    className="rounded-lg border-2 border-outline-variant bg-surface-container-lowest p-2 transition-colors focus:border-primary focus:outline-none"
                    placeholder="Instrument"
                    value={member.instrument}
                    onChange={(e) => updateMember(i, 'instrument', e.target.value)}
                  />
                  <button
                    type="button"
                    aria-label={`Remove member ${i + 1}`}
                    className="flex items-center justify-center rounded-lg px-3 py-2 text-error hover:bg-error/10"
                    onClick={() =>
                      setBandMembers((prev) => prev.filter((_, idx) => idx !== i))
                    }
                  >
                    <MaterialIcon name="close" size={20} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="w-full rounded-xl border-2 border-dashed border-primary py-2 text-sm font-bold text-primary transition-colors hover:bg-primary/5"
                onClick={() =>
                  setBandMembers((prev) => [...prev, { name: '', role: '', instrument: '' }])
                }
              >
                + Add member
              </button>
            </div>
            <p className="mt-2 text-sm text-on-surface-variant">
              Optional, but a listed line-up shows on your public profile and helps organizers
              picture the group.
            </p>
          </div>
        </div>
      )}

      <div>
        <label className="mb-4 block font-label-md font-bold text-on-surface">Main Genres</label>
        <div className="flex flex-wrap gap-2">
          {WIZARD_GENRES.map((g) => (
            <MultiSelectChip key={g} label={g} selected={genres.includes(g)} onClick={() => toggleGenre(g)} />
          ))}
        </div>
      </div>

      <div>
        <label className="mb-4 block font-label-md font-bold text-on-surface">Instruments / Roles</label>
        <div className="flex flex-wrap gap-2">
          {WIZARD_INSTRUMENTS.map((i) => (
            <MultiSelectChip key={i} label={i} selected={instruments.includes(i)} onClick={() => toggleInstrument(i)} />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between pt-4">
        <button type="button" onClick={onBack} disabled={saving} className="rounded-full px-6 py-3 font-label-lg font-bold text-secondary hover:bg-surface-container">Back</button>
        <button type="submit" disabled={saving} className="rounded-full bg-primary px-8 py-3 font-label-lg font-bold text-on-primary hover:scale-105 disabled:opacity-50">
          {saving ? 'Saving…' : 'Next: Portfolio'}
        </button>
      </div>
    </form>
  );
}

export function SimplifiedStep3Portfolio({ profile, onNext, onBack, saving }: StepProps) {
  const [links, setLinks] = useState<any[]>(Array.isArray(profile.portfolio_links) ? profile.portfolio_links : []);
  const [demoUrl, setDemoUrl] = useState(profile.demo_track_url || '');

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        onNext({ portfolio_links: links, demo_track_url: demoUrl });
      }}
    >
      <div>
        <label className="mb-2 block font-label-md font-bold text-on-surface">Demo Track / Video URL</label>
        <input
          className="w-full rounded-xl border-2 border-outline-variant bg-surface-container-lowest p-3 transition-colors focus:border-primary focus:outline-none"
          placeholder="https://youtube.com/..."
          value={demoUrl}
          onChange={(e) => setDemoUrl(e.target.value)}
        />
      </div>

      <div className="flex items-center justify-between pt-4">
        <button type="button" onClick={onBack} disabled={saving} className="rounded-full px-6 py-3 font-label-lg font-bold text-secondary hover:bg-surface-container">Back</button>
        <button type="submit" disabled={saving} className="rounded-full bg-primary px-8 py-3 font-label-lg font-bold text-on-primary hover:scale-105 disabled:opacity-50">
          {saving ? 'Saving…' : 'Next: Requirements'}
        </button>
      </div>
    </form>
  );
}

export function SimplifiedStep4Requirements({ profile, onPublish, onBack, saving }: StepProps) {
  const [reqs, setReqs] = useState(profile.requirements_notes || '');

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (onPublish) {
          onPublish({ requirements_notes: reqs });
        }
      }}
    >
      <div>
        <label className="mb-2 block font-label-md font-bold text-on-surface">Technical & Hospitality Requirements</label>
        <p className="mb-2 text-sm text-on-surface-variant">
          Your fee isn&apos;t shown here — organizers reach out first, and you decide the price
          and whether to accept each booking request individually.
        </p>
        <textarea
          rows={4}
          placeholder="e.g. I need 2 mics, a mixer, and vegan meals..."
          className="w-full rounded-xl border-2 border-outline-variant bg-surface-container-lowest p-3 transition-colors focus:border-primary focus:outline-none"
          value={reqs}
          onChange={(e) => setReqs(e.target.value)}
        />
      </div>

      <div className="flex items-center justify-between pt-4">
        <button type="button" onClick={onBack} disabled={saving} className="rounded-full px-6 py-3 font-label-lg font-bold text-secondary hover:bg-surface-container">Back</button>
        <button type="submit" disabled={saving} className="rounded-full bg-primary px-8 py-3 font-label-lg font-bold text-on-primary hover:scale-105 disabled:opacity-50">
          {saving ? 'Publishing…' : 'Publish Profile'}
        </button>
      </div>
    </form>
  );
}

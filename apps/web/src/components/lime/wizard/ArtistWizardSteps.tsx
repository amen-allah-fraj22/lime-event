'use client';

import { useState } from 'react';
import { FilterCombobox } from '@/components/ui/FilterCombobox';
import { MaterialIcon } from '@/components/ui/MaterialIcon';
import type { ArtistProfileFull, BandMember, PortfolioLinkItem } from '@/lib/artist-profile-types';
import { parseBandMembers } from '@/lib/artist-profile-types';
import { parsePortfolioLinks } from '@/lib/portfolio-links';
import { TUNISIA_CITIES } from '@/lib/tunisia-cities';
import {
  PERFORMANCE_STYLES,
  PERFORMANCE_TYPES,
  PORTFOLIO_LINK_TYPES,
  SETUP_TIME_OPTIONS,
  WIZARD_GENRES,
  WIZARD_INSTRUMENTS,
  WIZARD_TAG_OTHER,
  WIZARD_LANGUAGES,
  WIZARD_SUBGENRES,
  mergePresetTags,
  mergeProfileLanguages,
  splitPresetTags,
  splitProfileLanguages,
} from '@/lib/artist-wizard-options';
import { WizardChip, WizardField, WizardNav } from './shared';
import { ArtistPhotoUpload } from './ArtistPhotoUpload';

export type StepProps = {
  profile: ArtistProfileFull;
  onNext: (data: Record<string, unknown>) => void;
  onBack?: () => void;
  onPublish?: (data: Record<string, unknown>) => void;
  saving: boolean;
};

function toggleInList(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function Step1Type({ profile, onNext, saving }: StepProps) {
  const [artistType, setArtistType] = useState(profile.artist_type ?? 'solo');

  const types = [
    {
      value: 'solo',
      icon: 'mic',
      title: 'Solo artist',
      desc: 'You perform alone or with occasional backing. Focus on your instruments and personal style.',
    },
    {
      value: 'band',
      icon: 'music_note',
      title: 'Band / ensemble',
      desc: 'You perform as a group. Include band name, members, and equipment details.',
    },
  ] as const;

  return (
    <div>
      <h2 className="font-headline text-xl font-bold">How do you perform?</h2>
      <p className="mt-2 text-sm text-secondary">
        This sets which fields we show. You can change it later.
      </p>
      <div className="mt-6 flex flex-col gap-4">
        {types.map((t) => {
          const selected = artistType === t.value;
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => setArtistType(t.value)}
              className={`flex items-start gap-4 rounded-xl border-2 p-5 text-left transition-all ${
                selected
                  ? 'border-primary-container bg-lime/10'
                  : 'border-surface-variant bg-white hover:border-primary-container/40'
              }`}
            >
              <MaterialIcon name={t.icon} size={32} className="text-primary" />
              <div className="flex-1">
                <p className="font-semibold">{t.title}</p>
                <p className="mt-1 text-sm text-secondary">{t.desc}</p>
              </div>
              {selected && (
                <MaterialIcon name="check_circle" filled className="text-primary" />
              )}
            </button>
          );
        })}
      </div>
      <WizardNav
        isFirst
        saving={saving}
        onNext={() => onNext({ artist_type: artistType })}
      />
    </div>
  );
}

export function Step2Identity({ profile, onNext, onBack, saving }: StepProps) {
  const initialLangs = splitProfileLanguages(profile.languages ?? []);
  const [form, setForm] = useState({
    display_name: profile.display_name ?? '',
    bio: profile.bio ?? '',
    city: profile.city ?? '',
    languages: initialLangs.preset,
    otherLanguagesText: initialLangs.custom.join(', '),
    showOtherLanguages: initialLangs.custom.length > 0,
    profile_photo_url: profile.profile_photo_url ?? '',
    cover_photo_url: profile.cover_photo_url ?? '',
  });

  function buildStepPayload() {
    const {
      otherLanguagesText,
      showOtherLanguages,
      languages,
      ...rest
    } = form;
    return {
      ...rest,
      languages: mergeProfileLanguages(
        languages,
        showOtherLanguages ? otherLanguagesText : '',
      ),
    };
  }

  return (
    <div>
      <h2 className="font-headline text-xl font-bold">Tell us about yourself</h2>
      <p className="mt-2 text-sm text-secondary">This is what organizers see first.</p>

      <WizardField label="Display name *" hint="Stage name or act name">
        <input
          className="lime-input"
          value={form.display_name}
          onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))}
          placeholder="e.g. Sana K. / The Oud Collective"
        />
      </WizardField>

      <WizardField label="Bio *" hint={`${form.bio.length}/400 characters`}>
        <textarea
          className="lime-input min-h-[100px]"
          maxLength={400}
          value={form.bio}
          onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
          placeholder="Your style, experience, and what makes your performance unique…"
        />
      </WizardField>

      <div className="mb-5">
        <FilterCombobox
          label="City *"
          placeholder="Search or pick your city…"
          value={form.city}
          options={TUNISIA_CITIES}
          onChange={(city) => setForm((f) => ({ ...f, city }))}
        />
      </div>

      <WizardField label="Languages you perform in">
        <div className="mt-1 flex flex-wrap gap-2">
          {WIZARD_LANGUAGES.map((lang) => (
            <WizardChip
              key={lang}
              label={lang}
              active={form.languages.includes(lang)}
              onClick={() =>
                setForm((f) => ({
                  ...f,
                  languages: toggleInList(f.languages, lang),
                }))
              }
            />
          ))}
          <WizardChip
            label={WIZARD_TAG_OTHER}
            active={form.showOtherLanguages}
            onClick={() =>
              setForm((f) => ({
                ...f,
                showOtherLanguages: !f.showOtherLanguages,
                otherLanguagesText: f.showOtherLanguages ? '' : f.otherLanguagesText,
              }))
            }
          />
        </div>
        {form.showOtherLanguages && (
          <input
            className="lime-input mt-3"
            value={form.otherLanguagesText}
            onChange={(e) =>
              setForm((f) => ({ ...f, otherLanguagesText: e.target.value }))
            }
            placeholder="e.g. Berber, Turkish, German"
          />
        )}
        {form.showOtherLanguages && (
          <p className="mt-1.5 text-xs text-secondary">
            Type any language not listed above. Use commas for multiple.
          </p>
        )}
      </WizardField>

      <ArtistPhotoUpload
        profileId={profile.id}
        kind="profile"
        label="Profile photo"
        hint="Optional — helps organizers recognize you"
        value={form.profile_photo_url}
        onChange={(url) => setForm((f) => ({ ...f, profile_photo_url: url }))}
      />

      <ArtistPhotoUpload
        profileId={profile.id}
        kind="cover"
        label="Cover photo"
        hint="Optional banner shown at the top of your public profile"
        value={form.cover_photo_url}
        onChange={(url) => setForm((f) => ({ ...f, cover_photo_url: url }))}
      />

      <WizardNav saving={saving} onBack={onBack} onNext={() => onNext(buildStepPayload())} />
    </div>
  );
}

export function Step3Sound({ profile, onNext, onBack, saving }: StepProps) {
  const initialGenres = splitPresetTags(profile.genres ?? [], WIZARD_GENRES);
  const initialSubgenres = splitPresetTags(profile.subgenres ?? [], WIZARD_SUBGENRES);

  const [form, setForm] = useState({
    genres: initialGenres.preset,
    otherGenresText: initialGenres.custom.join(', '),
    showOtherGenres: initialGenres.custom.length > 0,
    subgenres: initialSubgenres.preset,
    otherSubgenresText: initialSubgenres.custom.join(', '),
    showOtherSubgenres: initialSubgenres.custom.length > 0,
    performance_types: profile.performance_types ?? [],
    years_experience: profile.years_experience ?? '',
    setlist_duration_min: profile.setlist_duration_min ?? '',
    setlist_duration_max: profile.setlist_duration_max ?? '',
  });

  function buildStepPayload() {
    const {
      otherGenresText,
      showOtherGenres,
      genres,
      otherSubgenresText,
      showOtherSubgenres,
      subgenres,
      ...rest
    } = form;
    return {
      ...rest,
      genres: mergePresetTags(genres, showOtherGenres ? otherGenresText : ''),
      subgenres: mergePresetTags(subgenres, showOtherSubgenres ? otherSubgenresText : ''),
    };
  }

  return (
    <div>
      <h2 className="font-headline text-xl font-bold">Your sound</h2>
      <p className="mt-2 text-sm text-secondary">
        Be specific — it helps organizers find you in matches.
      </p>

      <WizardField label="Primary genres *">
        <div className="mt-1 flex flex-wrap gap-2">
          {WIZARD_GENRES.map((g) => (
            <WizardChip
              key={g}
              label={g}
              active={form.genres.includes(g)}
              onClick={() =>
                setForm((f) => ({ ...f, genres: toggleInList(f.genres, g) }))
              }
            />
          ))}
          <WizardChip
            label={WIZARD_TAG_OTHER}
            active={form.showOtherGenres}
            onClick={() =>
              setForm((f) => ({
                ...f,
                showOtherGenres: !f.showOtherGenres,
                otherGenresText: f.showOtherGenres ? '' : f.otherGenresText,
              }))
            }
          />
        </div>
        {form.showOtherGenres && (
          <>
            <input
              className="lime-input mt-3"
              value={form.otherGenresText}
              onChange={(e) =>
                setForm((f) => ({ ...f, otherGenresText: e.target.value }))
              }
              placeholder="e.g. Gnawa, Reggae"
            />
            <p className="mt-1.5 text-xs text-secondary">
              Type genres not listed above. Use commas for multiple.
            </p>
          </>
        )}
      </WizardField>

      <WizardField label="Subgenres / style tags">
        <div className="mt-1 flex flex-wrap gap-2">
          {WIZARD_SUBGENRES.map((g) => (
            <WizardChip
              key={g}
              label={g}
              small
              active={form.subgenres.includes(g)}
              onClick={() =>
                setForm((f) => ({ ...f, subgenres: toggleInList(f.subgenres, g) }))
              }
            />
          ))}
          <WizardChip
            label={WIZARD_TAG_OTHER}
            small
            active={form.showOtherSubgenres}
            onClick={() =>
              setForm((f) => ({
                ...f,
                showOtherSubgenres: !f.showOtherSubgenres,
                otherSubgenresText: f.showOtherSubgenres ? '' : f.otherSubgenresText,
              }))
            }
          />
        </div>
        {form.showOtherSubgenres && (
          <>
            <input
              className="lime-input mt-3"
              value={form.otherSubgenresText}
              onChange={(e) =>
                setForm((f) => ({ ...f, otherSubgenresText: e.target.value }))
              }
              placeholder="e.g. Afrobeat, Drum & Bass"
            />
            <p className="mt-1.5 text-xs text-secondary">
              Type styles not listed above. Use commas for multiple.
            </p>
          </>
        )}
      </WizardField>

      <WizardField label="Event types you perform at *">
        <div className="mt-1 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {PERFORMANCE_TYPES.map((pt) => {
            const active = form.performance_types.includes(pt.value);
            return (
              <button
                key={pt.value}
                type="button"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    performance_types: toggleInList(f.performance_types, pt.value),
                  }))
                }
                className={`rounded-lg border-2 px-4 py-2.5 text-left text-sm transition-colors ${
                  active
                    ? 'border-primary-container bg-lime/10 font-medium'
                    : 'border-surface-variant hover:border-primary-container/40'
                }`}
              >
                {pt.label}
              </button>
            );
          })}
        </div>
      </WizardField>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <WizardField label="Years experience">
          <input
            type="number"
            min={0}
            max={60}
            className="lime-input"
            value={form.years_experience}
            onChange={(e) =>
              setForm((f) => ({ ...f, years_experience: e.target.value }))
            }
            placeholder="e.g. 8"
          />
        </WizardField>
        <WizardField label="Min set (mins)">
          <input
            type="number"
            min={15}
            className="lime-input"
            value={form.setlist_duration_min}
            onChange={(e) =>
              setForm((f) => ({ ...f, setlist_duration_min: e.target.value }))
            }
            placeholder="60"
          />
        </WizardField>
        <WizardField label="Max set (mins)">
          <input
            type="number"
            min={15}
            className="lime-input"
            value={form.setlist_duration_max}
            onChange={(e) =>
              setForm((f) => ({ ...f, setlist_duration_max: e.target.value }))
            }
            placeholder="180"
          />
        </WizardField>
      </div>

      <WizardNav saving={saving} onBack={onBack} onNext={() => onNext(buildStepPayload())} />
    </div>
  );
}

export function Step5Setup({ profile, onNext, onBack, saving }: StepProps) {
  const isBand = profile.artist_type === 'band';
  const [form, setForm] = useState({
    instruments: profile.instruments ?? [],
    performance_style: profile.performance_style ?? '',
    band_name: profile.band_name ?? '',
    band_size: profile.band_size ?? '',
    band_members: parseBandMembers(profile.band_members),
    has_sound_system: profile.has_sound_system ?? false,
    has_lighting: profile.has_lighting ?? false,
    setup_time_minutes: profile.setup_time_minutes ?? '',
  });

  function updateMember(i: number, field: keyof BandMember, value: string) {
    setForm((f) => ({
      ...f,
      band_members: f.band_members.map((m, idx) =>
        idx === i ? { ...m, [field]: value } : m,
      ),
    }));
  }

  return (
    <div>
      <h2 className="font-headline text-xl font-bold">
        {isBand ? 'Band setup' : 'Your setup'}
      </h2>
      <p className="mt-2 text-sm text-secondary">
        {isBand
          ? 'Help organizers understand what your band brings.'
          : 'Tell organizers what you play and how you perform.'}
      </p>

      {!isBand && (
        <>
          <WizardField label="Instruments you play *">
            <div className="mt-1 flex flex-wrap gap-2">
              {WIZARD_INSTRUMENTS.map((inst) => (
                <WizardChip
                  key={inst}
                  label={inst}
                  active={form.instruments.includes(inst)}
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      instruments: toggleInList(f.instruments, inst),
                    }))
                  }
                />
              ))}
            </div>
          </WizardField>
          <WizardField label="Performance style">
            <select
              className="lime-input"
              value={form.performance_style}
              onChange={(e) =>
                setForm((f) => ({ ...f, performance_style: e.target.value }))
              }
            >
              <option value="">Select style</option>
              {PERFORMANCE_STYLES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </WizardField>
        </>
      )}

      {isBand && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <WizardField label="Official band name *">
              <input
                className="lime-input"
                value={form.band_name}
                onChange={(e) => setForm((f) => ({ ...f, band_name: e.target.value }))}
              />
            </WizardField>
            <WizardField label="Number of members *">
              <input
                type="number"
                min={2}
                max={50}
                className="lime-input"
                value={form.band_size}
                onChange={(e) => setForm((f) => ({ ...f, band_size: e.target.value }))}
              />
            </WizardField>
          </div>

          <WizardField label="Band members">
            <div className="space-y-2">
              {form.band_members.map((member, i) => (
                <div
                  key={i}
                  className="grid grid-cols-1 gap-2 rounded-lg bg-surface-container-low p-3 sm:grid-cols-[1fr_1fr_1fr_auto]"
                >
                  <input
                    className="lime-input"
                    placeholder="Name"
                    value={member.name}
                    onChange={(e) => updateMember(i, 'name', e.target.value)}
                  />
                  <input
                    className="lime-input"
                    placeholder="Role"
                    value={member.role}
                    onChange={(e) => updateMember(i, 'role', e.target.value)}
                  />
                  <input
                    className="lime-input"
                    placeholder="Instrument"
                    value={member.instrument}
                    onChange={(e) => updateMember(i, 'instrument', e.target.value)}
                  />
                  <button
                    type="button"
                    className="text-red-600"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        band_members: f.band_members.filter((_, idx) => idx !== i),
                      }))
                    }
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="w-full rounded-lg border-2 border-dashed border-primary-container py-2 text-sm font-medium text-primary"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    band_members: [
                      ...f.band_members,
                      { name: '', role: '', instrument: '' },
                    ],
                  }))
                }
              >
                + Add member
              </button>
            </div>
          </WizardField>

          <WizardField label="Equipment">
            <label className="mb-2 flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.has_sound_system}
                onChange={(e) =>
                  setForm((f) => ({ ...f, has_sound_system: e.target.checked }))
                }
                className="accent-lime-container"
              />
              <span className="text-sm">We bring our own PA / sound system</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.has_lighting}
                onChange={(e) =>
                  setForm((f) => ({ ...f, has_lighting: e.target.checked }))
                }
                className="accent-lime-container"
              />
              <span className="text-sm">We bring our own lighting rig</span>
            </label>
          </WizardField>

          <WizardField label="Setup time needed">
            <select
              className="lime-input"
              value={form.setup_time_minutes}
              onChange={(e) =>
                setForm((f) => ({ ...f, setup_time_minutes: e.target.value }))
              }
            >
              <option value="">Select setup time</option>
              {SETUP_TIME_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {m >= 60 ? `${m / 60} hour${m > 60 ? 's' : ''}` : `${m} minutes`}
                </option>
              ))}
            </select>
          </WizardField>
        </>
      )}

      <WizardNav saving={saving} onBack={onBack} onNext={() => onNext(form)} />
    </div>
  );
}

export function Step6Portfolio({ profile, onNext, onBack, onPublish, saving }: StepProps) {
  const links = parsePortfolioLinks(profile.portfolio_links);
  const [form, setForm] = useState({
    portfolio_links:
      links.length > 0
        ? links.map((l) => ({
            type: l.platform ?? 'YouTube',
            url: l.url ?? '',
            label: l.title ?? '',
          }))
        : ([] as { type: string; url: string; label: string }[]),
    demo_track_url: profile.demo_track_url ?? '',
  });

  const completion = profile.profile_completion ?? 0;
  const isReady = completion >= 80;

  function updateLink(i: number, field: string, value: string) {
    setForm((f) => ({
      ...f,
      portfolio_links: f.portfolio_links.map((l, idx) =>
        idx === i ? { ...l, [field]: value } : l,
      ),
    }));
  }

  return (
    <div>
      <h2 className="font-headline text-xl font-bold">Portfolio & publish</h2>
      <p className="mt-2 text-sm text-secondary">
        Profiles with portfolio links get more booking requests.
      </p>

      <WizardField label="Featured demo URL">
        <input
          className="lime-input"
          value={form.demo_track_url}
          onChange={(e) => setForm((f) => ({ ...f, demo_track_url: e.target.value }))}
          placeholder="SoundCloud or YouTube link"
        />
      </WizardField>

      <WizardField label="Portfolio links">
        <div className="space-y-2">
          {form.portfolio_links.map((link, i) => (
            <div
              key={i}
              className="grid grid-cols-1 gap-2 rounded-lg bg-surface-container-low p-3 sm:grid-cols-[120px_1fr_auto]"
            >
              <select
                className="lime-input"
                value={link.type}
                onChange={(e) => updateLink(i, 'type', e.target.value)}
              >
                {PORTFOLIO_LINK_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <input
                className="lime-input"
                placeholder="URL"
                value={link.url}
                onChange={(e) => updateLink(i, 'url', e.target.value)}
              />
              <button
                type="button"
                className="text-sm text-red-600"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    portfolio_links: f.portfolio_links.filter((_, idx) => idx !== i),
                  }))
                }
              >
                Remove
              </button>
            </div>
          ))}
          {form.portfolio_links.length < 6 && (
            <button
              type="button"
              className="w-full rounded-lg border-2 border-dashed border-primary-container py-2 text-sm font-medium text-primary"
              onClick={() =>
                setForm((f) => ({
                  ...f,
                  portfolio_links: [
                    ...f.portfolio_links,
                    { type: 'YouTube', url: '', label: '' },
                  ],
                }))
              }
            >
              + Add link
            </button>
          )}
        </div>
      </WizardField>

      <div
        className={`mt-6 rounded-xl border p-5 ${
          isReady
            ? 'border-primary-container bg-lime/10'
            : 'border-amber-200 bg-amber-50'
        }`}
      >
        <p className="font-semibold">
          Profile is {completion}% complete
          {isReady ? ' — ready to go live!' : ` — ${80 - completion}% more to reach 80%`}
        </p>
        <p className="mt-1 text-sm text-secondary">
          {isReady
            ? 'Your profile will appear in search and event matches.'
            : 'Complete earlier steps to unlock full visibility.'}
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={onBack} className="lime-btn-outline">
          Back
        </button>
        <button
          type="button"
          onClick={() => onNext(form)}
          disabled={saving}
          className="lime-btn-secondary flex-1"
        >
          Save draft
        </button>
        <button
          type="button"
          onClick={() => onPublish?.(form)}
          disabled={!isReady || saving}
          className="lime-btn-primary flex-1 disabled:opacity-50"
        >
          {saving ? 'Publishing…' : isReady ? 'Publish profile' : 'Complete profile first'}
        </button>
      </div>
    </div>
  );
}

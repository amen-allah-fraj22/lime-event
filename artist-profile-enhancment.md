CURSOR AGENT PROMPT — Artist Profile Edit Page: Multi-Step Onboarding Wizard

Context
The page at /artists/[id]/edit currently renders a flat static form. The task is to replace it with a smooth multi-step wizard that collects richer artist data, handles the Solo vs Band split correctly, and feeds better data into the matching engine at GET /events/:id/matches.
Read these files before touching anything:

apps/web/src/app/artists/[id]/edit/page.tsx — current edit page
apps/api/src/artists/artists.service.ts — artist service
apps/api/src/artists/artists.controller.ts — artist controller
apps/api/prisma/schema.prisma — current ArtistProfile model
apps/api/src/events/events.service.ts — the getMatches() filter logic
apps/web/src/components/lime/ — existing Stitch components to stay consistent with

Do not touch auth, booking flow, contract system, or payment logic. Only modify: ArtistProfile schema, artist edit page, artist public profile display, and the matching filter.

Step 1 — Update the Prisma Schema
In prisma/schema.prisma, replace the current ArtistProfile model with this expanded version:
prismamodel ArtistProfile {
  id                  String   @id @default(uuid())
  user_id             String   @unique
  user                User     @relation(fields: [user_id], references: [id])

  // BASIC INFO
  display_name        String
  bio                 String?
  city                String?
  languages           String[] @default([])
  profile_photo_url   String?
  cover_photo_url     String?

  // ARTIST TYPE — drives which fields are shown
  artist_type         String   @default("solo") // "solo" | "band"

  // SOLO-SPECIFIC
  instruments         String[] @default([])   // e.g. ["guitar", "vocals", "piano"]
  years_experience    Int?                     // e.g. 8
  performance_style   String?                  // e.g. "acoustic", "electric", "unplugged"

  // BAND-SPECIFIC
  band_name           String?                  // official band name
  band_size           Int?                     // number of members (2–20+)
  band_members        Json?                    // [{name, role, instrument}]
  has_sound_system    Boolean  @default(false) // band brings own PA system
  has_lighting        Boolean  @default(false) // band brings own lighting rig
  setup_time_minutes  Int?                     // how long to set up in minutes

  // SHARED PERFORMANCE INFO
  genres              String[] @default([])
  subgenres           String[] @default([])    // more specific tags
  performance_types   String[] @default([])    // ["wedding","corporate","festival","private","club"]
  setlist_duration_min Int?                    // minimum set duration in minutes
  setlist_duration_max Int?                    // maximum set duration in minutes

  // PRICING
  pricing_min         Int?
  pricing_max         Int?
  pricing_notes       String?                  // e.g. "Travel outside Tunis +50 TND"
  travel_surcharge    Boolean  @default(false)
  travel_radius_km    Int?                     // how far they travel from their city

  // PORTFOLIO
  portfolio_links     Json?                    // [{type, url, label}]
  demo_track_url      String?                  // featured single audio/video

  // REPUTATION (calculated, not user-input)
  avg_rating          Float    @default(0)
  total_bookings      Int      @default(0)
  response_rate       Float    @default(0)     // % of requests replied to
  avg_response_hours  Float?                   // average hours to respond

  // REQUIREMENTS
  technical_rider     String?                  // what they need from the venue
  hospitality_rider   String?                  // meals, drinks, backstage

  agency_id           String?
  is_profile_complete Boolean  @default(false) // true when all required steps done
  profile_completion  Int      @default(0)     // 0–100 score

  created_at          DateTime @default(now())
  updated_at          DateTime @updatedAt
}
Run migration:
bashcd apps/api
npx prisma migrate dev --name expand_artist_profile
npx prisma generate

Step 2 — Update the Backend
2a. Update the DTO
Replace src/artists/dto/update-artist.dto.ts with:
tsimport {
  IsString, IsInt, IsBoolean, IsArray, IsOptional,
  IsIn, Min, Max, IsUrl
} from 'class-validator';

export class UpdateArtistDto {
  // Basic
  @IsOptional() @IsString() display_name?: string;
  @IsOptional() @IsString() bio?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsArray() languages?: string[];
  @IsOptional() @IsString() profile_photo_url?: string;
  @IsOptional() @IsString() cover_photo_url?: string;

  // Type
  @IsOptional() @IsIn(['solo', 'band']) artist_type?: string;

  // Solo
  @IsOptional() @IsArray() instruments?: string[];
  @IsOptional() @IsInt() @Min(0) @Max(60) years_experience?: number;
  @IsOptional() @IsString() performance_style?: string;

  // Band
  @IsOptional() @IsString() band_name?: string;
  @IsOptional() @IsInt() @Min(2) @Max(50) band_size?: number;
  @IsOptional() band_members?: { name: string; role: string; instrument: string }[];
  @IsOptional() @IsBoolean() has_sound_system?: boolean;
  @IsOptional() @IsBoolean() has_lighting?: boolean;
  @IsOptional() @IsInt() setup_time_minutes?: number;

  // Performance
  @IsOptional() @IsArray() genres?: string[];
  @IsOptional() @IsArray() subgenres?: string[];
  @IsOptional() @IsArray() performance_types?: string[];
  @IsOptional() @IsInt() setlist_duration_min?: number;
  @IsOptional() @IsInt() setlist_duration_max?: number;

  // Pricing
  @IsOptional() @IsInt() pricing_min?: number;
  @IsOptional() @IsInt() pricing_max?: number;
  @IsOptional() @IsString() pricing_notes?: string;
  @IsOptional() @IsBoolean() travel_surcharge?: boolean;
  @IsOptional() @IsInt() travel_radius_km?: number;

  // Portfolio
  @IsOptional() portfolio_links?: { type: string; url: string; label: string }[];
  @IsOptional() @IsString() demo_track_url?: string;

  // Riders
  @IsOptional() @IsString() technical_rider?: string;
  @IsOptional() @IsString() hospitality_rider?: string;
}
2b. Update the Artist Service
In src/artists/artists.service.ts, update the update() method to also recalculate profile_completion:
tsasync update(userId: string, dto: UpdateArtistDto) {
  const updated = await this.prisma.artistProfile.update({
    where: { user_id: userId },
    data: {
      ...dto,
      updated_at: new Date(),
    },
  });

  // Recalculate profile completion score (0–100)
  const score = this.calculateCompletion(updated);
  return this.prisma.artistProfile.update({
    where: { user_id: userId },
    data: {
      profile_completion: score,
      is_profile_complete: score >= 80,
    },
  });
}

private calculateCompletion(profile: any): number {
  const checks = [
    !!profile.display_name,           // 10pts
    !!profile.bio,                    // 10pts
    !!profile.city,                   // 10pts
    profile.genres?.length > 0,       // 15pts
    !!profile.pricing_min,            // 10pts
    !!profile.pricing_max,            // 10pts
    profile.portfolio_links?.length > 0, // 15pts
    profile.languages?.length > 0,    // 5pts
    !!profile.years_experience || profile.artist_type === 'band', // 5pts
    !!profile.profile_photo_url,      // 10pts
  ];
  const weights = [10, 10, 10, 15, 10, 10, 15, 5, 5, 10];
  return checks.reduce((acc, val, i) => acc + (val ? weights[i] : 0), 0);
}
2c. Update Matching to Use New Fields
In src/events/events.service.ts, update getMatches() to leverage the new fields:
tsasync getMatches(eventId: string) {
  const event = await this.prisma.event.findUniqueOrThrow({
    where: { id: eventId },
  });

  const artists = await this.prisma.artistProfile.findMany({
    where: {
      // Only show complete profiles
      is_profile_complete: true,

      // City match
      ...(event.city && {
        city: { equals: event.city, mode: 'insensitive' },
      }),

      // Genre match
      ...(event.style_tags?.length && {
        genres: { hasSome: event.style_tags },
      }),

      // Price range overlap
      ...(event.budget_min !== null && {
        pricing_max: { gte: event.budget_min },
      }),
      ...(event.budget_max !== null && {
        pricing_min: { lte: event.budget_max },
      }),

      // Event type match (new field)
      ...(event.event_type && {
        performance_types: { has: event.event_type },
      }),
    },
    include: { user: true },
    orderBy: { avg_rating: 'desc' },
  });

  // Exclude already-booked artists on that date
  const bookedIds = await this.getBookedArtistIds(event.event_date);
  const available = artists.filter(a => !bookedIds.has(a.user_id));

  // Phase 1: random sort within results
  return available.sort(() => Math.random() - 0.5);
}

Step 3 — Build the Frontend Wizard
Replace apps/web/src/app/artists/[id]/edit/page.tsx entirely.
3a. Wizard Step Structure
The wizard has 6 steps. Progress bar at top shows Step X of 6. Each step saves independently (auto-save on "Next" click) so progress is never lost.
Step 1 — Who are you?        (type: solo vs band)
Step 2 — Your Identity       (name, photo, bio, city, languages)
Step 3 — Your Sound          (genres, subgenres, performance types, experience)
Step 4 — Your Setup          (solo: instruments / band: members, equipment)
Step 5 — Your Pricing        (rates, travel, riders)
Step 6 — Your Portfolio      (links, demo track, review & publish)
3b. Full Page Component
Create apps/web/src/app/artists/[id]/edit/page.tsx:
tsx'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { StepIndicator } from '@/components/lime/wizard/StepIndicator';
import { Step1Type } from '@/components/lime/wizard/Step1Type';
import { Step2Identity } from '@/components/lime/wizard/Step2Identity';
import { Step3Sound } from '@/components/lime/wizard/Step3Sound';
import { Step4Setup } from '@/components/lime/wizard/Step4Setup';
import { Step5Pricing } from '@/components/lime/wizard/Step5Pricing';
import { Step6Portfolio } from '@/components/lime/wizard/Step6Portfolio';

const STEPS = [
  { number: 1, label: 'Artist Type' },
  { number: 2, label: 'Identity' },
  { number: 3, label: 'Your Sound' },
  { number: 4, label: 'Setup' },
  { number: 5, label: 'Pricing' },
  { number: 6, label: 'Portfolio' },
];

export default function ArtistEditPage() {
  const { id } = useParams();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle'|'saving'|'saved'|'error'>('idle');
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/artists/${id}`).then(res => {
      setProfile(res.data);
      // Resume from last incomplete step
      const completion = res.data.profile_completion ?? 0;
      if (completion === 0) setCurrentStep(1);
      else if (completion < 30) setCurrentStep(2);
      else if (completion < 50) setCurrentStep(3);
      else if (completion < 65) setCurrentStep(4);
      else if (completion < 80) setCurrentStep(5);
      else setCurrentStep(6);
    }).finally(() => setLoading(false));
  }, [id]);

  const saveStep = async (stepData: any) => {
    setSaving(true);
    setSaveStatus('saving');
    try {
      const res = await api.patch(`/artists/${id}`, stepData);
      setProfile(res.data);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async (stepData: any) => {
    await saveStep(stepData);
    if (currentStep < 6) setCurrentStep(s => s + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(s => s - 1);
  };

  const handlePublish = async (stepData: any) => {
    await saveStep(stepData);
    router.push(`/artists/${id}`);
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ color: '#808080', fontSize: 16 }}>Loading your profile...</div>
    </div>
  );

  const stepProps = { profile, onNext: handleNext, onBack: handleBack, saving };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 20px' }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#2E2E2E', margin: 0 }}>
          {profile?.is_profile_complete ? 'Edit Your Profile' : 'Complete Your Profile'}
        </h1>
        <p style={{ color: '#808080', marginTop: 6, fontSize: 15 }}>
          {profile?.is_profile_complete
            ? 'Keep your profile up to date to get more bookings.'
            : 'Finish setting up your profile to start receiving booking requests.'}
        </p>
      </div>

      {/* Progress bar + step labels */}
      <StepIndicator steps={STEPS} currentStep={currentStep} completion={profile?.profile_completion ?? 0} />

      {/* Auto-save status */}
      {saveStatus !== 'idle' && (
        <div style={{
          textAlign: 'right', fontSize: 13, marginBottom: 16,
          color: saveStatus === 'saved' ? '#b7d507' : saveStatus === 'error' ? '#ff4444' : '#808080'
        }}>
          {saveStatus === 'saving' && '💾 Saving...'}
          {saveStatus === 'saved' && '✓ Saved'}
          {saveStatus === 'error' && '✗ Save failed — try again'}
        </div>
      )}

      {/* Step content */}
      <div style={{
        background: 'white', borderRadius: 16, padding: 40,
        boxShadow: '0 1px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0'
      }}>
        {currentStep === 1 && <Step1Type {...stepProps} />}
        {currentStep === 2 && <Step2Identity {...stepProps} />}
        {currentStep === 3 && <Step3Sound {...stepProps} />}
        {currentStep === 4 && <Step4Setup {...stepProps} />}
        {currentStep === 5 && <Step5Pricing {...stepProps} />}
        {currentStep === 6 && <Step6Portfolio {...stepProps} onPublish={handlePublish} />}
      </div>
    </div>
  );
}

3c. StepIndicator Component
Create apps/web/src/components/lime/wizard/StepIndicator.tsx:
tsxinterface Step { number: number; label: string; }
interface Props { steps: Step[]; currentStep: number; completion: number; }

export function StepIndicator({ steps, currentStep, completion }: Props) {
  return (
    <div style={{ marginBottom: 32 }}>
      {/* Completion bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 13, color: '#808080' }}>Profile completion</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#b7d507' }}>{completion}%</span>
      </div>
      <div style={{ height: 6, background: '#f0f0f0', borderRadius: 999, marginBottom: 24, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${completion}%`,
          background: '#b7d507', borderRadius: 999,
          transition: 'width 600ms ease',
        }} />
      </div>

      {/* Step pills */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {steps.map(step => {
          const done = step.number < currentStep;
          const active = step.number === currentStep;
          return (
            <div key={step.number} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 999,
              background: active ? '#b7d507' : done ? '#f4fbcc' : '#f5f5f5',
              border: `1.5px solid ${active ? '#b7d507' : done ? '#b7d507' : '#e5e5e5'}`,
              fontSize: 13, fontWeight: active ? 600 : 400,
              color: active ? '#2E2E2E' : done ? '#8fa004' : '#808080',
              transition: 'all 200ms ease',
            }}>
              {done ? '✓' : step.number}
              <span>{step.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

3d. Step 1 — Artist Type
Create apps/web/src/components/lime/wizard/Step1Type.tsx:
tsximport { useState } from 'react';

export function Step1Type({ profile, onNext, saving }: any) {
  const [artistType, setArtistType] = useState(profile?.artist_type ?? 'solo');

  const types = [
    {
      value: 'solo',
      icon: '🎤',
      title: 'Solo Artist',
      desc: 'You perform alone or with occasional backing. The profile focuses on your personal skills, instruments, and style.',
    },
    {
      value: 'band',
      icon: '🎸',
      title: 'Band / Ensemble',
      desc: 'You perform as a group. The profile includes band name, member count, equipment, and collective setup.',
    },
  ];

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, color: '#2E2E2E' }}>
        How do you perform?
      </h2>
      <p style={{ color: '#808080', marginBottom: 28, fontSize: 15 }}>
        This determines which fields we show on your profile. You can change this later.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {types.map(t => (
          <button
            key={t.value}
            type="button"
            onClick={() => setArtistType(t.value)}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 16,
              padding: 20, borderRadius: 12, cursor: 'pointer', textAlign: 'left',
              border: `2px solid ${artistType === t.value ? '#b7d507' : '#e5e5e5'}`,
              background: artistType === t.value ? '#fafff0' : 'white',
              transition: 'all 150ms ease',
            }}
          >
            <span style={{ fontSize: 32 }}>{t.icon}</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: 16, color: '#2E2E2E', marginBottom: 4 }}>
                {t.title}
              </div>
              <div style={{ fontSize: 14, color: '#808080', lineHeight: 1.5 }}>{t.desc}</div>
            </div>
            {artistType === t.value && (
              <div style={{
                marginLeft: 'auto', width: 22, height: 22, borderRadius: '50%',
                background: '#b7d507', display: 'flex', alignItems: 'center',
                justifyContent: 'center', flexShrink: 0, color: '#2E2E2E', fontWeight: 700,
              }}>✓</div>
            )}
          </button>
        ))}
      </div>

      <WizardNav onNext={() => onNext({ artist_type: artistType })} saving={saving} isFirst />
    </div>
  );
}

3e. Step 2 — Identity
Create apps/web/src/components/lime/wizard/Step2Identity.tsx:
tsximport { useState } from 'react';

const CITIES = ['Tunis','Sfax','Sousse','Bizerte','Nabeul','Monastir','Hammamet','Kairouan','Gabès','Other'];
const LANGUAGES = ['Arabic','French','English','Darija','Italian','Spanish'];

export function Step2Identity({ profile, onNext, onBack, saving }: any) {
  const [form, setForm] = useState({
    display_name: profile?.display_name ?? '',
    bio: profile?.bio ?? '',
    city: profile?.city ?? '',
    languages: profile?.languages ?? [],
    profile_photo_url: profile?.profile_photo_url ?? '',
  });

  const toggleLang = (lang: string) => {
    setForm(f => ({
      ...f,
      languages: f.languages.includes(lang)
        ? f.languages.filter((l: string) => l !== lang)
        : [...f.languages, lang],
    }));
  };

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Tell us about yourself</h2>
      <p style={{ color: '#808080', marginBottom: 28, fontSize: 15 }}>
        This is what organisers see first on your profile.
      </p>

      <Field label="Display Name *" hint="Your stage name or band name">
        <input value={form.display_name}
          onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))}
          placeholder="e.g. Sana K. / The Oud Collective" style={inputStyle} />
      </Field>

      <Field label="Bio *" hint={`${form.bio.length}/400 characters`}>
        <textarea value={form.bio}
          onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
          maxLength={400} rows={4} placeholder="Describe your style, experience, and what makes your performance unique..."
          style={{ ...inputStyle, resize: 'vertical', minHeight: 100 }} />
      </Field>

      <Field label="City *" hint="Where are you based?">
        <select value={form.city}
          onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
          style={inputStyle}>
          <option value="">Select your city</option>
          {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </Field>

      <Field label="Languages you perform in">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
          {LANGUAGES.map(lang => (
            <Chip key={lang} label={lang}
              active={form.languages.includes(lang)}
              onClick={() => toggleLang(lang)} />
          ))}
        </div>
      </Field>

      <Field label="Profile Photo URL" hint="Paste a direct image URL or upload via Cloudinary">
        <input value={form.profile_photo_url}
          onChange={e => setForm(f => ({ ...f, profile_photo_url: e.target.value }))}
          placeholder="https://res.cloudinary.com/..." style={inputStyle} />
      </Field>

      <WizardNav onNext={() => onNext(form)} onBack={onBack} saving={saving} />
    </div>
  );
}

3f. Step 3 — Your Sound
Create apps/web/src/components/lime/wizard/Step3Sound.tsx:
tsximport { useState } from 'react';

const GENRES = ['Traditional / Malouf','Electronic / DJ','Jazz & Blues','Acoustic / Folk',
  'Hip-Hop','Classical','Pop','Rock','Fusion','Rai','Chaabi','Orchestral'];
const SUBGENRES = ['Deep House','Techno','Andalusian','Sufi','Bossa Nova','Neo-Soul',
  'Ambient','R&B','Trap','Indie','Latin','Flamenco'];
const PERFORMANCE_TYPES = [
  { value: 'wedding', label: '💍 Wedding' },
  { value: 'corporate', label: '🏢 Corporate' },
  { value: 'festival', label: '🎪 Festival' },
  { value: 'private', label: '🎉 Private Party' },
  { value: 'club', label: '🎧 Club Night' },
  { value: 'cultural', label: '🎭 Cultural Event' },
  { value: 'restaurant', label: '🍽️ Restaurant / Lounge' },
  { value: 'other', label: '✨ Other' },
];

export function Step3Sound({ profile, onNext, onBack, saving }: any) {
  const [form, setForm] = useState({
    genres: profile?.genres ?? [],
    subgenres: profile?.subgenres ?? [],
    performance_types: profile?.performance_types ?? [],
    years_experience: profile?.years_experience ?? '',
    setlist_duration_min: profile?.setlist_duration_min ?? '',
    setlist_duration_max: profile?.setlist_duration_max ?? '',
  });

  const toggle = (field: string, value: string) => {
    setForm(f => ({
      ...f,
      [field]: (f[field] as string[]).includes(value)
        ? (f[field] as string[]).filter(v => v !== value)
        : [...(f[field] as string[]), value],
    }));
  };

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Your Sound</h2>
      <p style={{ color: '#808080', marginBottom: 28, fontSize: 15 }}>
        This is the core of how organisers find you. Be specific — it gets you better matches.
      </p>

      <Field label="Primary Genres *" hint="Select all that apply">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
          {GENRES.map(g => (
            <Chip key={g} label={g} active={form.genres.includes(g)}
              onClick={() => toggle('genres', g)} />
          ))}
        </div>
      </Field>

      <Field label="Subgenres / Style Tags" hint="More specific tags help matching">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
          {SUBGENRES.map(g => (
            <Chip key={g} label={g} active={form.subgenres.includes(g)}
              onClick={() => toggle('subgenres', g)} size="sm" />
          ))}
        </div>
      </Field>

      <Field label="Event Types You Perform At *" hint="Check all types you're available for">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
          {PERFORMANCE_TYPES.map(pt => (
            <button key={pt.value} type="button"
              onClick={() => toggle('performance_types', pt.value)}
              style={{
                padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                border: `1.5px solid ${form.performance_types.includes(pt.value) ? '#b7d507' : '#e5e5e5'}`,
                background: form.performance_types.includes(pt.value) ? '#fafff0' : 'white',
                fontSize: 14, textAlign: 'left', color: '#2E2E2E',
              }}>
              {pt.label}
            </button>
          ))}
        </div>
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        <Field label="Years Experience">
          <input type="number" min={0} max={60} value={form.years_experience}
            onChange={e => setForm(f => ({ ...f, years_experience: e.target.value }))}
            placeholder="e.g. 8" style={inputStyle} />
        </Field>
        <Field label="Min Set (mins)">
          <input type="number" min={15} value={form.setlist_duration_min}
            onChange={e => setForm(f => ({ ...f, setlist_duration_min: e.target.value }))}
            placeholder="e.g. 60" style={inputStyle} />
        </Field>
        <Field label="Max Set (mins)">
          <input type="number" min={15} value={form.setlist_duration_max}
            onChange={e => setForm(f => ({ ...f, setlist_duration_max: e.target.value }))}
            placeholder="e.g. 180" style={inputStyle} />
        </Field>
      </div>

      <WizardNav onNext={() => onNext(form)} onBack={onBack} saving={saving} />
    </div>
  );
}

3g. Step 4 — Setup (Solo vs Band Split)
Create apps/web/src/components/lime/wizard/Step4Setup.tsx:
tsximport { useState } from 'react';

const INSTRUMENTS = ['Vocals','Guitar (Acoustic)','Guitar (Electric)','Piano / Keyboard',
  'Drums / Percussion','Bass','Violin','Oud','Qanun','Saxophone','Trumpet','Flute',
  'DJ Decks / Turntables','Electronic / Synth','Darbuka','Tabla'];

export function Step4Setup({ profile, onNext, onBack, saving }: any) {
  const isBand = profile?.artist_type === 'band';
  const [form, setForm] = useState({
    // Solo fields
    instruments: profile?.instruments ?? [],
    performance_style: profile?.performance_style ?? '',
    // Band fields
    band_name: profile?.band_name ?? '',
    band_size: profile?.band_size ?? '',
    band_members: profile?.band_members ?? [],
    has_sound_system: profile?.has_sound_system ?? false,
    has_lighting: profile?.has_lighting ?? false,
    setup_time_minutes: profile?.setup_time_minutes ?? '',
  });

  const toggleInstrument = (inst: string) => {
    setForm(f => ({
      ...f,
      instruments: f.instruments.includes(inst)
        ? f.instruments.filter((i: string) => i !== inst)
        : [...f.instruments, inst],
    }));
  };

  const addMember = () => {
    setForm(f => ({
      ...f,
      band_members: [...f.band_members, { name: '', role: '', instrument: '' }],
    }));
  };

  const updateMember = (index: number, field: string, value: string) => {
    setForm(f => ({
      ...f,
      band_members: f.band_members.map((m: any, i: number) =>
        i === index ? { ...m, [field]: value } : m
      ),
    }));
  };

  const removeMember = (index: number) => {
    setForm(f => ({
      ...f,
      band_members: f.band_members.filter((_: any, i: number) => i !== index),
    }));
  };

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
        {isBand ? '🎸 Your Band Setup' : '🎤 Your Setup'}
      </h2>
      <p style={{ color: '#808080', marginBottom: 28, fontSize: 15 }}>
        {isBand
          ? 'Help organisers understand what your band brings and needs.'
          : 'Tell organisers what you play and how you perform.'}
      </p>

      {/* ── SOLO FIELDS ── */}
      {!isBand && (
        <>
          <Field label="Instruments You Play *" hint="Select all that apply">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
              {INSTRUMENTS.map(inst => (
                <Chip key={inst} label={inst} active={form.instruments.includes(inst)}
                  onClick={() => toggleInstrument(inst)} />
              ))}
            </div>
          </Field>

          <Field label="Performance Style" hint="How would you describe your performance format?">
            <select value={form.performance_style}
              onChange={e => setForm(f => ({ ...f, performance_style: e.target.value }))}
              style={inputStyle}>
              <option value="">Select style</option>
              <option value="acoustic">Acoustic / Unplugged</option>
              <option value="full_electric">Full Electric Setup</option>
              <option value="dj_set">DJ Set</option>
              <option value="live_looping">Live Looping</option>
              <option value="classical">Classical / Concert</option>
              <option value="ambient">Ambient / Background</option>
            </select>
          </Field>
        </>
      )}

      {/* ── BAND FIELDS ── */}
      {isBand && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="Official Band Name *">
              <input value={form.band_name}
                onChange={e => setForm(f => ({ ...f, band_name: e.target.value }))}
                placeholder="e.g. The Carthage Jazz Trio" style={inputStyle} />
            </Field>
            <Field label="Number of Members *">
              <input type="number" min={2} max={50} value={form.band_size}
                onChange={e => setForm(f => ({ ...f, band_size: e.target.value }))}
                placeholder="e.g. 4" style={inputStyle} />
            </Field>
          </div>

          <Field label="Band Members" hint="Add each member — helps organisers plan logistics">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
              {form.band_members.map((member: any, i: number) => (
                <div key={i} style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto',
                  gap: 8, alignItems: 'center',
                  background: '#f9f9f9', padding: 12, borderRadius: 8,
                }}>
                  <input placeholder="Name" value={member.name}
                    onChange={e => updateMember(i, 'name', e.target.value)}
                    style={{ ...inputStyle, margin: 0 }} />
                  <input placeholder="Role (e.g. Vocalist)" value={member.role}
                    onChange={e => updateMember(i, 'role', e.target.value)}
                    style={{ ...inputStyle, margin: 0 }} />
                  <input placeholder="Instrument" value={member.instrument}
                    onChange={e => updateMember(i, 'instrument', e.target.value)}
                    style={{ ...inputStyle, margin: 0 }} />
                  <button type="button" onClick={() => removeMember(i)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer',
                      color: '#ff4444', fontSize: 18, padding: '0 4px' }}>×</button>
                </div>
              ))}
              <button type="button" onClick={addMember} style={{
                padding: '10px 16px', borderRadius: 8,
                border: '1.5px dashed #b7d507', background: 'transparent',
                color: '#b7d507', cursor: 'pointer', fontWeight: 500, fontSize: 14,
              }}>
                + Add Member
              </button>
            </div>
          </Field>

          <Field label="Equipment & Logistics">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.has_sound_system}
                  onChange={e => setForm(f => ({ ...f, has_sound_system: e.target.checked }))}
                  style={{ width: 18, height: 18, accentColor: '#b7d507' }} />
                <span style={{ fontSize: 14, color: '#2E2E2E' }}>
                  🔊 We bring our own PA / sound system
                </span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.has_lighting}
                  onChange={e => setForm(f => ({ ...f, has_lighting: e.target.checked }))}
                  style={{ width: 18, height: 18, accentColor: '#b7d507' }} />
                <span style={{ fontSize: 14, color: '#2E2E2E' }}>
                  💡 We bring our own lighting rig
                </span>
              </label>
            </div>
          </Field>

          <Field label="Setup Time Needed" hint="How many minutes do you need to set up before the event?">
            <select value={form.setup_time_minutes}
              onChange={e => setForm(f => ({ ...f, setup_time_minutes: e.target.value }))}
              style={inputStyle}>
              <option value="">Select setup time</option>
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="45">45 minutes</option>
              <option value="60">1 hour</option>
              <option value="90">1.5 hours</option>
              <option value="120">2 hours</option>
            </select>
          </Field>
        </>
      )}

      <WizardNav onNext={() => onNext(form)} onBack={onBack} saving={saving} />
    </div>
  );
}

3h. Step 5 — Pricing
Create apps/web/src/components/lime/wizard/Step5Pricing.tsx:
tsximport { useState } from 'react';

export function Step5Pricing({ profile, onNext, onBack, saving }: any) {
  const [form, setForm] = useState({
    pricing_min: profile?.pricing_min ?? '',
    pricing_max: profile?.pricing_max ?? '',
    pricing_notes: profile?.pricing_notes ?? '',
    travel_surcharge: profile?.travel_surcharge ?? false,
    travel_radius_km: profile?.travel_radius_km ?? '',
    technical_rider: profile?.technical_rider ?? '',
    hospitality_rider: profile?.hospitality_rider ?? '',
  });

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Pricing & Requirements</h2>
      <p style={{ color: '#808080', marginBottom: 28, fontSize: 15 }}>
        Set your rate range — organisers filter by budget, so be realistic. You negotiate the final price per booking.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Field label="Minimum Rate (TND) *" hint="Lowest you'll accept for a standard gig">
          <div style={{ position: 'relative' }}>
            <input type="number" min={0} value={form.pricing_min}
              onChange={e => setForm(f => ({ ...f, pricing_min: e.target.value }))}
              placeholder="e.g. 300" style={{ ...inputStyle, paddingRight: 48 }} />
            <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
              color: '#808080', fontSize: 13 }}>TND</span>
          </div>
        </Field>
        <Field label="Maximum Rate (TND) *" hint="Upper end of your standard range">
          <div style={{ position: 'relative' }}>
            <input type="number" min={0} value={form.pricing_max}
              onChange={e => setForm(f => ({ ...f, pricing_max: e.target.value }))}
              placeholder="e.g. 1200" style={{ ...inputStyle, paddingRight: 48 }} />
            <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
              color: '#808080', fontSize: 13 }}>TND</span>
          </div>
        </Field>
      </div>

      <Field label="Pricing Notes" hint="Explain what's included or any special conditions">
        <textarea value={form.pricing_notes}
          onChange={e => setForm(f => ({ ...f, pricing_notes: e.target.value }))}
          rows={2} placeholder="e.g. Rate includes 2-hour set. Extended sets +150 TND/hour. Equipment included."
          style={{ ...inputStyle, resize: 'vertical' }} />
      </Field>

      <Field label="Travel">
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 12 }}>
          <input type="checkbox" checked={form.travel_surcharge}
            onChange={e => setForm(f => ({ ...f, travel_surcharge: e.target.checked }))}
            style={{ width: 18, height: 18, accentColor: '#b7d507' }} />
          <span style={{ fontSize: 14, color: '#2E2E2E' }}>I charge a travel surcharge for events outside my city</span>
        </label>
        {form.travel_surcharge && (
          <input type="number" value={form.travel_radius_km}
            onChange={e => setForm(f => ({ ...f, travel_radius_km: e.target.value }))}
            placeholder="Max travel radius (km)" style={inputStyle} />
        )}
      </Field>

      <Field label="Technical Rider" hint="What do you need from the venue? (microphone, monitors, power, stage size...)">
        <textarea value={form.technical_rider}
          onChange={e => setForm(f => ({ ...f, technical_rider: e.target.value }))}
          rows={3} placeholder="e.g. 1× vocal microphone, 2× monitor speakers, 1× power outlet on stage, minimum 3m × 3m performance area"
          style={{ ...inputStyle, resize: 'vertical' }} />
      </Field>

      <Field label="Hospitality Rider" hint="Optional — meals, drinks, parking, dressing room...">
        <textarea value={form.hospitality_rider}
          onChange={e => setForm(f => ({ ...f, hospitality_rider: e.target.value }))}
          rows={2} placeholder="e.g. Light meal before performance, still water on stage, parking for 1 vehicle"
          style={{ ...inputStyle, resize: 'vertical' }} />
      </Field>

      <WizardNav onNext={() => onNext(form)} onBack={onBack} saving={saving} />
    </div>
  );
}

3i. Step 6 — Portfolio & Publish
Create apps/web/src/components/lime/wizard/Step6Portfolio.tsx:
tsximport { useState } from 'react';

const LINK_TYPES = ['SoundCloud','YouTube','Spotify','Instagram','TikTok','Website','Other'];

export function Step6Portfolio({ profile, onNext, onBack, onPublish, saving }: any) {
  const [form, setForm] = useState({
    portfolio_links: profile?.portfolio_links ?? [],
    demo_track_url: profile?.demo_track_url ?? '',
  });

  const addLink = () => {
    setForm(f => ({
      ...f,
      portfolio_links: [...f.portfolio_links, { type: 'YouTube', url: '', label: '' }],
    }));
  };

  const updateLink = (i: number, field: string, value: string) => {
    setForm(f => ({
      ...f,
      portfolio_links: f.portfolio_links.map((l: any, idx: number) =>
        idx === i ? { ...l, [field]: value } : l
      ),
    }));
  };

  const removeLink = (i: number) => {
    setForm(f => ({
      ...f,
      portfolio_links: f.portfolio_links.filter((_: any, idx: number) => idx !== i),
    }));
  };

  const completion = profile?.profile_completion ?? 0;
  const isReady = completion >= 80;

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Portfolio & Publish</h2>
      <p style={{ color: '#808080', marginBottom: 28, fontSize: 15 }}>
        Add links to your best work. Profiles with portfolio links get 3× more booking requests.
      </p>

      <Field label="Featured Demo" hint="Your single best track or video — shown at the top of your profile">
        <input value={form.demo_track_url}
          onChange={e => setForm(f => ({ ...f, demo_track_url: e.target.value }))}
          placeholder="https://soundcloud.com/you/your-best-track" style={inputStyle} />
      </Field>

      <Field label="Portfolio Links" hint="Add up to 6 links to your work">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
          {form.portfolio_links.map((link: any, i: number) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '130px 1fr auto',
              gap: 8, alignItems: 'center',
              background: '#f9f9f9', padding: 12, borderRadius: 8,
            }}>
              <select value={link.type}
                onChange={e => updateLink(i, 'type', e.target.value)}
                style={{ ...inputStyle, margin: 0, fontSize: 13 }}>
                {LINK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <input placeholder="Paste URL here" value={link.url}
                onChange={e => updateLink(i, 'url', e.target.value)}
                style={{ ...inputStyle, margin: 0 }} />
              <button type="button" onClick={() => removeLink(i)}
                style={{ background: 'none', border: 'none', cursor: 'pointer',
                  color: '#ff4444', fontSize: 18, padding: '0 4px' }}>×</button>
            </div>
          ))}
          {form.portfolio_links.length < 6 && (
            <button type="button" onClick={addLink} style={{
              padding: '10px 16px', borderRadius: 8,
              border: '1.5px dashed #b7d507', background: 'transparent',
              color: '#b7d507', cursor: 'pointer', fontWeight: 500, fontSize: 14,
            }}>
              + Add Portfolio Link
            </button>
          )}
        </div>
      </Field>

      {/* Profile completion summary */}
      <div style={{
        marginTop: 32, padding: 20, borderRadius: 12,
        background: isReady ? '#fafff0' : '#fff8f0',
        border: `1.5px solid ${isReady ? '#b7d507' : '#ffcc80'}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 20 }}>{isReady ? '✅' : '⚠️'}</span>
          <span style={{ fontWeight: 600, fontSize: 15, color: '#2E2E2E' }}>
            Profile is {completion}% complete —
            {isReady ? ' ready to go live!' : ` needs ${80 - completion}% more to go live`}
          </span>
        </div>
        <p style={{ fontSize: 13, color: '#808080', margin: 0 }}>
          {isReady
            ? 'Your profile will appear in search results and start receiving booking requests immediately.'
            : 'Go back and complete the missing fields to activate your profile and start receiving bookings.'}
        </p>
      </div>

      {/* Nav buttons */}
      <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
        <button type="button" onClick={onBack} style={backBtnStyle}>← Back</button>
        <button type="button" onClick={() => onNext(form)} style={saveBtnStyle}>
          Save Draft
        </button>
        <button type="button" onClick={() => onPublish(form)}
          disabled={!isReady || saving}
          style={{
            ...nextBtnStyle,
            opacity: isReady ? 1 : 0.5,
            cursor: isReady ? 'pointer' : 'not-allowed',
          }}>
          {saving ? 'Publishing...' : isReady ? '🚀 Publish Profile' : 'Complete Profile First'}
        </button>
      </div>
    </div>
  );
}

3j. Shared Primitives
Create apps/web/src/components/lime/wizard/shared.tsx — used by all steps:
tsx// Shared styles
export const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 8,
  border: '1.5px solid #e5e5e5', fontSize: 14, color: '#2E2E2E',
  background: 'white', outline: 'none', boxSizing: 'border-box',
  marginBottom: 0,
  transition: 'border-color 150ms ease',
};

export const nextBtnStyle: React.CSSProperties = {
  flex: 1, padding: '13px 24px', borderRadius: 999,
  background: '#b7d507', border: 'none', cursor: 'pointer',
  fontWeight: 600, fontSize: 15, color: '#2E2E2E',
};

export const backBtnStyle: React.CSSProperties = {
  padding: '13px 24px', borderRadius: 999,
  background: 'white', border: '1.5px solid #e5e5e5',
  cursor: 'pointer', fontWeight: 500, fontSize: 15, color: '#808080',
};

export const saveBtnStyle: React.CSSProperties = {
  padding: '13px 24px', borderRadius: 999,
  background: '#f5f5f5', border: '1.5px solid #e5e5e5',
  cursor: 'pointer', fontWeight: 500, fontSize: 15, color: '#2E2E2E',
};

// Field wrapper
export function Field({ label, hint, children }: {
  label: string; hint?: string; children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: 'block', fontWeight: 600, fontSize: 14,
        color: '#2E2E2E', marginBottom: 4 }}>
        {label}
      </label>
      {hint && <p style={{ fontSize: 12, color: '#808080', margin: '0 0 6px' }}>{hint}</p>}
      {children}
    </div>
  );
}

// Chip toggle
export function Chip({ label, active, onClick, size = 'md' }: {
  label: string; active: boolean; onClick: () => void; size?: 'sm' | 'md';
}) {
  return (
    <button type="button" onClick={onClick} style={{
      padding: size === 'sm' ? '4px 10px' : '6px 14px',
      borderRadius: 999, cursor: 'pointer',
      border: `1.5px solid ${active ? '#b7d507' : '#e5e5e5'}`,
      background: active ? '#b7d507' : 'white',
      color: active ? '#2E2E2E' : '#808080',
      fontSize: size === 'sm' ? 12 : 13, fontWeight: active ? 600 : 400,
      transition: 'all 150ms ease',
    }}>
      {label}
    </button>
  );
}

// Navigation buttons
export function WizardNav({ onNext, onBack, saving, isFirst = false }: {
  onNext: () => void; onBack?: () => void;
  saving: boolean; isFirst?: boolean;
}) {
  return (
    <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
      {!isFirst && (
        <button type="button" onClick={onBack} style={backBtnStyle}>← Back</button>
      )}
      <button type="button" onClick={onNext} disabled={saving} style={{
        ...nextBtnStyle, flex: 1, opacity: saving ? 0.7 : 1,
      }}>
        {saving ? 'Saving...' : 'Save & Continue →'}
      </button>
    </div>
  );
}

Step 4 — Import Shared Primitives in All Steps
At the top of every step file (Step1Type, Step2Identity, etc.), add:
tsximport { Field, Chip, WizardNav, inputStyle, nextBtnStyle, backBtnStyle } from './shared';

Step 5 — Update Public Artist Profile Display
In the public profile page apps/web/src/app/artists/[id]/page.tsx, add display of the new fields:
tsx// Under the existing profile header, add:

{/* Artist type badge */}
<span style={{
  padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600,
  background: profile.artist_type === 'band' ? '#2E2E2E' : '#f4fbcc',
  color: profile.artist_type === 'band' ? '#b7d507' : '#2E2E2E',
}}>
  {profile.artist_type === 'band'
    ? `🎸 Band · ${profile.band_size} members`
    : '🎤 Solo Artist'}
</span>

{/* Quick stats row */}
<div style={{ display: 'flex', gap: 24, marginTop: 16 }}>
  {profile.years_experience && (
    <Stat label="Experience" value={`${profile.years_experience} years`} />
  )}
  {(profile.setlist_duration_min && profile.setlist_duration_max) && (
    <Stat label="Set Duration"
      value={`${profile.setlist_duration_min}–${profile.setlist_duration_max} min`} />
  )}
  {profile.travel_radius_km && (
    <Stat label="Travels up to" value={`${profile.travel_radius_km} km`} />
  )}
</div>

{/* Band members section — only for bands */}
{profile.artist_type === 'band' && profile.band_members?.length > 0 && (
  <div style={{ marginTop: 24 }}>
    <h3 style={{ fontWeight: 700, marginBottom: 12 }}>Band Members</h3>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {profile.band_members.map((m: any, i: number) => (
        <div key={i} style={{
          padding: '8px 14px', borderRadius: 8,
          background: '#f9f9f9', border: '1px solid #e5e5e5', fontSize: 13
        }}>
          <strong>{m.name}</strong> · {m.role} · {m.instrument}
        </div>
      ))}
    </div>
  </div>
)}

Agent Checklist
BACKEND
[ ] Prisma schema updated with all new ArtistProfile fields
[ ] Migration ran successfully (npx prisma migrate dev)
[ ] UpdateArtistDto updated with all new fields + validation
[ ] artists.service.ts update() method saves all new fields
[ ] calculateCompletion() function implemented correctly
[ ] getMatches() in events.service.ts uses performance_types filter
[ ] PATCH /artists/:id tested with both solo and band payloads
[ ] GET /artists/:id returns all new fields

FRONTEND
[ ] apps/web/src/components/lime/wizard/ folder created
[ ] shared.tsx created with Field, Chip, WizardNav, inputStyle
[ ] StepIndicator.tsx created with progress bar + step pills
[ ] Step1Type.tsx — solo/band selection cards working
[ ] Step2Identity.tsx — name, bio, city, languages working
[ ] Step3Sound.tsx — genres, subgenres, performance_types, experience working
[ ] Step4Setup.tsx — splits correctly on artist_type prop
[ ] Step4Setup.tsx — band member add/remove/edit working
[ ] Step5Pricing.tsx — pricing, travel, riders working
[ ] Step6Portfolio.tsx — portfolio links add/remove working
[ ] Step6Portfolio.tsx — completion score shown + publish gate working
[ ] apps/web/src/app/artists/[id]/edit/page.tsx replaced with wizard
[ ] Auto-save fires on every "Save & Continue" click
[ ] Step resume logic works (reopening page lands on correct step)
[ ] Public profile page shows artist_type badge + new fields
[ ] Band members section only appears for band profiles

TESTING
[ ] Complete wizard as solo artist end-to-end — profile saved correctly
[ ] Complete wizard as band — all band fields saved correctly
[ ] Switching artist_type from solo to band on Step 1 — Step 4 reflects change
[ ] Profile completion score calculates and updates correctly
[ ] Publish button disabled until score >= 80
[ ] Matching endpoint returns artists filtered by performance_types
[ ] No regression on booking flow, contracts, or payments
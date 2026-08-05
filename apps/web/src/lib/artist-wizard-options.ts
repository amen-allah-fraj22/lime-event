export const WIZARD_LANGUAGES = ['Arabic', 'French', 'English', 'Darija', 'Italian', 'Spanish'];

/** Chip label — custom values are stored as separate strings, not this literal. */
export const WIZARD_TAG_OTHER = 'Other';

/** @deprecated Use WIZARD_TAG_OTHER */
export const WIZARD_LANGUAGE_OTHER = WIZARD_TAG_OTHER;

export function splitPresetTags(values: string[] = [], presets: readonly string[]) {
  const preset = values.filter((v) => presets.includes(v));
  const custom = values.filter((v) => !presets.includes(v));
  return { preset, custom };
}

export function mergePresetTags(preset: string[], customText: string): string[] {
  const fromText = customText
    .split(/[,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return Array.from(new Set([...preset, ...fromText]));
}

export function splitProfileLanguages(languages: string[] = []) {
  return splitPresetTags(languages, WIZARD_LANGUAGES);
}

export function mergeProfileLanguages(preset: string[], customText: string): string[] {
  return mergePresetTags(preset, customText);
}

export const WIZARD_GENRES = [
  'Traditional / Malouf',
  'Electronic / DJ',
  'Jazz & Blues',
  'Acoustic / Folk',
  'Hip-Hop',
  'Classical',
  'Pop',
  'Rock',
  'Fusion',
  'Rai',
  'Chaabi',
  'Orchestral',
  'House',
  'Techno',
  'Mezwed',
  'Soul',
  'Live Band',
];

export const WIZARD_SUBGENRES = [
  'Deep House',
  'Techno',
  'Andalusian',
  'Sufi',
  'Bossa Nova',
  'Neo-Soul',
  'Ambient',
  'R&B',
  'Trap',
  'Indie',
  'Latin',
  'Flamenco',
  'Wedding',
  'Corporate',
];

export const PERFORMANCE_TYPES = [
  { value: 'wedding', label: 'Wedding' },
  { value: 'corporate', label: 'Corporate' },
  { value: 'festival', label: 'Festival' },
  { value: 'private', label: 'Private party' },
  { value: 'club', label: 'Club night' },
  { value: 'other', label: 'Other' },
] as const;

export const WIZARD_INSTRUMENTS = [
  'Vocals',
  'Guitar (Acoustic)',
  'Guitar (Electric)',
  'Piano / Keyboard',
  'Drums / Percussion',
  'Bass',
  'Violin',
  'Oud',
  'Qanun',
  'Saxophone',
  'Trumpet',
  'Flute',
  'DJ Decks / Turntables',
  'Electronic / Synth',
  'Darbuka',
  'Tabla',
];

export const PERFORMANCE_STYLES = [
  { value: 'acoustic', label: 'Acoustic / Unplugged' },
  { value: 'full_electric', label: 'Full electric setup' },
  { value: 'dj_set', label: 'DJ set' },
  { value: 'live_looping', label: 'Live looping' },
  { value: 'classical', label: 'Classical / Concert' },
  { value: 'ambient', label: 'Ambient / Background' },
];

export const SETUP_TIME_OPTIONS = [15, 30, 45, 60, 90, 120];

export const PORTFOLIO_LINK_TYPES = [
  'SoundCloud',
  'YouTube',
  'Spotify',
  'Instagram',
  'TikTok',
  'Website',
  'Other',
];

export const WIZARD_STEPS = [
  { number: 1, label: 'Identity & Photos' },
  { number: 2, label: 'Sound & Performance' },
  { number: 3, label: 'Portfolio' },
  { number: 4, label: 'Requirements' },
] as const;

/** Map profile_completion % to suggested resume step. */
export function stepFromCompletion(completion: number): number {
  if (completion === 0) return 1;
  if (completion < 30) return 2;
  if (completion < 60) return 3;
  if (completion < 80) return 4;
  return 4;
}

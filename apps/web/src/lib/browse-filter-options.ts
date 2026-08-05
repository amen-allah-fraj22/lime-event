import { TUNISIA_CITIES } from '@/lib/tunisia-cities';

/** Common performance genres on LIME (merged with artist profiles in the UI). */
export const BROWSE_GENRE_OPTIONS: string[] = [
  'Acoustic',
  'Band',
  'Chaabi',
  'Club',
  'Corporate',
  'DJ',
  'Electronic',
  'Folk',
  'Fusion',
  'House',
  'Jazz',
  'Live Band',
  'Malouf',
  'Mezwed',
  'Nouba',
  'Pop',
  'Rai',
  'Rap',
  'Rock',
  'Soul',
  'Stambali',
  'Techno',
  'Traditional',
  'Wedding',
  'World',
].sort((a, b) => a.localeCompare(b, 'en'));

/** Tunisian / regional genres, surfaced as a distinct group in the genre picker. */
export const TUNISIAN_GENRE_OPTIONS: string[] = [
  'Mezwed',
  'Malouf',
  'Chaabi',
  'Stambali',
  'Nouba',
  'Rai',
  'Fusion',
  'Traditional',
].sort((a, b) => a.localeCompare(b, 'en'));

export const BROWSE_CITY_OPTIONS: string[] = TUNISIA_CITIES;

export function filterOptions(options: string[], query: string, limit = 12): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return options.slice(0, limit);
  return options
    .filter((o) => o.toLowerCase().includes(q))
    .slice(0, limit);
}

export function mergeGenreOptions(fromArtists: string[]): string[] {
  const set = new Set<string>([...BROWSE_GENRE_OPTIONS, ...fromArtists]);
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'en'));
}

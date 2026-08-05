export const TRAVEL_OPTIONS = [
  'I perform within my city only',
  'I travel within 50 km — no surcharge',
  'I travel within 100 km — no surcharge',
  'I charge a travel fee outside my city',
  'I charge a travel fee + accommodation if overnight',
  'I travel anywhere in Tunisia',
  'Other',
] as const;

export const TECHNICAL_OPTIONS = [
  '1× Vocal microphone + stand',
  '2× Vocal microphones + stands',
  'In-ear monitor',
  '2× Stage monitor speakers',
  'PA system (provided by venue)',
  'Direct input (DI) box',
  'Power outlet on stage',
  'Stage minimum 3m × 3m',
  'Stage minimum 5m × 5m',
  'Piano / keyboard on stage',
  'Drum kit provided by venue',
  'Lighting rig (basic)',
  'Soundcheck 1 hour before event',
  'Soundcheck 30 minutes before event',
  'Other',
] as const;

export const HOSPITALITY_OPTIONS = [
  'Still water on stage',
  'Light meal before performance',
  'Full meal before performance',
  'Non-alcoholic beverages',
  'Private dressing room',
  'Parking for 1 vehicle',
  'Parking for 2+ vehicles',
  'Transport from/to venue',
  'Hotel accommodation (overnight events)',
  'Other',
] as const;

/** Coerce legacy string or array rider values from the API. */
export function asStringArray(val: unknown): string[] {
  if (Array.isArray(val)) return val.filter((v): v is string => typeof v === 'string');
  if (typeof val === 'string' && val.trim()) return [val.trim()];
  return [];
}

export const PROVIDES_OPTIONS = [
  { key: 'provides_sound_system', icon: 'volume_up', label: 'Sound system (PA / speakers)' },
  { key: 'provides_mixing_desk', icon: 'tune', label: 'Mixing desk / platine' },
  { key: 'provides_lighting', icon: 'light_mode', label: 'Lighting rig' },
  { key: 'provides_microphones', icon: 'mic', label: 'Microphones' },
  { key: 'provides_instruments', icon: 'music_note', label: 'Instruments' },
  { key: 'provides_stage_backdrop', icon: 'theater_comedy', label: 'Stage backdrop / decor' },
  { key: 'provides_own_transport', icon: 'local_shipping', label: 'Own transport / van' },
] as const;

export const NEEDS_OPTIONS = [
  { key: 'needs_transport', icon: 'directions_car', label: 'Transport to/from venue' },
  { key: 'needs_accommodation', icon: 'hotel', label: 'Hotel / accommodation' },
  { key: 'needs_meals', icon: 'restaurant', label: 'Meals' },
  { key: 'needs_drinks', icon: 'water_drop', label: 'Drinks on stage' },
  { key: 'needs_stage_crew', icon: 'engineering', label: 'Stage crew / setup help' },
  { key: 'needs_parking', icon: 'local_parking', label: 'Parking' },
  { key: 'needs_dressing_room', icon: 'door_front', label: 'Dressing room' },
  { key: 'needs_sound_engineer', icon: 'graphic_eq', label: 'Sound engineer from venue' },
] as const;

export type ProvidesKey = (typeof PROVIDES_OPTIONS)[number]['key'];
export type NeedsKey = (typeof NEEDS_OPTIONS)[number]['key'];

export function getProvidesLabels(profile: Record<string, unknown>): string[] {
  return PROVIDES_OPTIONS.filter((o) => profile[o.key]).map((o) => o.label);
}

export function getNeedsLabels(profile: Record<string, unknown>): string[] {
  return NEEDS_OPTIONS.filter((o) => profile[o.key]).map((o) => o.label);
}

export function isBookingConfirmed(status: string): boolean {
  return status === 'accepted' || status === 'contracted' || status === 'completed';
}

/** @deprecated Use computeBookingTimelineStep from booking-timeline.ts */
export function bookingTimelineStep(status: string): number {
  if (isBookingConfirmed(status)) return 4;
  if (status === 'quoted') return 3;
  if (status === 'negotiating') return 2;
  return 1;
}

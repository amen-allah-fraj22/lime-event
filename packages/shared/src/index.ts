export enum Role {
  artist = 'artist',
  organizer = 'organizer',
  agency = 'agency',
  admin = 'admin',
}

export enum EventType {
  wedding = 'wedding',
  corporate = 'corporate',
  festival = 'festival',
  private = 'private',
  club = 'club',
  other = 'other',
}

export enum BookingStatus {
  pending = 'pending',
  quoted = 'quoted',
  negotiating = 'negotiating',
  accepted = 'accepted',
  contracted = 'contracted',
  completed = 'completed',
  declined = 'declined',
  cancelled = 'cancelled',
  expired = 'expired',
}

export const COLORS = {
  primary: '#b7d507',
  text: '#2E2E2E',
  accent: '#808080',
  background: '#F9F9F9',
  white: '#FFFFFF',
} as const;

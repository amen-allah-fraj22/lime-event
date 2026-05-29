export const APP_ROLES = ['artist', 'organizer', 'agency', 'admin'] as const;
export type AppRole = (typeof APP_ROLES)[number];

export const CONTEXT_SWITCH_ROLES = ['artist', 'organizer'] as const;

export function isAppRole(value: string): value is AppRole {
  return (APP_ROLES as readonly string[]).includes(value);
}

export function normalizeRoles(roles: string[]): AppRole[] {
  return roles.filter(isAppRole);
}

export function isAgencyLockedAccount(roles: string[]): boolean {
  return roles.includes('agency');
}

export function canSwitchActiveRole(roles: string[], target: string): boolean {
  if (isAgencyLockedAccount(roles)) {
    return target === 'agency';
  }
  if (target === 'artist' || target === 'organizer') {
    return roles.includes(target);
  }
  if (target === 'admin') return roles.includes('admin');
  return false;
}

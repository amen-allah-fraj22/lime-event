export const APP_ROLES = ['artist', 'organizer', 'agency', 'admin'] as const;
export type ActiveRole = (typeof APP_ROLES)[number];

/** Artist ↔ organizer context switch only (not agency or admin). */
export const CONTEXT_SWITCH_ROLES = ['artist', 'organizer'] as const;
export type ContextSwitchRole = (typeof CONTEXT_SWITCH_ROLES)[number];

export function isActiveRole(value: string): value is ActiveRole {
  return (APP_ROLES as readonly string[]).includes(value);
}

export function isContextSwitchRole(value: string): value is ContextSwitchRole {
  return (CONTEXT_SWITCH_ROLES as readonly string[]).includes(value);
}

export function normalizeRoles(roles: string[]): ActiveRole[] {
  return roles.filter(isActiveRole);
}

/** Agency accounts stay in agency mode and cannot use the artist/organizer switcher. */
export function isAgencyLockedAccount(roles: ActiveRole[]): boolean {
  return roles.includes('agency');
}

export function getContextSwitchableRoles(roles: ActiveRole[]): ContextSwitchRole[] {
  if (isAgencyLockedAccount(roles)) return [];
  return CONTEXT_SWITCH_ROLES.filter((r) => roles.includes(r));
}

export function canUseContextSwitcher(roles: ActiveRole[]): boolean {
  return getContextSwitchableRoles(roles).length >= 2;
}

export function canSwitchActiveRole(
  roles: ActiveRole[],
  target: ActiveRole,
): boolean {
  if (isAgencyLockedAccount(roles)) {
    return target === 'agency';
  }
  if (isContextSwitchRole(target)) {
    return roles.includes(target);
  }
  if (target === 'admin') return roles.includes('admin');
  return false;
}

export function resolveDefaultActiveRole(
  roles: ActiveRole[],
  preferred?: string,
): ActiveRole {
  if (roles.length === 0) return 'organizer';
  if (isAgencyLockedAccount(roles)) return 'agency';
  if (
    preferred &&
    isActiveRole(preferred) &&
    canSwitchActiveRole(roles, preferred)
  ) {
    return preferred;
  }
  const switchable = getContextSwitchableRoles(roles);
  if (switchable.length > 0) return switchable[0];
  if (roles.includes('admin')) return 'admin';
  return roles[0];
}

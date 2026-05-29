'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import api from '@/lib/api';
import {
  type ActiveRole,
  type ContextSwitchRole,
  canSwitchActiveRole,
  canUseContextSwitcher,
  getContextSwitchableRoles,
  isActiveRole,
  normalizeRoles,
  resolveDefaultActiveRole,
} from '@/lib/roles';

interface RoleContextType {
  roles: ActiveRole[];
  activeRole: ActiveRole;
  switchableRoles: ContextSwitchRole[];
  canUseSwitcher: boolean;
  setActiveRole: (role: ActiveRole) => void;
  hasRole: (role: ActiveRole) => boolean;
  canSwitchTo: (role: ActiveRole) => boolean;
  setRoles: (roles: ActiveRole[]) => void;
}

const RoleContext = createContext<RoleContextType | null>(null);

function readStoredRole(storageKey: string): ActiveRole | null {
  if (typeof window === 'undefined') return null;
  const saved = localStorage.getItem(storageKey);
  return saved && isActiveRole(saved) ? saved : null;
}

export function RoleProvider({
  children,
  userRoles,
  userId,
  dbActiveRole,
}: {
  children: ReactNode;
  userRoles: ActiveRole[];
  userId: string;
  dbActiveRole?: string;
}) {
  const storageKey = `lime_active_role_${userId}`;

  const [roles, setRolesState] = useState<ActiveRole[]>(userRoles);
  const [activeRole, setActiveRoleState] = useState<ActiveRole>(() => {
    const saved = readStoredRole(storageKey);
    const preferred = saved ?? dbActiveRole;
    if (
      preferred &&
      isActiveRole(preferred) &&
      canSwitchActiveRole(userRoles, preferred)
    ) {
      return preferred;
    }
    return resolveDefaultActiveRole(userRoles, dbActiveRole);
  });

  useEffect(() => {
    setRolesState(userRoles);
    setActiveRoleState((current) => {
      if (canSwitchActiveRole(userRoles, current)) return current;
      const saved = readStoredRole(storageKey);
      if (saved && canSwitchActiveRole(userRoles, saved)) return saved;
      if (
        dbActiveRole &&
        isActiveRole(dbActiveRole) &&
        canSwitchActiveRole(userRoles, dbActiveRole)
      ) {
        return dbActiveRole;
      }
      return resolveDefaultActiveRole(userRoles, dbActiveRole);
    });
  }, [userRoles, dbActiveRole, storageKey]);

  const switchableRoles = useMemo(
    () => getContextSwitchableRoles(roles),
    [roles],
  );
  const canUseSwitcher = useMemo(
    () => canUseContextSwitcher(roles),
    [roles],
  );

  const setRoles = useCallback((next: ActiveRole[]) => {
    setRolesState(next);
    setActiveRoleState((current) =>
      canSwitchActiveRole(next, current)
        ? current
        : resolveDefaultActiveRole(next),
    );
  }, []);

  const setActiveRole = useCallback(
    (role: ActiveRole) => {
      if (!canSwitchActiveRole(roles, role)) return;
      localStorage.setItem(storageKey, role);
      setActiveRoleState(role);
      if (userId !== 'guest' && userId !== 'clerk-loading') {
        api
          .patch('/users/me/active-role', { active_role: role }, { skipGlobalError: true })
          .catch(() => {});
      }
    },
    [roles, storageKey, userId],
  );

  const value = useMemo(
    () => ({
      roles,
      activeRole,
      switchableRoles,
      canUseSwitcher,
      setActiveRole,
      hasRole: (role: ActiveRole) => roles.includes(role),
      canSwitchTo: (role: ActiveRole) => canSwitchActiveRole(roles, role),
      setRoles,
    }),
    [roles, activeRole, switchableRoles, canUseSwitcher, setActiveRole, setRoles],
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('useRole must be used inside RoleProvider');
  return ctx;
}

export function useRoleOptional() {
  return useContext(RoleContext);
}

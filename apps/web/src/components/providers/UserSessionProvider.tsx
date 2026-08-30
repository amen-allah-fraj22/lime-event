'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { RoleProvider } from '@/context/RoleContext';
import { rolesFromClerkUser } from '@/lib/auth-sync';
import { fetchMeCached, invalidateMeCache } from '@/lib/me-session';
import { normalizeRoles, type ActiveRole } from '@/lib/roles';

export type DbUser = {
  id: string;
  email: string;
  roles: string[];
  active_role: string;
  is_verified?: boolean;
  artist_profile?: {
    id: string;
    display_name?: string;
    profile_completion?: number;
    is_profile_complete?: boolean;
  } | null;
};

type UserSessionContextType = {
  user: DbUser | null;
  loading: boolean;
  refreshUser: () => Promise<DbUser | null>;
};

const UserSessionContext = createContext<UserSessionContextType | null>(null);

export function useDbUser() {
  const ctx = useContext(UserSessionContext);
  if (!ctx) throw new Error('useDbUser must be used inside UserSessionProvider');
  return ctx;
}

export function useDbUserOptional() {
  return useContext(UserSessionContext);
}

function resolveEffectiveRoles(
  dbUser: DbUser | null,
  clerkUser: ReturnType<typeof useUser>['user'],
  isSignedIn: boolean,
): ActiveRole[] {
  if (!isSignedIn || !clerkUser) return [];
  if (dbUser?.roles?.length) {
    const normalized = normalizeRoles(dbUser.roles);
    if (normalized.length) return normalized;
  }
  const fromClerk = rolesFromClerkUser(clerkUser);
  return fromClerk.length ? fromClerk : ['organizer'];
}

function toDbUser(me: Awaited<ReturnType<typeof fetchMeCached>>): DbUser {
  return {
    id: me.id,
    email: me.email,
    roles: me.roles ?? [],
    active_role: me.active_role ?? me.roles?.[0] ?? 'organizer',
    is_verified: me.is_verified ?? false,
    artist_profile: me.artist_profile ?? null,
  };
}

export function UserSessionProvider({ children }: { children: ReactNode }) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { user: clerkUser } = useUser();
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [syncing, setSyncing] = useState(false);

  const refreshUser = useCallback(async () => {
    if (!isSignedIn || !clerkUser) {
      setDbUser(null);
      return null;
    }
    setSyncing(true);
    try {
      const me = await fetchMeCached(clerkUser, getToken, { force: true });
      const next = toDbUser(me);
      setDbUser(next);
      return next;
    } finally {
      setSyncing(false);
    }
  }, [clerkUser, getToken, isSignedIn]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn || !clerkUser) {
      setDbUser(null);
      setSyncing(false);
      invalidateMeCache();
      return;
    }

    let cancelled = false;
    setSyncing(true);
    fetchMeCached(clerkUser, getToken)
      .then((me) => {
        if (!cancelled) setDbUser(toDbUser(me));
      })
      .catch(() => {
        if (!cancelled) setDbUser(null);
      })
      .finally(() => {
        if (!cancelled) setSyncing(false);
      });

    return () => {
      cancelled = true;
    };
    // Keyed on the Clerk user id rather than the clerkUser object: the object
    // identity changes on every Clerk refresh, which would re-sync the session
    // continuously.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn, clerkUser?.id, getToken]);

  const sessionValue: UserSessionContextType = {
    user: dbUser,
    loading: !isLoaded || syncing,
    refreshUser: async () => {
      invalidateMeCache();
      return refreshUser();
    },
  };

  const roleProps = useMemo(() => {
    const userRoles = resolveEffectiveRoles(dbUser, clerkUser, isSignedIn === true);
    if (!isSignedIn || !clerkUser) {
      return {
        userRoles: [] as ActiveRole[],
        userId: 'guest',
        dbActiveRole: undefined as string | undefined,
      };
    }
    return {
      userRoles,
      userId: dbUser?.id ?? clerkUser.id,
      dbActiveRole: dbUser?.active_role,
    };
  }, [dbUser, clerkUser, isSignedIn]);

  return (
    <UserSessionContext.Provider value={sessionValue}>
      <RoleProvider
        userRoles={roleProps.userRoles}
        userId={roleProps.userId}
        dbActiveRole={roleProps.dbActiveRole}
      >
        {children}
      </RoleProvider>
    </UserSessionContext.Provider>
  );
}

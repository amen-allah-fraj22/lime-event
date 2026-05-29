import axios from 'axios';
import type { UserResource } from '@clerk/types';
import api from './api';
import { isActiveRole, type ActiveRole } from './roles';

export function rolesFromClerkUser(user: UserResource): ActiveRole[] {
  const metaRoles =
    (user.publicMetadata?.roles as string[] | undefined) ??
    (user.unsafeMetadata?.roles as string[] | undefined);
  if (Array.isArray(metaRoles) && metaRoles.length) {
    return metaRoles.filter(isActiveRole);
  }
  const single =
    (user.publicMetadata?.role as string | undefined) ??
    (user.unsafeMetadata?.role as string | undefined);
  if (single && isActiveRole(single)) return [single];
  return ['organizer'];
}

export async function syncUserToDatabase(user: UserResource) {
  await api.post(
    '/auth/sync',
    {
      email: user.primaryEmailAddress?.emailAddress ?? `${user.id}@users.clerk`,
      roles: rolesFromClerkUser(user),
      clerk_user_id: user.id,
    },
    { skipGlobalError: true },
  );
}

export async function ensureDatabaseUser(
  user: UserResource,
  getToken: () => Promise<string | null>,
) {
  const token = await getToken();
  if (!token) throw new Error('You must be signed in.');

  try {
    const res = await api.get('/users/me', { skipGlobalError: true });
    return res.data;
  } catch (e) {
    if (axios.isAxiosError(e) && e.response?.status === 401) {
      await syncUserToDatabase(user);
      const res = await api.get('/users/me', { skipGlobalError: true });
      return res.data;
    }
    throw e;
  }
}

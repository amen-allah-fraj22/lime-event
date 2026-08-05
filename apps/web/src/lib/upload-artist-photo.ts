import api from '@/lib/api';

export type ArtistPhotoKind = 'profile' | 'cover';

const photoField: Record<ArtistPhotoKind, 'profile_photo_url' | 'cover_photo_url'> = {
  profile: 'profile_photo_url',
  cover: 'cover_photo_url',
};

export async function uploadArtistPhoto(
  profileId: string,
  kind: ArtistPhotoKind,
  file: File,
): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await api.post<{ url: string }>(
    `/artists/${profileId}/photos?kind=${kind}`,
    formData,
    { skipGlobalError: true },
  );

  return res.data.url;
}

export async function removeArtistPhoto(profileId: string, kind: ArtistPhotoKind): Promise<void> {
  await api.patch(`/artists/${profileId}`, { [photoField[kind]]: '' }, { skipGlobalError: true });
}

export const ARTIST_PHOTO_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif';
export const ARTIST_PHOTO_MAX_MB = 5;

export function validateArtistPhotoFile(file: File): string | null {
  if (!file.type.startsWith('image/')) {
    return 'Please choose a JPG, PNG, WebP, or GIF image.';
  }
  if (file.size > ARTIST_PHOTO_MAX_MB * 1024 * 1024) {
    return `Image must be ${ARTIST_PHOTO_MAX_MB}MB or smaller.`;
  }
  return null;
}

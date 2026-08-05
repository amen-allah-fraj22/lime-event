import api from '@/lib/api';

export async function uploadEventPhoto(eventId: string, file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await api.post<{ venue_photo_url: string }>(
    `/events/${eventId}/photo`,
    formData,
    { skipGlobalError: true },
  );

  return res.data.venue_photo_url;
}

export const EVENT_PHOTO_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif';
export const EVENT_PHOTO_MAX_MB = 5;

export function validateEventPhotoFile(file: File): string | null {
  if (!file.type.startsWith('image/')) {
    return 'Please choose a JPG, PNG, WebP, or GIF image.';
  }
  if (file.size > EVENT_PHOTO_MAX_MB * 1024 * 1024) {
    return `Image must be ${EVENT_PHOTO_MAX_MB}MB or smaller.`;
  }
  return null;
}

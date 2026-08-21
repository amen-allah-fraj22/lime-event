'use client';

import { useId, useRef, useState } from 'react';
import { MaterialIcon } from '@/components/ui/MaterialIcon';
import { getApiErrorMessage } from '@/lib/api-errors';
import {
  ARTIST_PHOTO_ACCEPT,
  type ArtistPhotoKind,
  removeArtistPhoto,
  uploadArtistPhoto,
  validateArtistPhotoFile,
} from '@/lib/upload-artist-photo';
import { cn } from '@/lib/utils';

type ArtistPhotoUploadProps = {
  profileId: string;
  kind: ArtistPhotoKind;
  label: string;
  hint?: string;
  value?: string;
  onChange: (url: string) => void;
};

export function ArtistPhotoUpload({
  profileId,
  kind,
  label,
  hint,
  value,
  onChange,
}: ArtistPhotoUploadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const displayUrl = preview ?? value;

  async function handleFile(file: File) {
    const validationError = validateArtistPhotoFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setUploading(true);

    try {
      const url = await uploadArtistPhoto(profileId, kind, file);
      onChange(url);
      setPreview(null);
      URL.revokeObjectURL(objectUrl);
    } catch (e) {
      setPreview(null);
      URL.revokeObjectURL(objectUrl);
      setError(getApiErrorMessage(e).message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  const isProfile = kind === 'profile';

  return (
    <div className="mb-5">
      <label htmlFor={inputId} className="mb-1 block text-sm font-semibold text-on-surface">
        {label}
      </label>
      {hint && <p className="mb-3 text-xs text-secondary">{hint}</p>}

      <div
        className={cn(
          'flex flex-col gap-4',
          isProfile ? 'items-start' : 'items-stretch',
        )}
      >
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          aria-label={displayUrl ? `Change ${label}` : `Upload ${label}`}
          className={cn(
            'group relative overflow-hidden border-2 border-dashed border-surface-variant bg-surface-container-lowest transition hover:border-primary-container/60 disabled:opacity-60',
            isProfile ? 'h-32 w-32 rounded-full' : 'h-36 w-full rounded-xl md:h-44',
          )}
        >
          {displayUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={displayUrl}
              alt=""
              className={cn(
                'h-full w-full object-cover',
                isProfile ? 'rounded-full' : 'rounded-[10px]',
              )}
            />
          ) : (
            <div
              className={cn(
                'flex h-full flex-col items-center justify-center gap-2 px-4 text-secondary',
                isProfile && 'rounded-full',
              )}
            >
              <MaterialIcon name="photo_camera" size={isProfile ? 32 : 40} />
              <span className="text-center text-xs font-medium">
                {uploading ? 'Uploading…' : 'Click to upload'}
              </span>
            </div>
          )}

          {displayUrl && (
            <div
              className={cn(
                'absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition group-hover:opacity-100',
                isProfile ? 'rounded-full' : 'rounded-[10px]',
              )}
            >
              <MaterialIcon name="edit" size={28} className="text-white" />
            </div>
          )}

          {uploading && (
            <div
              className={cn(
                'absolute inset-0 flex items-center justify-center bg-white/70',
                isProfile ? 'rounded-full' : 'rounded-[10px]',
              )}
            >
              <MaterialIcon name="progress_activity" size={28} className="animate-spin text-primary" />
            </div>
          )}
        </button>

        <div className="text-xs text-secondary">
          <p>JPG, PNG, WebP or GIF · max 5MB</p>
          {value && !uploading && (
            <button
              type="button"
              onClick={() => {
                void (async () => {
                  setUploading(true);
                  setError(null);
                  try {
                    await removeArtistPhoto(profileId, kind);
                    onChange('');
                    setPreview(null);
                  } catch (e) {
                    setError(getApiErrorMessage(e).message);
                  } finally {
                    setUploading(false);
                  }
                })();
              }}
              className="mt-1 font-semibold text-primary hover:underline"
            >
              Remove photo
            </button>
          )}
        </div>
      </div>

      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept={ARTIST_PHOTO_ACCEPT}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}

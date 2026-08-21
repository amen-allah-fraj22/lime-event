import { existsSync, mkdirSync } from 'fs';
import { extname, join } from 'path';
import { diskStorage, memoryStorage } from 'multer';

const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

// Mirrors StorageService.enabled — checked once at module load (env vars don't
// change mid-process), so the interceptor picks the right multer engine before
// any request arrives: memoryStorage (buffer) feeds Supabase Storage in
// production, diskStorage is the local-dev fallback when it's unconfigured.
const useCloudStorage = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

export function buildArtistPhotoFilename(kind: string, originalname: string): string {
  const safeKind = kind === 'cover' ? 'cover' : 'profile';
  const ext = extname(originalname).toLowerCase();
  const safeExt = ALLOWED_EXT.has(ext) ? ext : '.jpg';
  return `${safeKind}-${Date.now()}${safeExt}`;
}

export function artistPhotoMulterOptions() {
  return {
    storage: useCloudStorage
      ? memoryStorage()
      : diskStorage({
          destination: (req, _file, cb) => {
            const profileId = String(req.params.id);
            const dir = join(process.cwd(), 'uploads', 'artist-photos', profileId);
            if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
            cb(null, dir);
          },
          filename: (req, file, cb) => {
            const kind = String(req.query.kind ?? '');
            cb(null, buildArtistPhotoFilename(kind, file.originalname));
          },
        }),
    fileFilter: (
      _req: Express.Request,
      file: Express.Multer.File,
      cb: (error: Error | null, acceptFile: boolean) => void,
    ) => {
      if (!file.mimetype.startsWith('image/')) {
        cb(new Error('Only image files are allowed'), false);
        return;
      }
      cb(null, true);
    },
    limits: { fileSize: 5 * 1024 * 1024 },
  };
}

export function buildArtistPhotoUrl(profileId: string, filename: string): string {
  const base =
    process.env.UPLOAD_PUBLIC_BASE_URL?.replace(/\/$/, '') ??
    `http://localhost:${process.env.PORT ?? 3001}`;
  return `${base}/uploads/artist-photos/${profileId}/${filename}`;
}

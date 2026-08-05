import { existsSync, mkdirSync } from 'fs';
import { extname, join } from 'path';
import { diskStorage } from 'multer';

const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

export function eventPhotoMulterOptions() {
  return {
    storage: diskStorage({
      destination: (req, _file, cb) => {
        const eventId = String(req.params.id);
        const dir = join(process.cwd(), 'uploads', 'event-photos', eventId);
        if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
        cb(null, dir);
      },
      filename: (_req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        const safeExt = ALLOWED_EXT.has(ext) ? ext : '.jpg';
        cb(null, `venue-${Date.now()}${safeExt}`);
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

export function buildEventPhotoUrl(eventId: string, filename: string): string {
  const base =
    process.env.UPLOAD_PUBLIC_BASE_URL?.replace(/\/$/, '') ??
    `http://localhost:${process.env.PORT ?? 3001}`;
  return `${base}/uploads/event-photos/${eventId}/${filename}`;
}

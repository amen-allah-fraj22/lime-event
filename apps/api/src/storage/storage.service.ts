import { Injectable, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Uploads files to Supabase Storage when SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY
 * are set (production), so uploaded photos survive redeploys — Railway's own
 * filesystem is wiped on every deploy, so local disk storage alone would lose
 * every artist/event photo the moment the API redeploys. `enabled` is false
 * when those vars are absent (local dev), so callers can fall back to disk.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: SupabaseClient | null;
  readonly enabled: boolean;

  constructor() {
    const url = process.env.SUPABASE_URL;
    // Service role key, not the anon key — uploads happen server-side only
    // and must bypass bucket RLS regardless of the (public, read-only) policy.
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    this.enabled = Boolean(url && key);
    this.client = this.enabled ? createClient(url as string, key as string) : null;
    if (this.enabled) {
      this.logger.log('Supabase Storage configured — uploads will persist across deploys.');
    }
  }

  async upload(bucket: string, path: string, buffer: Buffer, contentType: string): Promise<string> {
    if (!this.client) {
      throw new Error('StorageService.upload called without Supabase Storage configured');
    }
    const { error } = await this.client.storage.from(bucket).upload(path, buffer, {
      contentType,
      upsert: true,
    });
    if (error) {
      throw new Error(`Supabase Storage upload failed (${bucket}/${path}): ${error.message}`);
    }
    return this.client.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  }
}

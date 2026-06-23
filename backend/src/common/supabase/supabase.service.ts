import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Cliente admin do Supabase (service-role). Usado pelo backend para
 * Storage (fotos de evolucao) e operacoes administrativas de Auth.
 * NUNCA expor a service-role key no frontend.
 */
@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private readonly admin: SupabaseClient;
  private readonly photosBucket: string;

  constructor(private readonly config: ConfigService) {
    this.admin = createClient(
      this.config.getOrThrow<string>('SUPABASE_URL'),
      this.config.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY'),
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
    this.photosBucket =
      this.config.get<string>('SUPABASE_PHOTOS_BUCKET') ?? 'evolution-photos';
  }

  get client(): SupabaseClient {
    return this.admin;
  }

  /** Gera URL assinada (temporaria) para uma foto privada de evolucao. */
  async signedPhotoUrl(storagePath: string, expiresInSec = 3600): Promise<string> {
    const { data, error } = await this.admin.storage
      .from(this.photosBucket)
      .createSignedUrl(storagePath, expiresInSec);
    if (error) {
      this.logger.error(`Falha ao assinar URL: ${error.message}`);
      throw error;
    }
    return data.signedUrl;
  }

  /** Upload de foto de evolucao para o bucket privado. */
  async uploadPhoto(
    storagePath: string,
    file: Buffer,
    contentType: string,
  ): Promise<string> {
    const { error } = await this.admin.storage
      .from(this.photosBucket)
      .upload(storagePath, file, { contentType, upsert: true });
    if (error) {
      this.logger.error(`Falha no upload: ${error.message}`);
      throw error;
    }
    return storagePath;
  }
}

import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

/**
 * Wrapper fino sobre a API da OpenAI. Inicializacao preguicosa para o app
 * subir mesmo sem a OPENAI_API_KEY configurada (so falha quando usado).
 */
@Injectable()
export class OpenAiService {
  private readonly logger = new Logger(OpenAiService.name);
  private cached: OpenAI | null = null;

  constructor(private readonly config: ConfigService) {}

  private get client(): OpenAI {
    if (this.cached) return this.cached;
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'OPENAI_API_KEY nao configurada — motor de personas indisponivel.',
      );
    }
    this.cached = new OpenAI({ apiKey });
    return this.cached;
  }

  private get model(): string {
    return this.config.get<string>('OPENAI_MODEL') ?? 'gpt-4o-mini';
  }

  /**
   * Pede ao modelo uma resposta em JSON e retorna o objeto ja parseado.
   * Usa response_format json_object para garantir JSON valido.
   */
  async completeJson<T>(system: string, user: string): Promise<T> {
    const completion = await this.client.chat.completions.create({
      model: this.model,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new ServiceUnavailableException('Resposta vazia da OpenAI.');
    }
    try {
      return JSON.parse(content) as T;
    } catch {
      this.logger.error(`JSON invalido da OpenAI: ${content.slice(0, 200)}`);
      throw new ServiceUnavailableException('JSON invalido retornado pela IA.');
    }
  }
}

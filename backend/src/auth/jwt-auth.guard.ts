import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { createRemoteJWKSet, jwtVerify, JWTVerifyGetKey } from 'jose';
import { AuthService } from './auth.service';
import { IS_PUBLIC_KEY } from './public.decorator';

/**
 * Valida o JWT emitido pelo Supabase Auth.
 *
 * Projetos novos do Supabase assinam com chaves ASSIMETRICAS (ES256) e
 * publicam as chaves publicas no endpoint JWKS. Aqui verificamos a assinatura
 * contra esse JWKS (com cache automatico da lib `jose`), conferindo tambem
 * o emissor (issuer) e a audiencia (audience).
 *
 * Em rotas @Public() libera sem token. Se valido, anexa o usuario do nosso
 * banco em request.user.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly jwks: JWTVerifyGetKey;
  private readonly issuer: string;

  constructor(
    private readonly config: ConfigService,
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
  ) {
    const baseUrl = this.config
      .getOrThrow<string>('SUPABASE_URL')
      .replace(/\/$/, '');
    this.issuer = `${baseUrl}/auth/v1`;
    this.jwks = createRemoteJWKSet(
      new URL(`${this.issuer}/.well-known/jwks.json`),
    );
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);
    if (!token) {
      throw new UnauthorizedException('Token de acesso ausente.');
    }

    let sub: string | undefined;
    let email: string | undefined;
    try {
      const { payload } = await jwtVerify(token, this.jwks, {
        issuer: this.issuer,
        audience: 'authenticated',
      });
      sub = payload.sub;
      email = typeof payload.email === 'string' ? payload.email : undefined;
    } catch {
      throw new UnauthorizedException('Token invalido ou expirado.');
    }

    if (!sub) {
      throw new UnauthorizedException('Token sem identificacao de usuario.');
    }

    request.user = await this.authService.syncUser(sub, email);
    return true;
  }

  private extractToken(request: Request): string | null {
    const header = request.headers.authorization;
    if (!header) return null;
    const [type, value] = header.split(' ');
    return type === 'Bearer' && value ? value : null;
  }
}

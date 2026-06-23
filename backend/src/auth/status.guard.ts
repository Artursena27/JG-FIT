import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { StudentStatus, Role } from '@prisma/client';
import { Request } from 'express';
import { STATUS_KEY } from './status.decorator';
import { PrismaService } from '../common/prisma/prisma.service';

/**
 * Roda depois do JwtAuthGuard. Se a rota exige um status de aluno específico,
 * busca o perfil no banco e barra o acesso (403) se não bater.
 * Se o usuário for PROFESSOR, libera direto.
 */
@Injectable()
export class StatusGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredStatuses = this.reflector.getAllAndOverride<StudentStatus[]>(
      STATUS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredStatuses || requiredStatuses.length === 0) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as any;

    if (!user) {
      throw new ForbiddenException('Usuário não autenticado.');
    }

    // Se for professor, não passa por status de aluno
    if (user.role === Role.PROFESSOR) {
      return true;
    }

    // Busca o status do aluno logado
    const student = await this.prisma.student.findUnique({
      where: { userId: user.id },
      select: { status: true },
    });

    if (!student || !requiredStatuses.includes(student.status)) {
      throw new ForbiddenException(
        'Você não tem o status necessário para acessar esta rota. Complete seu cadastro ou aguarde aprovação.',
      );
    }

    return true;
  }
}

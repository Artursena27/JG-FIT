import { Controller, Get } from '@nestjs/common';
import type { User } from '@prisma/client';
import { CurrentUser } from './current-user.decorator';
import { PrismaService } from '../common/prisma/prisma.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly prisma: PrismaService) {}

  /** Retorna o usuario logado (util para o frontend saber quem entrou). */
  @Get('me')
  async me(@CurrentUser() user: User) {
    let status: string | null = null;
    
    if (user.role === 'ALUNO') {
      const student = await this.prisma.student.findUnique({ where: { userId: user.id } });
      status = student?.status || 'PENDING';
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status,
    };
  }
}

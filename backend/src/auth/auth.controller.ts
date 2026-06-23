import { Controller, Get } from '@nestjs/common';
import type { User } from '@prisma/client';
import { CurrentUser } from './current-user.decorator';

@Controller('auth')
export class AuthController {
  /** Retorna o usuario logado (util para o frontend saber quem entrou). */
  @Get('me')
  me(@CurrentUser() user: User) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }
}

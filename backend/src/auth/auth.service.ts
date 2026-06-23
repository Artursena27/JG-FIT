import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role, User } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Sincroniza o usuario do Supabase Auth no nosso banco.
   * Chave estavel = id (sub do JWT, igual ao id do Supabase Auth).
   *
   * Ordem de resolucao:
   *  1) ja existe por id -> atualiza e-mail se mudou e retorna.
   *  2) existe alguem com esse e-mail mas outro id (ex: linha de seed) ->
   *     relinca esse registro para o id real do Supabase.
   *  3) ninguem -> cria. Papel = PROFESSOR se o e-mail bate com PROFESSOR_EMAIL.
   */
  async syncUser(id: string, email: string | undefined): Promise<User> {
    const byId = await this.prisma.user.findUnique({ where: { id } });
    if (byId) {
      if (email && byId.email !== email) {
        return this.prisma.user.update({ where: { id }, data: { email } });
      }
      return byId;
    }

    if (email) {
      const byEmail = await this.prisma.user.findUnique({ where: { email } });
      if (byEmail && byEmail.id !== id) {
        // mesma pessoa, registro pre-existente (seed) -> aponta para o id real
        return this.prisma.user.update({ where: { email }, data: { id } });
      }
    }

    const professorEmail = this.config
      .get<string>('PROFESSOR_EMAIL')
      ?.toLowerCase();
    const isProfessor =
      !!email && !!professorEmail && email.toLowerCase() === professorEmail;

    return this.prisma.user.create({
      data: {
        id,
        email: email ?? `${id}@sem-email.local`,
        role: isProfessor ? Role.PROFESSOR : Role.ALUNO,
      },
    });
  }
}

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role, User } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly mailService: MailService,
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

    const user = await this.prisma.user.create({
      data: {
        id,
        email: email ?? `${id}@sem-email.local`,
        role: isProfessor ? Role.PROFESSOR : Role.ALUNO,
      },
    });

    if (!isProfessor) {
      await this.prisma.student.create({
        data: {
          userId: id,
          name: email ? email.split('@')[0] : 'Novo Aluno',
          status: 'PENDING',
        },
      });
      // Dispara o e-mail de aprovação apenas na CRIAÇÃO (idempotente)
      if (email) {
        await this.mailService.sendAwaitingApproval(email);
      }
    }

    return user;
  }
}

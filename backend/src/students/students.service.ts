import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { OnboardingDto } from './dto/onboarding.dto';

@Injectable()
export class StudentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async getMe(userId: string) {
    const student = await this.prisma.student.findUnique({
      where: { userId },
    });
    if (!student) throw new NotFoundException('Aluno não encontrado');
    return student;
  }

  async saveOnboarding(userId: string, data: OnboardingDto) {
    const student = await this.getMe(userId);

    // Só permite onboarding se estiver APPROVED (ou já estiver refazendo)
    if (student.status === 'PENDING' || student.status === 'REJECTED') {
      throw new ForbiddenException('Seu cadastro ainda não foi aprovado.');
    }

    // Como as datas vêm como string ISO, convertemos para Date
    const mappedData: any = { ...data };
    if (data.birthdate) {
      mappedData.birthdate = new Date(data.birthdate);
    }

    return this.prisma.student.update({
      where: { id: student.id },
      data: {
        ...mappedData,
        status: 'ONBOARDED', // Marca como finalizado
      },
    });
  }

  async getApproved() {
    // Inclui APPROVED (aprovado, ainda fazendo onboarding) e ONBOARDED (ativo de fato),
    // para o aluno recem-aprovado nao sumir da lista do professor.
    return this.prisma.student.findMany({
      where: { status: { in: ['APPROVED', 'ONBOARDED'] } },
      orderBy: { name: 'asc' },
    });
  }

  async getPending() {
    return this.prisma.student.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approve(id: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!student) throw new NotFoundException('Aluno não encontrado');

    const updated = await this.prisma.student.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
      },
    });

    if (student.user?.email) {
      await this.mailService.sendApproved(student.user.email);
    }

    return updated;
  }

  async reject(id: string) {
    return this.prisma.student.update({
      where: { id },
      data: { status: 'REJECTED' },
    });
  }
}

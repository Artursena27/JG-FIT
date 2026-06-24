import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  /** Resolve o Student do usuario logado (aluno). */
  private async resolveStudent(userId: string) {
    const student = await this.prisma.student.findUnique({
      where: { userId },
    });
    if (!student) throw new NotFoundException('Aluno não encontrado');
    return student;
  }

  // ---------------------------------------------------------
  // Aluno (resolve studentId pelo userId)
  // ---------------------------------------------------------

  async getMyMessages(userId: string) {
    const student = await this.resolveStudent(userId);
    return this.prisma.chatMessage.findMany({
      where: { studentId: student.id },
      orderBy: { sentAt: 'asc' },
    });
  }

  async sendMyMessage(userId: string, data: SendMessageDto) {
    const student = await this.resolveStudent(userId);
    return this.prisma.chatMessage.create({
      data: {
        studentId: student.id,
        fromUserId: userId,
        body: data.body,
      },
    });
  }

  async markMyMessagesRead(userId: string) {
    const student = await this.resolveStudent(userId);
    // Marca como lidas apenas as mensagens que NAO foram enviadas pelo proprio aluno.
    return this.prisma.chatMessage.updateMany({
      where: {
        studentId: student.id,
        fromUserId: { not: userId },
        readAt: null,
      },
      data: { readAt: new Date() },
    });
  }

  // ---------------------------------------------------------
  // Professor (recebe o Student.id na URL)
  // ---------------------------------------------------------

  async getConversation(studentId: string) {
    return this.prisma.chatMessage.findMany({
      where: { studentId },
      orderBy: { sentAt: 'asc' },
    });
  }

  async sendMessage(studentId: string, userId: string, data: SendMessageDto) {
    return this.prisma.chatMessage.create({
      data: {
        studentId,
        fromUserId: userId,
        body: data.body,
      },
    });
  }

  async markConversationRead(studentId: string, userId: string) {
    // Marca como lidas apenas as mensagens que NAO foram enviadas pelo professor.
    return this.prisma.chatMessage.updateMany({
      where: {
        studentId,
        fromUserId: { not: userId },
        readAt: null,
      },
      data: { readAt: new Date() },
    });
  }
}

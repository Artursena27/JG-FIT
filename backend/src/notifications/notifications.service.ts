import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMine(userId: string, unread: boolean) {
    return this.prisma.notification.findMany({
      where: {
        OR: [{ userId }, { student: { userId } }],
        ...(unread ? { isRead: false } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAsRead(userId: string, id: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
      include: { student: { select: { userId: true } } },
    });
    if (!notification) throw new NotFoundException('Notificação não encontrada');

    const belongsToUser =
      notification.userId === userId ||
      notification.student?.userId === userId;
    if (!belongsToUser) {
      throw new ForbiddenException('Esta notificação não pertence a você.');
    }

    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        OR: [{ userId }, { student: { userId } }],
        isRead: false,
      },
      data: { isRead: true },
    });
  }

  async createForStudent(studentId: string, data: CreateNotificationDto) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: { userId: true },
    });
    if (!student) throw new NotFoundException('Aluno não encontrado');

    return this.prisma.notification.create({
      data: {
        studentId,
        userId: student.userId ?? null,
        title: data.title,
        message: data.message,
        type: data.type,
      },
    });
  }
}

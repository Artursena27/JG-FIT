import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../auth/current-user.decorator';
import type { User } from '@prisma/client';
import { Role } from '@prisma/client';
import { Roles } from '../auth/roles.decorator';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Controller()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // ---------------------------------------------------------
  // Rotas do Aluno
  // ---------------------------------------------------------

  @Get('notifications/me')
  getMine(@CurrentUser() user: User, @Query('unread') unread?: string) {
    return this.notificationsService.getMine(user.id, unread === 'true');
  }

  @Post('notifications/me/read-all')
  markAllAsRead(@CurrentUser() user: User) {
    return this.notificationsService.markAllAsRead(user.id);
  }

  @Post('notifications/:id/read')
  markAsRead(@CurrentUser() user: User, @Param('id') id: string) {
    return this.notificationsService.markAsRead(user.id, id);
  }

  // ---------------------------------------------------------
  // Rotas do Professor
  // ---------------------------------------------------------

  @Post('students/:id/notifications')
  @Roles(Role.PROFESSOR)
  createForStudent(
    @Param('id') id: string,
    @Body() data: CreateNotificationDto,
  ) {
    return this.notificationsService.createForStudent(id, data);
  }
}

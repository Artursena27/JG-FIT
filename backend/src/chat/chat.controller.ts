import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CurrentUser } from '../auth/current-user.decorator';
import type { User } from '@prisma/client';
import { Role } from '@prisma/client';
import { SendMessageDto } from './dto/send-message.dto';
import { Roles } from '../auth/roles.decorator';
import { RequireStatus } from '../auth/status.decorator';

@Controller()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // ---------------------------------------------------------
  // Rotas do Aluno (resolve o Student pelo @CurrentUser)
  // Literais ("me") declaradas ANTES das rotas com :param.
  // ---------------------------------------------------------

  @Get('chat/me')
  @RequireStatus('ONBOARDED')
  getMyMessages(@CurrentUser() user: User) {
    return this.chatService.getMyMessages(user.id);
  }

  @Post('chat/me')
  @RequireStatus('ONBOARDED')
  sendMyMessage(@CurrentUser() user: User, @Body() data: SendMessageDto) {
    return this.chatService.sendMyMessage(user.id, data);
  }

  @Post('chat/me/read')
  @RequireStatus('ONBOARDED')
  markMyMessagesRead(@CurrentUser() user: User) {
    return this.chatService.markMyMessagesRead(user.id);
  }

  // ---------------------------------------------------------
  // Rotas do Professor (recebem o Student.id na URL)
  // ---------------------------------------------------------

  @Get('chat/:studentId')
  @Roles(Role.PROFESSOR)
  getConversation(@Param('studentId') studentId: string) {
    return this.chatService.getConversation(studentId);
  }

  @Post('chat/:studentId')
  @Roles(Role.PROFESSOR)
  sendMessage(
    @Param('studentId') studentId: string,
    @CurrentUser() user: User,
    @Body() data: SendMessageDto,
  ) {
    return this.chatService.sendMessage(studentId, user.id, data);
  }

  @Post('chat/:studentId/read')
  @Roles(Role.PROFESSOR)
  markConversationRead(
    @Param('studentId') studentId: string,
    @CurrentUser() user: User,
  ) {
    return this.chatService.markConversationRead(studentId, user.id);
  }
}

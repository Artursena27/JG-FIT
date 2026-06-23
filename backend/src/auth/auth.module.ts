import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { StatusGuard } from './status.guard';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [MailModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    // Ordem importa: JwtAuthGuard autentica e popula request.user;
    // RolesGuard checa o papel depois.
    // StatusGuard checa o status de aluno depois do papel.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: StatusGuard },
  ],
  exports: [AuthService],
})
export class AuthModule {}

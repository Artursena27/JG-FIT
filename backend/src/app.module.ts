import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './common/prisma/prisma.module';
import { SupabaseModule } from './common/supabase/supabase.module';
import { AiModule } from './ai/ai.module';
import { AuthModule } from './auth/auth.module';
import { StudentsModule } from './students/students.module';
import { MailModule } from './mail/mail.module';
import { PersonasModule } from './personas/personas.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    SupabaseModule,
    AiModule,
    AuthModule,
    StudentsModule,
    MailModule,
    PersonasModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

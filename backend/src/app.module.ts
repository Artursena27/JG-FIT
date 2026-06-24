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
import { ExercisesModule } from './exercises/exercises.module';
import { WorkoutsModule } from './workouts/workouts.module';
import { ScheduleModule } from './schedule/schedule.module';
import { EvolutionModule } from './evolution/evolution.module';

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
    ExercisesModule,
    WorkoutsModule,
    ScheduleModule,
    EvolutionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

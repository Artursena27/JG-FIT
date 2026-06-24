import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { SupabaseService } from '../common/supabase/supabase.service';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { CreateMeasurementDto } from './dto/create-measurement.dto';
import { CreatePhotoDto } from './dto/create-photo.dto';

@Injectable()
export class EvolutionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabase: SupabaseService,
  ) {}

  // Resolve o Student a partir do usuário logado (rotas /students/me/*)
  private async getStudentByUser(userId: string) {
    const student = await this.prisma.student.findUnique({
      where: { userId },
    });
    if (!student) throw new NotFoundException('Aluno não encontrado');
    return student;
  }

  // ---------------------------------------------------------
  // Assessments (avaliações)
  // ---------------------------------------------------------

  async listAssessments(studentId: string) {
    return this.prisma.assessment.findMany({
      where: { studentId },
      orderBy: { date: 'desc' },
    });
  }

  async listMyAssessments(userId: string) {
    const student = await this.getStudentByUser(userId);
    return this.listAssessments(student.id);
  }

  async createAssessment(studentId: string, data: CreateAssessmentDto) {
    return this.prisma.assessment.create({
      data: {
        studentId,
        date: data.date ? new Date(data.date) : undefined,
        weightKg: data.weightKg,
        bodyFatPct: data.bodyFatPct,
        circumferences: data.circumferences,
        notes: data.notes,
      },
    });
  }

  // ---------------------------------------------------------
  // Measurements (medidas)
  // ---------------------------------------------------------

  async listMeasurements(studentId: string) {
    return this.prisma.measurement.findMany({
      where: { studentId },
      orderBy: { date: 'desc' },
    });
  }

  async listMyMeasurements(userId: string) {
    const student = await this.getStudentByUser(userId);
    return this.listMeasurements(student.id);
  }

  async createMeasurement(studentId: string, data: CreateMeasurementDto) {
    return this.prisma.measurement.create({
      data: {
        studentId,
        date: data.date ? new Date(data.date) : undefined,
        weightKg: data.weightKg,
        bodyFatPct: data.bodyFatPct,
        extra: data.extra,
      },
    });
  }

  // ---------------------------------------------------------
  // Progress Photos (fotos de progresso)
  // ---------------------------------------------------------

  async listPhotos(studentId: string) {
    const photos = await this.prisma.progressPhoto.findMany({
      where: { studentId },
      orderBy: { date: 'desc' },
    });

    // Gera uma URL assinada temporária para cada foto privada do Storage
    return Promise.all(
      photos.map(async (photo) => ({
        ...photo,
        signedUrl: await this.supabase.signedPhotoUrl(photo.storagePath),
      })),
    );
  }

  async listMyPhotos(userId: string) {
    const student = await this.getStudentByUser(userId);
    return this.listPhotos(student.id);
  }

  async createPhoto(studentId: string, data: CreatePhotoDto) {
    return this.prisma.progressPhoto.create({
      data: {
        studentId,
        storagePath: data.storagePath,
        angle: data.angle,
        date: data.date ? new Date(data.date) : undefined,
      },
    });
  }
}

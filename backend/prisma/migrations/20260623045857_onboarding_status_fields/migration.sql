-- CreateEnum
CREATE TYPE "StudentStatus" AS ENUM ('PENDING', 'APPROVED', 'ONBOARDED', 'REJECTED');

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "availableDays" JSONB,
ADD COLUMN     "equipment" TEXT,
ADD COLUMN     "experienceLevel" TEXT,
ADD COLUMN     "goalDeadline" TEXT,
ADD COLUMN     "healthConditions" TEXT,
ADD COLUMN     "injuries" TEXT,
ADD COLUMN     "preferences" TEXT,
ADD COLUMN     "preferredTime" TEXT,
ADD COLUMN     "profession" TEXT,
ADD COLUMN     "sessionTime" INTEGER,
ADD COLUMN     "sleepHours" DOUBLE PRECISION,
ADD COLUMN     "status" "StudentStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "trainingLocation" TEXT,
ADD COLUMN     "trainingTime" TEXT;

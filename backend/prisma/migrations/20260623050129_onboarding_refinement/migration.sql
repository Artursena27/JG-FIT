/*
  Warnings:

  - You are about to drop the column `experienceLevel` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `sessionTime` on the `Student` table. All the data in the column will be lost.
  - The `preferences` column on the `Student` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "TrainingExperience" AS ENUM ('INICIANTE', 'INTERMEDIARIO', 'AVANCADO');

-- AlterTable
ALTER TABLE "Student" DROP COLUMN "experienceLevel",
DROP COLUMN "sessionTime",
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "sessionMinutes" INTEGER,
ADD COLUMN     "trainingExperience" "TrainingExperience",
DROP COLUMN "preferences",
ADD COLUMN     "preferences" JSONB;

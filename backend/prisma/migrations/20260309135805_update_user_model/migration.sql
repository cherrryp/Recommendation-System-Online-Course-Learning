-- CreateEnum
CREATE TYPE "EducationLevel" AS ENUM ('SECONDARY', 'HIGH_SCHOOL', 'DIPLOMA', 'BACHELOR', 'MASTER', 'DOCTORATE', 'OTHER');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "birthDate" TIMESTAMP(3),
ADD COLUMN     "educationLevel" "EducationLevel",
ADD COLUMN     "fname" TEXT,
ADD COLUMN     "lname" TEXT;

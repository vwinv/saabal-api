/*
  Warnings:

  - You are about to drop the column `firtsname` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "firtsname",
ADD COLUMN     "firstname" TEXT;

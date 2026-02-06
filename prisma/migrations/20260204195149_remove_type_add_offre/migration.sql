/*
  Warnings:

  - You are about to drop the column `type` on the `Abonnement` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Abonnement" DROP COLUMN "type",
ADD COLUMN     "offreId" INTEGER;

-- CreateTable
CREATE TABLE "Offre" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "prix" DECIMAL(65,30) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Offre_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Abonnement" ADD CONSTRAINT "Abonnement_offreId_fkey" FOREIGN KEY ("offreId") REFERENCES "Offre"("id") ON DELETE SET NULL ON UPDATE CASCADE;

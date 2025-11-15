/*
  Warnings:

  - You are about to drop the column `newsletterId` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the `Newsletter` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `categorieId` to the `Journal` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Document" DROP CONSTRAINT "Document_newsletterId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Newsletter" DROP CONSTRAINT "Newsletter_categorieId_fkey";

-- AlterTable
ALTER TABLE "public"."Document" DROP COLUMN "newsletterId",
ADD COLUMN     "journalId" INTEGER;

-- AlterTable
ALTER TABLE "public"."Journal" ADD COLUMN     "categorieId" INTEGER NOT NULL,
ADD COLUMN     "content" TEXT;

-- DropTable
DROP TABLE "public"."Newsletter";

-- AddForeignKey
ALTER TABLE "public"."Journal" ADD CONSTRAINT "Journal_categorieId_fkey" FOREIGN KEY ("categorieId") REFERENCES "public"."Categorie"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Document" ADD CONSTRAINT "Document_journalId_fkey" FOREIGN KEY ("journalId") REFERENCES "public"."Journal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

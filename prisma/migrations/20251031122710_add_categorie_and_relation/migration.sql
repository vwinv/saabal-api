/*
  Warnings:

  - Added the required column `categorieId` to the `Newsletter` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Newsletter" ADD COLUMN     "categorieId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "public"."Categorie" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Categorie_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Categorie_name_key" ON "public"."Categorie"("name");

-- AddForeignKey
ALTER TABLE "public"."Newsletter" ADD CONSTRAINT "Newsletter_categorieId_fkey" FOREIGN KEY ("categorieId") REFERENCES "public"."Categorie"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

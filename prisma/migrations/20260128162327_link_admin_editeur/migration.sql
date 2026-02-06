-- AlterTable
ALTER TABLE "User" ADD COLUMN     "editeurId" INTEGER;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_editeurId_fkey" FOREIGN KEY ("editeurId") REFERENCES "Editeur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

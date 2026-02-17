/*
  Warnings:

  - You are about to drop the column `lien` on the `Publicite` table. All the data in the column will be lost.
  - You are about to drop the column `position` on the `Publicite` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Publicite" DROP COLUMN "lien",
DROP COLUMN "position",
ADD COLUMN     "description" TEXT;

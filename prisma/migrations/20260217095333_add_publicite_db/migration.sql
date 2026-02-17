-- CreateTable
CREATE TABLE "Publicite" (
    "id" SERIAL NOT NULL,
    "titre" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "lien" TEXT,
    "position" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Publicite_pkey" PRIMARY KEY ("id")
);

-- CreateEnum
CREATE TYPE "public"."DocumentKind" AS ENUM ('NEWSLETTER_PDF', 'NEWSLETTER_COVER', 'EDITEUR_LOGO');

-- CreateTable
CREATE TABLE "public"."Document" (
    "id" SERIAL NOT NULL,
    "kind" "public"."DocumentKind" NOT NULL,
    "url" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "newsletterId" INTEGER,
    "editeurId" INTEGER,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Document" ADD CONSTRAINT "Document_newsletterId_fkey" FOREIGN KEY ("newsletterId") REFERENCES "public"."Newsletter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Document" ADD CONSTRAINT "Document_editeurId_fkey" FOREIGN KEY ("editeurId") REFERENCES "public"."Editeur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

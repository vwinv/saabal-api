import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { apiSuccess } from '../common/api-response.js';
import { CloudinaryService } from '../cloudinary/cloudinary.service.js';

@Injectable()
export class PubliciteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async findAll() {
    const pubs = await this.prisma.publicite.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return apiSuccess(pubs, '');
  }

  async findActive() {
    const pubs = await this.prisma.publicite.findMany({
      where: { actif: true },
      orderBy: { createdAt: 'desc' },
    });
    return apiSuccess(pubs, '');
  }

  async create(input: { titre: string; description?: string }, file: { buffer: Buffer; mimetype: string }) {
    // Upload de l'image sur Cloudinary dans le dossier saabal/pubs
    const result = await this.cloudinary.uploadBuffer(file, 'saabal/pubs', 'image');

    const pub = await this.prisma.publicite.create({
      data: {
        titre: input.titre,
        description: input.description ?? null,
        imageUrl: result.secure_url,
        actif: true,
      },
    });
    return apiSuccess(pub, 'Publicité créée avec succès');
  }

  async delete(id: number) {
    await this.prisma.publicite.delete({ where: { id } });
    return apiSuccess(null, 'Publicité supprimée');
  }
}


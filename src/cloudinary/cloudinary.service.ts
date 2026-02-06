import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadBuffer(
    file: { buffer: Buffer; mimetype: string; originalname?: string },
    folder?: string,
  ): Promise<UploadApiResponse> {
    if (!file?.buffer) {
      throw new InternalServerErrorException('Fichier invalide pour l’upload Cloudinary');
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'auto',
          use_filename: true,
          unique_filename: true,
        },
        (error, result) => {
          if (error || !result) {
            return reject(
              new InternalServerErrorException('Erreur lors de l’upload vers Cloudinary'),
            );
          }
          resolve(result);
        },
      );

      uploadStream.end(file.buffer);
    });
  }

  async deleteByUrl(url: string): Promise<void> {
    if (!url) return;

    try {
      const parsed = new URL(url);
      const segments = parsed.pathname.split('/').filter(Boolean);
      const uploadIndex = segments.indexOf('upload');
      if (uploadIndex === -1 || uploadIndex + 2 > segments.length) {
        return;
      }

      // Exemple de chemin: /<cloud>/image/upload/v123/saabal/logos/filename.webp
      // segments après "upload": ["v123", "saabal", "logos", "filename.webp"]
      const publicParts = segments.slice(uploadIndex + 2);
      if (publicParts.length === 0) return;

      const withExt = publicParts.join('/');
      const publicId = withExt.replace(/\.[^/.]+$/, ''); // retirer l'extension

      if (!publicId) return;

      await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
    } catch (e) {
      // On ne bloque pas la suppression en cas d'erreur Cloudinary
      // eslint-disable-next-line no-console
      console.error('Erreur lors de la suppression Cloudinary pour', url, e);
    }
  }
}


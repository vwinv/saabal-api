import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AdminController } from './admin.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { UserModule } from './UserModule/user.module.js';
import { AuthModule } from './AuthModule/auth.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { JwtModule } from '@nestjs/jwt';
import { AbonnementModule } from './AbonnementModule/abonnement.module';
import { NewsletterModule } from './NewsletterModule/newsletter.module.js';
import { EditorModule } from './EditorModule/editor.module.js';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'public'),
    }),
    // Serve admin at /admin from public/admin
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'public', 'admin'),
      serveRoot: '/admin',
    }),
    AuthModule,
    UserModule,
    AbonnementModule,
    NewsletterModule,
    EditorModule,
    PrismaModule, // optionnel ici si utilisé ailleurs
    JwtModule.register({ secret: 'SECRET_KEY' }),
  ],
  controllers: [AppController, AdminController],
  providers: [AppService, PrismaService],
})


export class AppModule {}

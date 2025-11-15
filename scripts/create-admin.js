const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const email = process.env.ADMIN_EMAIL || 'admin@saabal.com';
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    const firstname = process.env.ADMIN_FIRSTNAME || 'Admin';
    const lastname = process.env.ADMIN_LASTNAME || 'Saabal';

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log(`❌ L'utilisateur avec l'email ${email} existe déjà.`);
      console.log(`   ID: ${existingUser.id}`);
      console.log(`   Rôle actuel: ${existingUser.role || 'aucun'}`);
      
      // Mettre à jour le rôle si ce n'est pas ADMIN
      if (existingUser.role !== 'ADMIN' && existingUser.role !== 'admin') {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { role: 'ADMIN' },
        });
        console.log(`✅ Rôle mis à jour vers ADMIN pour l'utilisateur ${email}`);
      }
      return;
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur ADMIN
    const admin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstname,
        lastname,
        role: 'ADMIN',
        activated: true,
      },
    });

    console.log('✅ Utilisateur ADMIN créé avec succès !');
    console.log(`   ID: ${admin.id}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Nom: ${admin.firstname} ${admin.lastname}`);
    console.log(`   Rôle: ${admin.role}`);
    console.log(`   Mot de passe: ${password} (changez-le après la première connexion)`);
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'utilisateur ADMIN:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();


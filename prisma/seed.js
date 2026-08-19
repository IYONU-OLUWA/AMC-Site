// Run with: npm run seed
// Creates the first admin account so you can log in and start approving alumni / editing content.
require('dotenv').config();
const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL || 'admin@ajoshemodelcollege.com';
  const password = process.env.SEED_ADMIN_PASSWORD || 'changeme123';

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin already exists for ${email} — skipping.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      fullName: 'AMC Admin',
      email,
      passwordHash,
      role: 'ADMIN',
      status: 'APPROVED',
    },
  });

  console.log('First admin account created:');
  console.log(`  Email:    ${email}`);
  console.log(`  Password: ${password}`);
  console.log('Log in at /login, then change this password by creating a new admin and demoting this one, or add a "change password" feature later.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

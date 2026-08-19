// Reuses one Prisma connection across the app instead of opening a new one per request.
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = prisma;

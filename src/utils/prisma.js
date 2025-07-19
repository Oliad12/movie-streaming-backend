const { PrismaClient } = require('@prisma/client');
const { PrismaClient } = require('./generated/prisma/edge')


const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

module.exports = prisma;

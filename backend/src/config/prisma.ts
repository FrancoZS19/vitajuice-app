import { PrismaClient } from '@prisma/client';

// Decisión técnica para el docente: Implementamos un patrón Singleton para el cliente de Prisma.
// Esto previene agotar el pool de conexiones en bases de datos PostgreSQL en la nube (Neon / Supabase)
// durante recargas en desarrollo o múltiples peticiones simultáneas.

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

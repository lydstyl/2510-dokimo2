import * as bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface Credentials {
  email: string;
  password: string;
}

export function getCredentials(): Credentials {
  const email = process.env.AUTH_EMAIL;
  const password = process.env.AUTH_PASSWORD;

  if (!email || !password) {
    throw new Error('AUTH_EMAIL and AUTH_PASSWORD must be set in environment variables');
  }

  return { email, password };
}

export async function validateCredentials(email: string, password: string): Promise<{ valid: boolean; userId?: string }> {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return { valid: false };
  }

  const valid = await bcrypt.compare(password, user.password);
  return { valid, userId: valid ? user.id : undefined };
}

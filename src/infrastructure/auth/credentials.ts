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

export async function validateCredentials(email: string, password: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return false;
  }

  return bcrypt.compare(password, user.password);
}

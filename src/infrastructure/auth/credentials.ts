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

export function validateCredentials(email: string, password: string): boolean {
  const validCredentials = getCredentials();
  return email === validCredentials.email && password === validCredentials.password;
}

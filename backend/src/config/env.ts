const INSECURE_JWT_SECRETS = new Set(['dev-secret', 'secret', 'changeme', '']);

export function validateEnvironment(): void {
  const errors: string[] = [];
  const jwtSecret = process.env.JWT_SECRET?.trim();

  if (!jwtSecret || INSECURE_JWT_SECRETS.has(jwtSecret)) {
    errors.push('JWT_SECRET must be set to a strong random value (min 32 chars). No fallback allowed.');
  } else if (jwtSecret.length < 32 && process.env.NODE_ENV === 'production') {
    errors.push('JWT_SECRET must be at least 32 characters in production.');
  }

  if (!process.env.MONGODB_URI?.trim()) {
    errors.push('MONGODB_URI is required.');
  }

  if (errors.length > 0) {
    console.error('Environment validation failed:\n', errors.map((e) => `  - ${e}`).join('\n'));
    process.exit(1);
  }
}

export function getJwtSecret(): string {
  return process.env.JWT_SECRET!.trim();
}

export function getJwtExpiresIn(): string {
  return process.env.JWT_EXPIRES_IN || '24h';
}

export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === 'true' || process.env.NODE_ENV !== 'production';
}

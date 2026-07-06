export interface AppEnvironment {
  PORT: number;
  FRONTEND_URL: string;
  CORS_ALLOWED_ORIGINS: string;
  DATABASE_URL?: string;
  DB_HOST: string;
  DB_PORT: number;
  DB_NAME: string;
  DB_USERNAME: string;
  DB_PASSWORD: string;
  DB_SSL: boolean;
  JWT_SECRET: string;
  NODE_ENV: 'development' | 'test' | 'production';
  TRUST_PROXY: boolean;
  THROTTLE_TTL: number;
  THROTTLE_LIMIT: number;
  AUTH_THROTTLE_TTL: number;
  AUTH_THROTTLE_LIMIT: number;
}

function ensureString(
  value: string | undefined,
  fallback: string,
  field: keyof AppEnvironment,
) {
  const finalValue = value?.trim() || fallback;
  if (!finalValue) {
    throw new Error(`Missing environment variable: ${field}`);
  }
  return finalValue;
}

function ensureOptionalString(value: string | undefined) {
  const finalValue = value?.trim();
  return finalValue ? finalValue : undefined;
}

function ensureNumber(
  value: string | undefined,
  fallback: number,
  field: keyof AppEnvironment,
) {
  const raw = value?.trim() ? Number(value) : fallback;
  if (Number.isNaN(raw) || raw <= 0) {
    throw new Error(`Invalid numeric environment variable: ${field}`);
  }
  return raw;
}

function ensureBoolean(value: string | undefined, fallback: boolean): boolean {
  if (!value?.trim()) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  if (['true', '1', 'yes', 'on'].includes(normalized)) {
    return true;
  }

  if (['false', '0', 'no', 'off'].includes(normalized)) {
    return false;
  }

  return fallback;
}

export function validateEnv(config: Record<string, unknown>): AppEnvironment {
  const nodeEnv =
    (config.NODE_ENV as AppEnvironment['NODE_ENV']) || 'development';

  return {
    PORT: ensureNumber(config.PORT as string | undefined, 3000, 'PORT'),
    FRONTEND_URL: ensureString(
      config.FRONTEND_URL as string | undefined,
      'http://localhost:8080',
      'FRONTEND_URL',
    ),
    CORS_ALLOWED_ORIGINS: ensureString(
      config.CORS_ALLOWED_ORIGINS as string | undefined,
      (config.FRONTEND_URL as string | undefined) || 'http://localhost:8080',
      'CORS_ALLOWED_ORIGINS',
    ),
    DATABASE_URL: ensureOptionalString(
      config.DATABASE_URL as string | undefined,
    ),
    DB_HOST: ensureString(
      config.DB_HOST as string | undefined,
      'localhost',
      'DB_HOST',
    ),
    DB_PORT: ensureNumber(
      config.DB_PORT as string | undefined,
      5432,
      'DB_PORT',
    ),
    DB_NAME: ensureString(
      config.DB_NAME as string | undefined,
      'eshop',
      'DB_NAME',
    ),
    DB_USERNAME: ensureString(
      config.DB_USERNAME as string | undefined,
      'postgres',
      'DB_USERNAME',
    ),
    DB_PASSWORD: (config.DB_PASSWORD as string | undefined) ?? '',
    DB_SSL: ensureBoolean(config.DB_SSL as string | undefined, false),
    JWT_SECRET: ensureString(
      config.JWT_SECRET as string | undefined,
      'change_this_secret',
      'JWT_SECRET',
    ),
    NODE_ENV: ['development', 'test', 'production'].includes(nodeEnv)
      ? nodeEnv
      : 'development',
    TRUST_PROXY: ensureBoolean(
      config.TRUST_PROXY as string | undefined,
      nodeEnv === 'production',
    ),
    THROTTLE_TTL: ensureNumber(
      config.THROTTLE_TTL as string | undefined,
      60,
      'THROTTLE_TTL',
    ),
    THROTTLE_LIMIT: ensureNumber(
      config.THROTTLE_LIMIT as string | undefined,
      120,
      'THROTTLE_LIMIT',
    ),
    AUTH_THROTTLE_TTL: ensureNumber(
      config.AUTH_THROTTLE_TTL as string | undefined,
      60,
      'AUTH_THROTTLE_TTL',
    ),
    AUTH_THROTTLE_LIMIT: ensureNumber(
      config.AUTH_THROTTLE_LIMIT as string | undefined,
      10,
      'AUTH_THROTTLE_LIMIT',
    ),
  };
}

const asNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const config = {
  port: asNumber(process.env.PORT, 4000),
  nodeEnv: process.env.NODE_ENV || 'development',
  appVersion: process.env.APP_VERSION || process.env.GITHUB_SHA || 'dev',
  logLevel: process.env.LOG_LEVEL || 'info',
  databaseUrl: process.env.DATABASE_URL || '',
  authSecret: process.env.AUTH_SECRET || 'dev-only-change-me',
  bootstrapAdminKey: process.env.BOOTSTRAP_ADMIN_KEY || '',
  accessTokenTtlSec: asNumber(process.env.ACCESS_TOKEN_TTL_SEC, 60 * 15),
  refreshTokenTtlSec: asNumber(process.env.REFRESH_TOKEN_TTL_SEC, 60 * 60 * 24 * 30)
};

export interface AppConfig {
  nodeEnv: string;
  port: number;
  globalPrefix: string;
  corsAllowedOrigins: string[];
  database: { url: string };
  redis: { host: string; port: number; password?: string };
  jwt: {
    accessSecret: string;
    accessTtl: string;
    refreshSecret: string;
    refreshTtl: string;
  };
}

/** ConfigModule.forRoot({ load: [configuration] }) — единая точка чтения env. */
export default (): AppConfig => ({
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 3000),
  globalPrefix: process.env.API_GLOBAL_PREFIX ?? "api/v1",
  corsAllowedOrigins: (process.env.CORS_ALLOWED_ORIGINS ?? "").split(",").filter(Boolean),
  database: {
    url: process.env.DATABASE_URL ?? "",
  },
  redis: {
    host: process.env.REDIS_HOST ?? "localhost",
    port: Number(process.env.REDIS_PORT ?? 6379),
    password: process.env.REDIS_PASSWORD || undefined,
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? "",
    accessTtl: process.env.JWT_ACCESS_TTL ?? "15m",
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? "",
    refreshTtl: process.env.JWT_REFRESH_TTL ?? "30d",
  },
});

import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { join } from "path";

const isProd = process.env.NODE_ENV === "production";
const rawDatabaseUrl = process.env.DATABASE_URL || "";
// Sanitize DATABASE_URL: trim, strip surrounding quotes, normalize scheme
const sanitizedDatabaseUrl = rawDatabaseUrl
  .trim()
  .replace(/^['"]|['"]$/g, "")
  .replace(/^postgresql:\/\//i, "postgres://");
const hasDatabaseUrl = sanitizedDatabaseUrl.length > 0;
const syncOverride =
  String(process.env.DB_SYNCHRONIZE || "").toLowerCase() === "true";

// Ensure TypeORM only loads compiled JS in production builds to avoid requiring TS files at runtime
const entityPattern = __filename.endsWith(".ts")
  ? join(__dirname, "/../**/*.entity.ts")
  : join(__dirname, "/../**/*.entity.js");

export const databaseConfig: TypeOrmModuleOptions = hasDatabaseUrl
  ? {
      type: "postgres",
      url: sanitizedDatabaseUrl as string,
      entities: [entityPattern],
      synchronize: syncOverride ? true : !isProd,
      logging: !isProd ? process.env.NODE_ENV === "development" : false,
      ssl: isProd ? { rejectUnauthorized: false } : false,
      extra: isProd
        ? {
            // Some providers require ssl in extra for pg driver
            ssl: { rejectUnauthorized: false },
            max: parseInt(process.env.DB_MAX_CONNECTIONS || "20"),
            connectionTimeoutMillis: parseInt(
              process.env.DB_CONNECTION_TIMEOUT || "60000"
            ),
          }
        : {
            max: parseInt(process.env.DB_MAX_CONNECTIONS || "20"),
            connectionTimeoutMillis: parseInt(
              process.env.DB_CONNECTION_TIMEOUT || "60000"
            ),
          },
    }
  : {
      type: "postgres",
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "5432"),
      username: process.env.DB_USERNAME || "postgres",
      password: process.env.DB_PASSWORD || "password",
      database: process.env.DB_DATABASE || "user_registration",
      entities: [entityPattern],
      synchronize: syncOverride ? true : !isProd, // Auto-create tables in development (can be overridden)
      logging: process.env.NODE_ENV === "development",
      ssl: isProd ? { rejectUnauthorized: false } : false,
      // Connection pool configuration
      extra: {
        max: parseInt(process.env.DB_MAX_CONNECTIONS || "20"),
        connectionTimeoutMillis: parseInt(
          process.env.DB_CONNECTION_TIMEOUT || "60000"
        ),
      },
    };

// Optional safe startup log to help diagnose connection issues
try {
  const shouldLog =
    !isProd || String(process.env.LOG_DB_CONFIG || "").toLowerCase() === "true";
  if (shouldLog) {
    const summary = hasDatabaseUrl
      ? {
          using: "DATABASE_URL",
          urlHost: (() => {
            try {
              const u = new URL(sanitizedDatabaseUrl as string);
              return `${u.protocol}//${u.hostname}:${u.port}${u.pathname}`;
            } catch {
              return "<invalid URL>";
            }
          })(),
          ssl: isProd ? true : false,
          synchronize: (databaseConfig as any).synchronize,
        }
      : {
          using: "DISCRETE_ENV",
          host: process.env.DB_HOST || "localhost",
          port: process.env.DB_PORT || "5432",
          db: process.env.DB_DATABASE || "user_registration",
          ssl: isProd ? true : false,
          synchronize: (databaseConfig as any).synchronize,
        };
    // eslint-disable-next-line no-console
    console.log("[DB CONFIG]", summary);
  }
} catch {
  // ignore logging issues
}

export const testDatabaseConfig: TypeOrmModuleOptions = {
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USERNAME || "postgres",
  password: process.env.DB_PASSWORD || "password",
  database: process.env.DB_DATABASE || "user_registration_test",
  entities: [
    __filename.endsWith(".ts") ? "src/**/*.entity.ts" : "dist/**/*.entity.js",
  ],
  synchronize: true, // Always sync for tests
  logging: false, // Disable logging for tests
  dropSchema: true, // Drop schema between tests
  // Connection pool configuration for tests
  extra: {
    max: 5, // Smaller pool for tests
    connectionTimeoutMillis: 30000,
  },
};

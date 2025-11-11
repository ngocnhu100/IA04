import "reflect-metadata";
import "dotenv/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

let cachedApp: any;

async function bootstrap() {
  if (cachedApp) {
    return cachedApp;
  }

  const app = await NestFactory.create(AppModule);

  // Robust CORS: allow one or more comma-separated origins and normalize trailing slashes
  const originsEnv =
    process.env.FRONTEND_URLS ||
    process.env.FRONTEND_URL ||
    "http://localhost:5173";
  const allowedOrigins = originsEnv
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean)
    .map((o) => o.replace(/\/$/, ""));

  app.enableCors({
    origin: (origin, callback) => {
      // Allow server-to-server or tools with no Origin header
      if (!origin) return callback(null, true);
      const normalized = origin.replace(/\/$/, "");
      if (allowedOrigins.includes(normalized)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  await app.init();

  // Cache the app for serverless reuse
  cachedApp = app.getHttpAdapter().getInstance();

  // For local development only
  if (!process.env.VERCEL) {
    const port = process.env.PORT ? Number(process.env.PORT) : 3000;
    app.listen(port);
    console.log(`Server listening on http://localhost:${port}`);
  }

  return cachedApp;
}

// Export for Vercel serverless functions
export default async (req: any, res: any) => {
  const app = await bootstrap();
  return app(req, res);
};

// For local development
if (!process.env.VERCEL) {
  bootstrap();
}

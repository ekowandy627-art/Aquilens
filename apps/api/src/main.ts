import "reflect-metadata";
import "dotenv/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { hasSupabaseAdminEnv } from "./supabase/admin-client";

async function bootstrap() {
  if (process.env.NODE_ENV === "production" && !hasSupabaseAdminEnv()) {
    throw new Error(
      "Supabase admin environment variables are required in production (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).",
    );
  }
  const app = await NestFactory.create(AppModule);
  const allowedOrigins = (
    process.env.CORS_ORIGINS ??
    "http://localhost:3000,http://127.0.0.1:3000,http://127.0.0.1:3010,http://localhost:3010"
  )
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin(
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        origin.endsWith(".vercel.app")
      ) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} is not allowed by CORS.`), false);
    },
  });

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
}

void bootstrap();

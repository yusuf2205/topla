import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import { AppModule } from "./app.module";
import type { AppConfig } from "./config/configuration";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService<AppConfig, true>);

  app.use(helmet());
  app.enableCors({
    origin: config.get("corsAllowedOrigins", { infer: true }),
    credentials: true,
  });

  // GET /health намеренно вне /api/v1 — используется оркестратором как liveness probe.
  app.setGlobalPrefix(config.get("globalPrefix", { infer: true }), {
    exclude: ["health"],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle("TOPLA API")
    .setDescription("Marketplace platform REST API")
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${config.get("globalPrefix", { infer: true })}/docs`, app, document);

  const port = config.get("port", { infer: true });
  await app.listen(port);
}

void bootstrap();

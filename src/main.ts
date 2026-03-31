import 'dotenv/config';
import "./instrument";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

async function start() {
  const app = await NestFactory.create(AppModule);

  // Enable global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true }
    })
  );

  // Configure Swagger
  const config = new DocumentBuilder()
    .setTitle('Task Management API')
    .setDescription('A comprehensive task management system with user authentication')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('tasks', 'Task management endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const PORT = process.env.PORT ?? 3000;
  await app.listen(PORT);

  console.log(` Server is running on http://localhost:${PORT}`);
  console.log(` API Documentation: http://localhost:${PORT}/api/docs`);
}
start().catch((err) => {
  console.error("Error starting application:", err);
  process.exit(1);
});

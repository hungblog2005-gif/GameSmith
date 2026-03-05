import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { NestExpressApplication } from '@nestjs/platform-express'
import * as express from 'express'
import { join } from 'path'
import { AppModule } from './app.module'
import mongoose from 'mongoose'
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)

  // Increase body size limit to handle base64-encoded images (~2 MB)
  app.use(express.json({ limit: '2mb' }))
  app.use(express.urlencoded({ extended: true, limit: '2mb' }))

  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads',
  })

  app.enableCors({
    origin: true,
    credentials: true,
  })

  // Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  app.useGlobalFilters(new HttpExceptionFilter());
  // MongoDB events (OK để ở đây)
  mongoose.connection.on('connected', () => {
    console.log('✅ MongoDB connected')
  })

  mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB connection error:', err)
  })

  await app.listen(3000)
  console.log('🚀 Server running at http://localhost:3000')
}
bootstrap()

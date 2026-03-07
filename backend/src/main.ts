import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { NestExpressApplication } from '@nestjs/platform-express'
import * as express from 'express'
import { join, basename } from 'path'
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
    setHeaders: (res, filePath) => {
      // Force download (không hiển thị inline) cho tất cả file bắt đầu bằng "asset-"
      if (basename(filePath).startsWith('asset-')) {
        res.setHeader('Content-Disposition', 'attachment')
        res.setHeader('Access-Control-Allow-Origin', '*')
      }
    },
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

  // Remove any stale MongoDB collection-level JSON Schema validators that conflict
  // with the current Mongoose schema (these can be set via Atlas UI or old migrations)
  const db = mongoose.connection.db
  if (db) {
    for (const col of ['orders', 'payments']) {
      try {
        await db.command({ collMod: col, validator: {}, validationLevel: 'off' })
        console.log(`✅ Cleared stale validator on '${col}' collection`)
      } catch (e: any) {
        console.warn(`⚠️ Could not clear validator on '${col}': ${e?.message}`)
      }
    }
  }

  console.log('🚀 Server running at http://localhost:3000')
}
bootstrap()

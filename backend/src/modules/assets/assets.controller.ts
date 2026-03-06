import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { AssetsService } from './assets.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { SuggestTagsDto } from './dto/suggest-tags.dto';
import { GenerateSeoDto } from './dto/generate-seo.dto';

// Ensure upload directories exist
const uploadsDir = join(process.cwd(), 'uploads', 'assets');
if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });

const thumbnailStorage = diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `thumb-${uniqueSuffix}${extname(file.originalname)}`);
  },
});

@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Post()
  async create(@Body() dto: CreateAssetDto) {
    try {
      if (!dto.categoryId) {
        throw new BadRequestException('categoryId is required');
      }
      if (!dto.creatorId) {
        throw new BadRequestException('creatorId is required');
      }
      return await this.assetsService.create(dto);
    } catch (error: any) {
      console.error('Create asset error:', error);
      if (error.name === 'ValidationError') {
        throw new BadRequestException(error.message);
      }
      if (error.name === 'CastError') {
        throw new BadRequestException('Invalid categoryId or creatorId format');
      }
      if (error.name === 'MongoServerError' && error.code === 121) {
        throw new BadRequestException('Asset data failed database validation');
      }
      throw error;
    }
  }

  @Post('upload-thumbnail')
  @UseInterceptors(FileInterceptor('file', {
    storage: thumbnailStorage,
    fileFilter: (_req, file, cb) => {
      if (!file.mimetype.match(/image\/(jpeg|png|gif|webp)/)) {
        return cb(new BadRequestException('Only image files are allowed'), false);
      }
      cb(null, true);
    },
    limits: { fileSize: 5 * 1024 * 1024 },
  }))
  uploadThumbnail(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    return { url: `/uploads/assets/${file.filename}` };
  }

  @Post('upload-preview-images')
  @UseInterceptors(FilesInterceptor('files', 10, {
    storage: thumbnailStorage,
    fileFilter: (_req, file, cb) => {
      if (!file.mimetype.match(/image\/(jpeg|png|gif|webp)/)) {
        return cb(new BadRequestException('Only image files are allowed'), false);
      }
      cb(null, true);
    },
    limits: { fileSize: 5 * 1024 * 1024 },
  }))
  uploadPreviewImages(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) throw new BadRequestException('No files uploaded');
    const urls = files.map(file => `/uploads/assets/${file.filename}`);
    return { urls };
  }

  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.assetsService.findAll({ status, search });
  }

  @Get('tags')
  getTagVocabulary() {
    return this.assetsService.getTagVocabulary();
  }

  @Post('suggest-tags')
  suggestTags(@Body() dto: SuggestTagsDto) {
    return this.assetsService.suggestTags(dto);
  }

  @Get('count-by-category')
  countByCategory() {
    return this.assetsService.countByCategory();
  }

  @Get('featured')
  findFeatured(@Query('limit') limit?: string) {
    return this.assetsService.findFeatured(limit ? parseInt(limit) : 6);
  }

  @Get('creator/:creatorId')
  findByCreator(@Param('creatorId') creatorId: string) {
    return this.assetsService.findByCreator(creatorId);
  }

  @Get('category/:categoryId')
  findByCategory(@Param('categoryId') categoryId: string) {
    return this.assetsService.findByCategory(categoryId);
  }

  @Get(':id/seo')
  getSeo(@Param('id') id: string) {
    return this.assetsService.getSeoByAssetId(id);
  }

  @Post(':id/generate-seo')
  generateSeo(@Param('id') id: string, @Body() dto: GenerateSeoDto) {
    return this.assetsService.generateAndSaveSeo(id, dto);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.assetsService.findById(id);
  }

  @Post(':id/view')
  incrementViews(@Param('id') id: string) {
    return this.assetsService.incrementViews(id);
  }

  @Get(':id/related')
  findRelated(@Param('id') id: string, @Query('limit') limit?: string) {
    return this.assetsService.findRelated(id, limit ? parseInt(limit) : 6);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateAssetDto> & { creatorId: string },
  ) {
    if (!dto.creatorId) throw new BadRequestException('creatorId is required');
    const result = await this.assetsService.update(id, dto.creatorId, dto);
    if (!result) throw new NotFoundException('Asset not found or not owned by you');
    return result;
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Query('creatorId') creatorId: string,
  ) {
    if (!creatorId) throw new BadRequestException('creatorId is required');
    const result = await this.assetsService.remove(id, creatorId);
    if (!result) throw new NotFoundException('Asset not found or not owned by you');
    return { deleted: true };
  }
}

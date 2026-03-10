import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  DefaultValuePipe,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';

import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateCategoryDto } from '../categories/dto/create-category.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ── Dashboard Stats (admin + moderator) ───────────────────────────────

  @Get('stats')
  @Roles('admin', 'moderator')
  getStats() {
    return this.adminService.getDashboardStats();
  }

  // ── Users (admin only) ────────────────────────────────────────────────

  @Get('users')
  @Roles('admin')
  getUsers(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.getUsers(page, limit, search, role, status);
  }

  @Get('users/:id')
  @Roles('admin')
  getUserById(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  @Patch('users/:id/role')
  @Roles('admin')
  updateUserRole(
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
    @Req() req: Request,
  ) {
    const requesterId = (req as any).user?.sub;
    return this.adminService.updateUserRole(id, dto, requesterId);
  }

  @Patch('users/:id/status')
  @Roles('admin')
  updateUserStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
    @Req() req: Request,
  ) {
    const requesterId = (req as any).user?.sub;
    return this.adminService.updateUserStatus(id, dto, requesterId);
  }

  @Delete('users/:id')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  deleteUser(@Param('id') id: string, @Req() req: Request) {
    const requesterId = (req as any).user?.sub;
    return this.adminService.deleteUser(id, requesterId);
  }

  // ── Assets (admin + moderator) ────────────────────────────────────────

  @Get('assets')
  @Roles('admin', 'moderator')
  getAssets(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getAssets(page, limit, status, search);
  }

  @Patch('assets/:id/status')
  @Roles('admin', 'moderator')
  updateAssetStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.adminService.updateAssetStatus(id, status);
  }

  @Delete('assets/:id')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  deleteAsset(@Param('id') id: string) {
    return this.adminService.deleteAsset(id);
  }

  // ── Orders (read-only, admin + moderator) ─────────────────────────────

  @Get('orders')
  @Roles('admin', 'moderator')
  getOrders(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getOrders(page, limit, status, search);
  }

  // ── Categories (admin only) ───────────────────────────────────────────

  @Get('categories')
  @Roles('admin')
  getCategories() {
    return this.adminService.getCategories();
  }

  @Post('categories')
  @Roles('admin')
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.adminService.createCategory(dto);
  }

  @Patch('categories/:id')
  @Roles('admin')
  updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.adminService.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  deleteCategory(@Param('id') id: string) {
    return this.adminService.deleteCategory(id);
  }
}

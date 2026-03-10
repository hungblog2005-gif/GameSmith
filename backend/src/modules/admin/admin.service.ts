import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { User, UserDocument } from '../users/schemas/users.schema';
import { Asset, AssetDocument } from '../assets/schemas/asset.schema';
import { Order, OrderDocument } from '../orders/schemas/order.schema';
import {
  Transaction,
  TransactionDocument,
} from '../transactions/schemas/transaction.schema';
import {
  Category,
  CategoryDocument,
} from '../categories/schemas/category.schema';

import { UpdateRoleDto } from './dto/update-role.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateCategoryDto } from '../categories/dto/create-category.dto';

const PAGE_SIZE = 20;

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Asset.name) private readonly assetModel: Model<AssetDocument>,
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Transaction.name)
    private readonly txModel: Model<TransactionDocument>,
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
  ) {}

  // ── Dashboard Stats ───────────────────────────────────────────────────

  async getDashboardStats() {
    const [
      totalUsers,
      usersByRole,
      totalAssets,
      assetsByStatus,
      totalOrders,
      ordersByStatus,
      revenueResult,
      totalTransactions,
    ] = await Promise.all([
      this.userModel.countDocuments(),
      this.userModel.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } },
      ]),
      this.assetModel.countDocuments(),
      this.assetModel.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      this.orderModel.countDocuments(),
      this.orderModel.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      this.orderModel.aggregate([
        { $match: { status: 'completed', paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      this.txModel.countDocuments(),
    ]);

    const roleMap: Record<string, number> = {};
    usersByRole.forEach((r) => {
      roleMap[r._id] = r.count;
    });

    const assetStatusMap: Record<string, number> = {};
    assetsByStatus.forEach((r) => {
      assetStatusMap[r._id] = r.count;
    });

    const orderStatusMap: Record<string, number> = {};
    ordersByStatus.forEach((r) => {
      orderStatusMap[r._id] = r.count;
    });

    return {
      users: { total: totalUsers, byRole: roleMap },
      assets: { total: totalAssets, byStatus: assetStatusMap },
      orders: {
        total: totalOrders,
        byStatus: orderStatusMap,
        revenue: revenueResult[0]?.total ?? 0,
      },
      transactions: { total: totalTransactions },
    };
  }

  // ── Users ─────────────────────────────────────────────────────────────

  async getUsers(
    page = 1,
    limit = PAGE_SIZE,
    search?: string,
    role?: string,
    status?: string,
  ) {
    const query: Record<string, any> = {};
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { username: { $regex: escaped, $options: 'i' } },
        { email: { $regex: escaped, $options: 'i' } },
      ];
    }
    if (role) query.role = role;
    if (status) query.status = status;

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.userModel
        .find(query)
        .select('-password_hash -refresh_token_hash')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.userModel.countDocuments(query),
    ]);

    return { data, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async getUserById(id: string) {
    const user = await this.userModel
      .findById(id)
      .select('-password_hash -refresh_token_hash')
      .lean()
      .exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateUserRole(id: string, dto: UpdateRoleDto, requesterId: string) {
    if (id === requesterId) {
      throw new ForbiddenException('Cannot change your own role');
    }
    const target = await this.userModel.findById(id).exec();
    if (!target) throw new NotFoundException('User not found');
    if (target.role === 'admin') {
      throw new ForbiddenException('Cannot change the role of another admin');
    }
    return this.userModel
      .findByIdAndUpdate(id, { role: dto.role }, { new: true })
      .select('-password_hash -refresh_token_hash')
      .exec();
  }

  async updateUserStatus(
    id: string,
    dto: UpdateStatusDto,
    requesterId: string,
  ) {
    if (id === requesterId) {
      throw new ForbiddenException('Cannot change your own status');
    }
    const target = await this.userModel.findById(id).exec();
    if (!target) throw new NotFoundException('User not found');
    if (target.role === 'admin') {
      throw new ForbiddenException('Cannot change status of an admin account');
    }
    return this.userModel
      .findByIdAndUpdate(id, { status: dto.status }, { new: true })
      .select('-password_hash -refresh_token_hash')
      .exec();
  }

  async deleteUser(id: string, requesterId: string) {
    if (id === requesterId) {
      throw new ForbiddenException('Cannot delete your own account');
    }
    const target = await this.userModel.findById(id).exec();
    if (!target) throw new NotFoundException('User not found');
    if (target.role === 'admin') {
      throw new ForbiddenException('Cannot delete an admin account');
    }
    await this.userModel.findByIdAndDelete(id).exec();
    return { message: 'User deleted successfully' };
  }

  // ── Assets ────────────────────────────────────────────────────────────

  async getAssets(
    page = 1,
    limit = PAGE_SIZE,
    status?: string,
    search?: string,
  ) {
    const query: Record<string, any> = {};
    if (status) query.status = status;
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { title: { $regex: escaped, $options: 'i' } },
        { slug: { $regex: escaped, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.assetModel
        .find(query)
        .populate('creatorId', 'username email avatar_url')
        .populate('categoryId', 'name slug')
        .select('-fileKey -assetFiles')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.assetModel.countDocuments(query),
    ]);

    return { data, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async updateAssetStatus(id: string, status: string) {
    const valid = ['draft', 'pending', 'published', 'hidden', 'archived'];
    if (!valid.includes(status)) {
      throw new BadRequestException(
        `Invalid status. Must be one of: ${valid.join(', ')}`,
      );
    }
    const updated = await this.assetModel
      .findByIdAndUpdate(id, { status }, { new: true })
      .select('-fileKey -assetFiles')
      .exec();
    if (!updated) throw new NotFoundException('Asset not found');
    return updated;
  }

  async deleteAsset(id: string) {
    const target = await this.assetModel.findById(id).exec();
    if (!target) throw new NotFoundException('Asset not found');
    await this.assetModel.findByIdAndDelete(id).exec();
    return { message: 'Asset deleted successfully' };
  }

  // ── Orders ────────────────────────────────────────────────────────────

  async getOrders(
    page = 1,
    limit = PAGE_SIZE,
    status?: string,
    search?: string,
  ) {
    const query: Record<string, any> = {};
    if (status) query.status = status;
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.orderNumber = { $regex: escaped, $options: 'i' };
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.orderModel
        .find(query)
        .populate('userId', 'username email avatar_url')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.orderModel.countDocuments(query),
    ]);

    return { data, total, page, limit, pages: Math.ceil(total / limit) };
  }

  // ── Categories ────────────────────────────────────────────────────────

  async getCategories() {
    const [categories, assetCounts] = await Promise.all([
      this.categoryModel.find().sort({ order: 1 }).lean().exec(),
      this.assetModel.aggregate([
        { $group: { _id: '$categoryId', count: { $sum: 1 } } },
      ]),
    ]);

    const countMap: Record<string, number> = {};
    assetCounts.forEach((r) => {
      countMap[r._id?.toString()] = r.count;
    });

    return (categories as any[]).map((c) => ({
      ...c,
      assetCount: countMap[c._id?.toString()] ?? 0,
    }));
  }

  async createCategory(dto: CreateCategoryDto) {
    const slug = (dto as any).name
      ? (dto as any).name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
      : '';
    return this.categoryModel.create({ ...dto, slug });
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    const update: Record<string, any> = { ...dto };
    if (dto.name) {
      update.slug = dto.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    }
    const updated = await this.categoryModel
      .findByIdAndUpdate(id, update, { new: true })
      .exec();
    if (!updated) throw new NotFoundException('Category not found');
    return updated;
  }

  async deleteCategory(id: string) {
    const assetCount = await this.assetModel.countDocuments({
      categoryId: new Types.ObjectId(id),
    });
    if (assetCount > 0) {
      throw new BadRequestException(
        `Cannot delete category with ${assetCount} existing asset(s). Move or delete the assets first.`,
      );
    }
    const target = await this.categoryModel.findById(id).exec();
    if (!target) throw new NotFoundException('Category not found');
    await this.categoryModel.findByIdAndDelete(id).exec();
    return { message: 'Category deleted successfully' };
  }
}

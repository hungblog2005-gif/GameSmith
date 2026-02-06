import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Asset, AssetDocument } from './schemas/asset.schema';
import { CreateAssetDto } from './dto/create-asset.dto';

@Injectable()
export class AssetsService {
  constructor(
    @InjectModel(Asset.name)
    private readonly assetModel: Model<AssetDocument>,
  ) {}

  create(dto: CreateAssetDto) {
    return this.assetModel.create({
      title: dto.title,
      description: dto.description,
      price: dto.price,
      category: new Types.ObjectId(dto.categoryId),
      creator: new Types.ObjectId(dto.creatorId),
    });
  }

  findAll() {
    return this.assetModel
      .find()
      .populate('category creator')
      .exec();
  }

  findById(id: string) {
    return this.assetModel
      .findById(id)
      .populate('category creator')
      .exec();
  }
}

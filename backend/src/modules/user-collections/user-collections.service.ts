import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  UserCollection,
  UserCollectionDocument,
} from './schemas/user-collection.schema';
import { CreateUserCollectionDto } from './dto/create-user-collection.dto';

@Injectable()
export class UserCollectionsService {
  constructor(
    @InjectModel(UserCollection.name)
    private readonly userCollectionModel: Model<UserCollectionDocument>,
  ) {}

  async add(dto: CreateUserCollectionDto) {
    const doc = {
      user: new Types.ObjectId(dto.userId),
      asset: new Types.ObjectId(dto.assetId),
      collectionType: dto.collectionType,
    };

    return this.userCollectionModel.create(doc);
  }

  findByUser(userId: string) {
    return this.userCollectionModel
      .find({ user: new Types.ObjectId(userId) })
      .exec();
  }
}

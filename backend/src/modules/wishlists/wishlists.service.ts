import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Wishlist, WishlistDocument } from './schemas/wishlist.schema';

@Injectable()
export class WishlistsService {
  constructor(
    @InjectModel(Wishlist.name)
    private readonly wishlistModel: Model<WishlistDocument>,
  ) {}

  add(data: Partial<Wishlist>) {
    return this.wishlistModel.create(data);
  }

  findByUser(userId: string) {
    return this.wishlistModel.find({ user: userId }).populate('asset').exec();
  }
}

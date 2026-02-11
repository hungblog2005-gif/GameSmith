import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Wishlist, WishlistDocument } from './schemas/wishlist.schema';

@Injectable()
export class WishlistsService {
  constructor(
    @InjectModel(Wishlist.name)
    private readonly wishlistModel: Model<WishlistDocument>,
  ) {}

  /** Get or create the user's wishlist document using upsert */
  private async ensureWishlist(userId: string): Promise<WishlistDocument> {
    return this.wishlistModel.findOneAndUpdate(
      { user: new Types.ObjectId(userId) },
      { $setOnInsert: { user: new Types.ObjectId(userId), assets: [] } },
      { upsert: true, new: true },
    );
  }

  /** Get all wishlist items for a user, populated with asset + category */
  async findByUser(userId: string) {
    const wishlist = await this.wishlistModel
      .findOne({ user: new Types.ObjectId(userId) })
      .populate({
        path: 'assets',
        populate: { path: 'category', select: 'name' },
      })
      .exec();
    if (!wishlist) return [];
    // Filter out null entries (deleted assets)
    return (wishlist.assets || []).filter((a) => a != null);
  }

  /** Toggle an asset in the wishlist. Returns { added: boolean } */
  async toggle(userId: string, assetId: string) {
    const userOid = new Types.ObjectId(userId);
    const assetOid = new Types.ObjectId(assetId);

    // Check if asset already in wishlist
    const existing = await this.wishlistModel.findOne({
      user: userOid,
      assets: assetOid,
    });

    if (existing) {
      // Remove it
      await this.wishlistModel.updateOne(
        { user: userOid },
        { $pull: { assets: assetOid } },
      );
      return { added: false };
    } else {
      // Add it (upsert ensures document exists)
      await this.wishlistModel.findOneAndUpdate(
        { user: userOid },
        { $addToSet: { assets: assetOid } },
        { upsert: true, new: true },
      );
      return { added: true };
    }
  }

  /** Remove a specific asset from the wishlist */
  async removeAsset(userId: string, assetId: string) {
    await this.wishlistModel.updateOne(
      { user: new Types.ObjectId(userId) },
      { $pull: { assets: new Types.ObjectId(assetId) } },
    );
    return { removed: true };
  }

  /** Check if an asset is in user's wishlist */
  async isInWishlist(userId: string, assetId: string): Promise<boolean> {
    const wishlist = await this.wishlistModel.findOne({
      user: new Types.ObjectId(userId),
      assets: new Types.ObjectId(assetId),
    });
    return !!wishlist;
  }
}

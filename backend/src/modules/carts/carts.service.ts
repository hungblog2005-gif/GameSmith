import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cart, CartDocument } from './schemas/cart.schema';

@Injectable()
export class CartsService {
  private readonly logger = new Logger(CartsService.name);

  constructor(
    @InjectModel(Cart.name)
    private readonly cartModel: Model<CartDocument>,
  ) {}

  private isValidObjectId(id: string): boolean {
    return Types.ObjectId.isValid(id);
  }

  /** Get cart for a user (with asset info populated) */
  async getCart(userId: string) {
    if (!this.isValidObjectId(userId))
      throw new BadRequestException('Invalid user ID');
    const cart = await this.cartModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .populate('items.assetId')
      .exec();
    return cart ?? { userId, items: [] };
  }

  /** Add or increment an item in the cart */
  async addItem(
    userId: string,
    assetId: string,
    quantity = 1,
    options: Record<string, any> = {},
  ) {
    if (!this.isValidObjectId(userId))
      throw new BadRequestException('Invalid user ID');
    if (!this.isValidObjectId(assetId))
      throw new BadRequestException('Invalid asset ID');

    const userOid = new Types.ObjectId(userId);
    const assetOid = new Types.ObjectId(assetId);

    // Try to find a matching item (same assetId + same options)
    const cart = await this.cartModel.findOne({ userId: userOid });

    if (!cart) {
      await this.cartModel.create({
        userId: userOid,
        items: [{ assetId: assetOid, quantity, options }],
      });
      return this.cartModel
        .findOne({ userId: userOid })
        .populate('items.assetId')
        .exec();
    }

    const existingIdx = cart.items.findIndex(
      (item: any) =>
        item.assetId.toString() === assetId &&
        JSON.stringify(item.options ?? {}) === JSON.stringify(options),
    );

    if (existingIdx >= 0) {
      cart.items[existingIdx].quantity += quantity;
    } else {
      cart.items.push({ assetId: assetOid, quantity, options } as any);
    }

    await cart.save();
    return this.cartModel
      .findOne({ userId: userOid })
      .populate('items.assetId')
      .exec();
  }

  /** Update quantity/options for a specific item */
  async updateItem(
    userId: string,
    assetId: string,
    quantity: number,
    options?: Record<string, any>,
  ) {
    if (!this.isValidObjectId(userId))
      throw new BadRequestException('Invalid user ID');
    if (!this.isValidObjectId(assetId))
      throw new BadRequestException('Invalid asset ID');

    const userOid = new Types.ObjectId(userId);
    const cart = await this.cartModel.findOne({ userId: userOid });
    if (!cart) throw new BadRequestException('Cart not found');

    const itemIdx = cart.items.findIndex(
      (item: any) => item.assetId.toString() === assetId,
    );
    if (itemIdx < 0) throw new BadRequestException('Item not in cart');

    if (quantity <= 0) {
      cart.items.splice(itemIdx, 1);
    } else {
      cart.items[itemIdx].quantity = quantity;
      if (options !== undefined) cart.items[itemIdx].options = options;
    }

    await cart.save();
    return this.cartModel
      .findOne({ userId: userOid })
      .populate('items.assetId')
      .exec();
  }

  /** Remove a specific item */
  async removeItem(userId: string, assetId: string) {
    if (!this.isValidObjectId(userId))
      throw new BadRequestException('Invalid user ID');
    if (!this.isValidObjectId(assetId))
      throw new BadRequestException('Invalid asset ID');

    const userOid = new Types.ObjectId(userId);
    const cart = await this.cartModel.findOne({ userId: userOid });
    if (!cart) return { items: [] };

    cart.items = cart.items.filter(
      (item: any) => item.assetId.toString() !== assetId,
    ) as any;
    await cart.save();
    return this.cartModel
      .findOne({ userId: userOid })
      .populate('items.assetId')
      .exec();
  }

  /** Clear all items */
  async clearCart(userId: string) {
    if (!this.isValidObjectId(userId))
      throw new BadRequestException('Invalid user ID');
    const userOid = new Types.ObjectId(userId);
    await this.cartModel.findOneAndUpdate(
      { userId: userOid },
      { items: [] },
      { upsert: true },
    );
    return { cleared: true };
  }

  /**
   * Merge guest cart items into the user's server cart.
   * guestItems = [{ id: assetId, quantity, options }]
   */
  async mergeGuestCart(
    userId: string,
    guestItems: Array<{
      id: string;
      quantity?: number;
      options?: Record<string, any>;
    }>,
  ) {
    if (!this.isValidObjectId(userId))
      throw new BadRequestException('Invalid user ID');
    for (const item of guestItems) {
      if (!this.isValidObjectId(item.id)) continue;
      await this.addItem(
        userId,
        item.id,
        item.quantity ?? 1,
        item.options ?? {},
      );
    }
    return this.getCart(userId);
  }
}

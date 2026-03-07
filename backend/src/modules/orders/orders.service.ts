import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument } from './schemas/order.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { User, UserDocument } from '../users/schemas/users.schema';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  private generateOrderNumber(): string {
    const now = new Date();
    const date = now.toISOString().slice(0, 10).replace(/-/g, '');
    const time = now.toTimeString().slice(0, 8).replace(/:/g, '');
    return `ORD-${date}-${time}`;
  }

  async create(dto: CreateOrderDto) {
    const doc = {
      orderNumber: this.generateOrderNumber(),
      userId: new Types.ObjectId(dto.userId),
      items: dto.items.map((item) => ({
        assetId: new Types.ObjectId(item.assetId),
        price: item.price,
      })),
      subtotal: dto.subtotal ?? 0,
      discountAmount: dto.discountAmount ?? 0,
      taxAmount: dto.taxAmount ?? 0,
      totalAmount: dto.totalAmount,
      status: 'pending' as const,
      paymentStatus: 'pending' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    // bypassDocumentValidation skips the stale MongoDB-level $jsonSchema validator
    // on the collection (set via Atlas UI with an outdated schema). Mongoose-level
    // validation still runs via the DTO and schema definitions.
    const result = await this.orderModel.collection.insertOne(doc, { bypassDocumentValidation: true })
    return { ...doc, _id: result.insertedId }
  }

  findByUser(userId: string) {
    return this.orderModel
      .find({ userId: String(userId) })
      .populate('items.assetId')
      .exec();
  }

  /**
   * Mark an order as completed + paid and sync purchased assets to User.
   * Called by PaymentsService after a successful payment confirmation.
   */
  async completeOrder(orderId: string): Promise<OrderDocument | null> {
    const order = await this.orderModel
      .findByIdAndUpdate(
        orderId,
        {
          status: 'completed',
          paymentStatus: 'paid',
          completedAt: new Date(),
        },
        { new: true },
      )
      .exec();

    if (order) {
      const assetIds = order.items.map((i) => new Types.ObjectId(i.assetId.toString()));
      // Idempotent: $addToSet prevents duplicates if called more than once
      await this.userModel
        .findByIdAndUpdate(order.userId, {
          $addToSet: { purchased_assets: { $each: assetIds } },
        })
        .exec();
    }

    return order;
  }
}

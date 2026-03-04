import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument } from './schemas/order.schema';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
  ) {}

  create(dto: CreateOrderDto) {
    return this.orderModel.create({
      userId: new Types.ObjectId(dto.userId),
      items: dto.items.map((item) => ({
        assetId: new Types.ObjectId(item.assetId),
        price: item.price,
      })),
      subtotal: dto.subtotal || 0,
      discountAmount: dto.discountAmount || 0,
      taxAmount: dto.taxAmount || 0,
      totalAmount: dto.totalAmount,
      status: 'pending',
      paymentStatus: 'pending',
    });
  }

  findByUser(userId: string) {
    return this.orderModel
      .find({ userId: String(userId) })
      .populate('items.assetId')
      .exec();
  }
}

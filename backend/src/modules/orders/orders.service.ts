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
      user: new Types.ObjectId(dto.userId),
      items: dto.items.map((item) => ({
        asset: new Types.ObjectId(item.assetId),
        price: item.price,
      })),
      total_price: dto.totalPrice,
      status: 'pending',
    });
  }

  findByUser(userId: string) {
    return this.orderModel
      .find({ user: userId })
      .populate('items.asset')
      .exec();
  }
}

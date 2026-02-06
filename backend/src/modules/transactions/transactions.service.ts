import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  Transaction,
  TransactionDocument,
} from './schemas/transaction.schema';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<TransactionDocument>,
  ) {}

  create(dto: CreateTransactionDto) {
    return this.transactionModel.create({
      user: new Types.ObjectId(dto.userId),
      order: new Types.ObjectId(dto.orderId),
      amount: dto.amount,
      method: dto.method,
      status: 'success',
    });
  }

  findByUser(userId: string) {
    return this.transactionModel
      .find({ user: userId })
      .populate('order')
      .exec();
  }
}

import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, ClientSession } from 'mongoose';
import { Payment, PaymentDocument } from './schemas/payment.schema';
import { Order, OrderDocument } from '../orders/schemas/order.schema';
import { User, UserDocument } from '../users/schemas/users.schema';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentCallbackDto } from './dto/payment-callback.dto';
import * as crypto from 'crypto';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(Payment.name)
    private readonly paymentModel: Model<PaymentDocument>,
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  /**
   * Tạo payment record
   * - Validate order tồn tại
   * - Validate user là chủ của order
   * - Tránh duplicate payment bằng check pending status
   */
  async createPayment(dto: CreatePaymentDto) {
    const session = await this.paymentModel.startSession();
    session.startTransaction();

    try {
      // 1. Validate & get order
      const order = await this.orderModel
        .findById(dto.orderId)
        .session(session);

      if (!order) {
        await session.abortTransaction();
        throw new NotFoundException(`Order không tồn tại: ${dto.orderId}`);
      }

      // 2. Validate user là chủ của order
      if (order.userId.toString() !== dto.userId) {
        await session.abortTransaction();
        throw new BadRequestException(
          'User không có quyền tạo payment cho order này',
        );
      }

      // 3. Validate order status là pending
      if (order.status !== 'pending') {
        await session.abortTransaction();
        throw new BadRequestException(
          `Order không ở trạng thái pending. Trạng thái hiện tại: ${order.status}`,
        );
      }

      // 4. Check user tồn tại
      const user =  await this.userModel.findById(dto.userId).session(session);
      if (!user) {
        await session.abortTransaction();
        throw new NotFoundException(`User không tồn tại: ${dto.userId}`);
      }

      // 5. Tránh duplicate payment - check xem đã có payment pending cho order này chưa
      const existingPayment = await this.paymentModel
        .findOne({
          orderId: dto.orderId,
          status: 'pending',
        })
        .session(session);

      if (existingPayment) {
        await session.commitTransaction();
        return existingPayment; // Return existing payment nếu đã tạo
      }

      // 6. Tạo payment record
      const newPayment = new this.paymentModel({
        orderId: new Types.ObjectId(dto.orderId),
        userId: new Types.ObjectId(dto.userId),
        amount: dto.amount,
        method: dto.method,
        status: 'pending',
      });

      const savedPayment = await newPayment.save({ session });

      await session.commitTransaction();

      return {
        paymentId: savedPayment._id,
        orderId: savedPayment.orderId,
        userId: savedPayment.userId,
        amount: savedPayment.amount,
        method: savedPayment.method,
        status: savedPayment.status,
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  /**
   * Xử lý callback từ payment gateway
   * - Update Payment status
   * - Update Order status nếu thành công
   * - Gán asset cho user nếu thành công
   * - Avoid double processing by checking current status
   * - Use MongoDB transaction
   */
  async handlePaymentCallback(dto: PaymentCallbackDto) {
    const session = await this.paymentModel.startSession();
    session.startTransaction();

    try {
      // 1. Validate payment tồn tại
      const payment = await this.paymentModel
        .findById(dto.paymentId)
        .session(session);

      if (!payment) {
        await session.abortTransaction();
        throw new NotFoundException(
          `Payment không tồn tại: ${dto.paymentId}`,
        );
      }

      // 2. Tránh double processing - check nếu status đã thay đổi từ pending
      if (payment.status !== 'pending') {
        await session.commitTransaction();
        session.endSession();
        // Trả về thành công nếu đã xử lý (idempotent)
        return {
          message: 'Payment đã được xử lý trước đó',
          paymentId: payment._id,
          status: payment.status,
        };
      }

      // 3. Validate transactionId chưa được xử lý (tránh duplicate transactionId)
      if (payment.transactionId !== null && payment.transactionId !== undefined) {
        await session.abortTransaction();
        throw new ConflictException(
          'Payment đã có transactionId, không thể update lại',
        );
      }

      // 4. Update payment status
      payment.transactionId = dto.transaction_id;
      payment.status = dto.status;
      payment.gatewayResponse = dto.gateway_response || null;
      payment.failureReason = dto.error_message || '';
      if (dto.status === 'success') {
        payment.paidAt = new Date();
      }

      await payment.save({ session });

      // 5. Nếu thành công, update order
      if (dto.status === 'success') {
        // Update order status
        const order = await this.orderModel
          .findByIdAndUpdate(
            payment.orderId,
            { status: 'completed', paymentStatus: 'paid', paymentId: payment._id },
            { new: true, session },
          )
          .session(session);

        if (!order) {
          await session.abortTransaction();
          throw new NotFoundException(
            `Order không tồn tại: ${payment.orderId}`,
          );
        }
      } else if (dto.status === 'failed' || dto.status === 'cancelled') {
        // Nếu thất bại, update order paymentStatus nhưng giữ order status pending
        await this.orderModel.findByIdAndUpdate(
          payment.orderId,
          { paymentStatus: 'failed' },
          { session },
        ).session(session);
      }

      await session.commitTransaction();

      return {
        message: 'Payment callback đã được xử lý thành công',
        paymentId: payment._id,
        status: payment.status,
        orderStatus: dto.status === 'success' ? 'completed' : 'pending',
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  /**
   * Lấy thông tin payment
   */
  async getPayment(paymentId: string) {
    try {
      const payment = await this.paymentModel
        .findById(paymentId)
        .populate('orderId', 'totalAmount status')
        .populate('userId', 'email username');

      if (!payment) {
        throw new NotFoundException(`Payment không tồn tại: ${paymentId}`);
      }

      return payment;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Lấy danh sách payment của user
   */
  async getPaymentsByUser(userId: string, page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;

      const payments = await this.paymentModel
        .find({ userId: userId })
        .populate('orderId', 'totalAmount status items')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await this.paymentModel.countDocuments({ userId: userId });

      return {
        payments,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Lấy payment theo order ID
   */
  async getPaymentByOrder(orderId: string) {
    try {
      const payment = await this.paymentModel
        .findOne({ orderId: orderId })
        .populate('orderId')
        .populate('userId', 'email username');

      if (!payment) {
        throw new NotFoundException(
          `Payment không tồn tại cho order: ${orderId}`,
        );
      }

      return payment;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Hủy payment (nếu chưa xử lý)
   */
  async cancelPayment(paymentId: string, userId: string) {
    const session = await this.paymentModel.startSession();
    session.startTransaction();

    try {
      const payment = await this.paymentModel
        .findById(paymentId)
        .session(session);

      if (!payment) {
        await session.abortTransaction();
        throw new NotFoundException(`Payment không tồn tại: ${paymentId}`);
      }

      // Chỉ user chủ payment mới có thể hủy
      if (payment.userId.toString() !== userId) {
        await session.abortTransaction();
        throw new BadRequestException(
          'User không có quyền hủy payment này',
        );
      }

      // Chỉ có thể hủy payment ở trạng thái pending
      if (payment.status !== 'pending') {
        await session.abortTransaction();
        throw new BadRequestException(
          `Không thể hủy payment ở trạng thái: ${payment.status}`,
        );
      }

      payment.status = 'cancelled';
      await payment.save({ session });

      await session.commitTransaction();

      return {
        message: 'Payment đã được hủy',
        paymentId: payment._id,
        status: payment.status,
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  /**
   * Utility: Generate idempotency key
   */
  private generateIdempotencyKey(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Utility: Verify callback signature (IMPORTANT - implement theo gateway của bạn)
   * Ví dụ với Stripe, PayPal, v.v.
   */
  verifyCallbackSignature(
    payloadString: string,
    signature: string,
    secret: string,
  ): boolean {
    // Implement signature verification dựa trên payment gateway của bạn
    // Ví dụ cho Stripe:
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payloadString)
      .digest('hex');

    return expectedSignature === signature;
  }

  /**
   * Create mock payment (for testing)
   */
  async createMockPayment(
    orderId: string,
    userId: string,
    amount: number,
    method: string,
  ) {
    return this.createPayment({
      orderId,
      userId,
      amount,
      method,
    });  }
}
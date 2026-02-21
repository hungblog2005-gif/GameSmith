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
   * - Tránh duplicate payment bằng idempotency key
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
      if (order.user.toString() !== dto.userId) {
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
      const user = await this.userModel.findById(dto.userId).session(session);
      if (!user) {
        await session.abortTransaction();
        throw new NotFoundException(`User không tồn tại: ${dto.userId}`);
      }

      // 5. Tránh duplicate payment - check xem đã có payment pending cho order này chưa
      const existingPayment = await this.paymentModel
        .findOne({
          order: dto.orderId,
          status: 'pending',
          is_processed: false,
        })
        .session(session);

      if (existingPayment) {
        await session.abortTransaction();
        throw new ConflictException(
          `Đã có payment pending cho order này. Payment ID: ${existingPayment._id}`,
        );
      }

      // 6. Check idempotency - nếu idempotency_key được cung cấp
      let payment: PaymentDocument | null = null;
      if (dto.idempotency_key) {
        payment = await this.paymentModel
          .findOne({ idempotency_key: dto.idempotency_key })
          .session(session);

        if (payment) {
          await session.commitTransaction();
          return payment; // Return existing payment nếu đã tạo
        }
      }

      // 7. Tạo payment record
      const newPayment = new this.paymentModel({
        order: new Types.ObjectId(dto.orderId),
        user: new Types.ObjectId(dto.userId),
        amount: dto.amount,
        method: dto.method,
        status: 'pending',
        idempotency_key: dto.idempotency_key || this.generateIdempotencyKey(),
        is_processed: false,
      });

      const savedPayment = await newPayment.save({ session });

      await session.commitTransaction();

      return {
        paymentId: savedPayment._id,
        orderId: savedPayment.order,
        userId: savedPayment.user,
        amount: savedPayment.amount,
        method: savedPayment.method,
        status: savedPayment.status,
        created_at: (savedPayment as any).created_at,
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
   * - Tránh double processing
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

      // 2. Tránh double processing - check flag is_processed
      if (payment.is_processed) {
        await session.commitTransaction();
        session.endSession();
        // Trả về thành công nếu đã xử lý (idempotent)
        return {
          message: 'Payment đã được xử lý trước đó',
          paymentId: payment._id,
          status: payment.status,
        };
      }

      // 3. Validate transaction_id chưa được xử lý (tránh duplicate transaction_id)
      if (payment.transaction_id !== null) {
        await session.abortTransaction();
        throw new ConflictException(
          'Payment đã có transaction_id, không thể update lại',
        );
      }

      // 4. Update payment status
      payment.transaction_id = dto.transaction_id;
      payment.status = dto.status;
      payment.gateway_response = dto.gateway_response || null;
      payment.error_message = dto.error_message || null;
      payment.is_processed = true;
      payment.processed_at = new Date();

      await payment.save({ session });

      // 5. Nếu thành công, update order và cấp quyền asset cho user
      if (dto.status === 'success') {
        // Update order status
        const order = await this.orderModel
          .findByIdAndUpdate(
            payment.order,
            { status: 'paid' },
            { new: true, session },
          )
          .session(session);

        if (!order) {
          await session.abortTransaction();
          throw new NotFoundException(
            `Order không tồn tại: ${payment.order}`,
          );
        }

        // 6. Gán quyền asset cho user - thêm vào user collections
        // Giả sử có user-collections model để lưu assets của user
        if (order.items && order.items.length > 0) {
          const assetIds = order.items.map((item) => item.asset);

          // Add assets to user collections (nếu có)
          // Bạn có thể gọi UserCollectionsService ở đây hoặc update trực tiếp
          // Ví dụ:
          await this.userModel
            .findByIdAndUpdate(
              payment.user,
              {
                $addToSet: {
                  purchased_assets: { $each: assetIds }, // Field này cần thêm vào User schema
                },
              },
              { session },
            )
            .session(session);
        }
      } else if (dto.status === 'failed' || dto.status === 'cancelled') {
        // Nếu thất bại, không cần update order - vẫn giữ status 'pending'
        // User có thể thử thanh toán lại
      }

      await session.commitTransaction();

      return {
        message: 'Payment callback đã được xử lý thành công',
        paymentId: payment._id,
        status: payment.status,
        orderStatus: dto.status === 'success' ? 'paid' : 'pending',
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
        .populate('order', 'total_price status')
        .populate('user', 'email username');

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
        .find({ user: userId })
        .populate('order', 'total_price status items')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit);

      const total = await this.paymentModel.countDocuments({ user: userId });

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
        .findOne({ order: orderId })
        .populate('order')
        .populate('user', 'email username');

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
      if (payment.user.toString() !== userId) {
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

      // Chỉ hủy nếu chưa được xử lý
      if (payment.is_processed) {
        await session.abortTransaction();
        throw new BadRequestException(
          'Không thể hủy payment đã được xử lý',
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
    });
  }
}

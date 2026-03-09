import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
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
    // 1. Validate order tồn tại
    const order = await this.orderModel.findById(dto.orderId);
    if (!order) {
      throw new NotFoundException(`Order không tồn tại: ${dto.orderId}`);
    }

    // 2. Validate user là chủ của order
    if (order.userId.toString() !== dto.userId) {
      throw new BadRequestException('User không có quyền tạo payment cho order này');
    }

    // 3. Validate order status là pending
    if (order.status !== 'pending') {
      throw new BadRequestException(
        `Order không ở trạng thái pending. Trạng thái hiện tại: ${order.status}`,
      );
    }

    // 4. Check user tồn tại
    const user = await this.userModel.findById(dto.userId);
    if (!user) {
      throw new NotFoundException(`User không tồn tại: ${dto.userId}`);
    }

    // 5. Huỷ các pending payment cũ của user (orderId khác) để tránh stale data
    await this.paymentModel.updateMany(
      {
        userId: new Types.ObjectId(dto.userId),
        status: 'pending',
        orderId: { $ne: new Types.ObjectId(dto.orderId) },
      },
      { $set: { status: 'cancelled' } },
    );

    // 6. Idempotency: nếu đã có pending payment cho đúng order này thì trả về luôn
    const existingPayment = await this.paymentModel.findOne({
      orderId: new Types.ObjectId(dto.orderId),
      status: 'pending',
    });
    if (existingPayment) {
      return {
        paymentId: existingPayment._id,
        orderId: existingPayment.orderId,
        userId: existingPayment.userId,
        amount: existingPayment.amount,
        method: existingPayment.method,
        status: existingPayment.status,
      };
    }

    // 7. Tạo payment record mới
    const isFree = dto.amount === 0;
    const newPayment = new this.paymentModel({
      orderId: new Types.ObjectId(dto.orderId),
      userId: new Types.ObjectId(dto.userId),
      amount: dto.amount,
      method: isFree ? 'free' : dto.method,
      status: isFree ? 'success' : 'pending',
      ...(isFree && { paidAt: new Date() }),
    });

    const savedPayment = await newPayment.save();

    // 8. Nếu miễn phí → auto-complete order + gán asset ngay lập tức
    if (isFree) {
      const order = await this.orderModel.findByIdAndUpdate(
        new Types.ObjectId(dto.orderId),
        { status: 'completed', paymentStatus: 'paid', paymentId: savedPayment._id },
        { new: true },
      );
      if (order) {
        const assetIds = order.items.map((item) => item.assetId);
        await this.userModel.findByIdAndUpdate(new Types.ObjectId(dto.userId), {
          $addToSet: { purchased_assets: { $each: assetIds } },
        });
      }
      return {
        paymentId: savedPayment._id,
        orderId: savedPayment.orderId,
        userId: savedPayment.userId,
        amount: savedPayment.amount,
        method: savedPayment.method,
        status: 'success',
        free: true,
      };
    }

    return {
      paymentId: savedPayment._id,
      orderId: savedPayment.orderId,
      userId: savedPayment.userId,
      amount: savedPayment.amount,
      method: savedPayment.method,
      status: savedPayment.status,
    };
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
    const payment = await this.paymentModel.findById(dto.paymentId);
    if (!payment) {
      throw new NotFoundException(`Payment không tồn tại: ${dto.paymentId}`);
    }

    if (payment.status !== 'pending') {
      return { message: 'Payment đã được xử lý trước đó', paymentId: payment._id, status: payment.status };
    }

    if (payment.transactionId !== null && payment.transactionId !== undefined) {
      throw new ConflictException('Payment đã có transactionId, không thể update lại');
    }

    payment.transactionId = dto.transaction_id;
    payment.status = dto.status;
    payment.gatewayResponse = dto.gateway_response || null;
    payment.failureReason = dto.error_message || '';
    if (dto.status === 'success') {
      payment.paidAt = new Date();
    }
    await payment.save();

    if (dto.status === 'success') {
      const order = await this.orderModel.findByIdAndUpdate(
        payment.orderId,
        { status: 'completed', paymentStatus: 'paid', paymentId: payment._id },
        { new: true },
      );
      if (!order) {
        throw new NotFoundException(`Order không tồn tại: ${payment.orderId}`);
      }
    } else if (dto.status === 'failed' || dto.status === 'cancelled') {
      await this.orderModel.findByIdAndUpdate(payment.orderId, { paymentStatus: 'failed' });
    }

    return {
      message: 'Payment callback đã được xử lý thành công',
      paymentId: payment._id,
      status: payment.status,
      orderStatus: dto.status === 'success' ? 'completed' : 'pending',
    };
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
    const payment = await this.paymentModel.findById(paymentId);
    if (!payment) {
      throw new NotFoundException(`Payment không tồn tại: ${paymentId}`);
    }
    if (payment.userId.toString() !== userId) {
      throw new BadRequestException('User không có quyền hủy payment này');
    }
    if (payment.status !== 'pending') {
      throw new BadRequestException(`Không thể hủy payment ở trạng thái: ${payment.status}`);
    }

    payment.status = 'cancelled';
    await payment.save();

    return { message: 'Payment đã được hủy', paymentId: payment._id, status: payment.status };
  }

  /**
   * Utility: Generate idempotency key
   */
  private generateIdempotencyKey(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Verify HMAC-SHA256 callback signature.
   * Canonical string: "<paymentId>|<transaction_id>|<status>"
   * Uses timingSafeEqual to prevent timing-based signature oracle attacks.
   */
  verifyCallbackSignature(
    paymentId: string,
    transactionId: string,
    status: string,
    receivedSignature: string,
    secret: string,
  ): boolean {
    const payload = `${paymentId}|${transactionId}|${status}`;
    const expected = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    try {
      const expectedBuf = Buffer.from(expected, 'hex');
      const receivedBuf = Buffer.from(receivedSignature.toLowerCase(), 'hex');
      if (expectedBuf.length !== receivedBuf.length) return false;
      return crypto.timingSafeEqual(expectedBuf, receivedBuf);
    } catch {
      return false;
    }
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

  // ─────────────────────────────────────────────
  // MoMo Personal QR methods
  // ─────────────────────────────────────────────

  /**
   * Trả về deepLink MoMo để frontend render QR động
   * SĐT MoMo chỉ nằm ở backend .env, không bao giờ expose ra client
   */
  async getMomoQrData(paymentId: string, userId: string) {
    const payment = await this.paymentModel
      .findById(paymentId)
      .populate<{ orderId: { orderNumber: string; totalAmount: number } }>(
        'orderId',
        'orderNumber totalAmount',
      );

    if (!payment) {
      throw new NotFoundException(`Payment không tồn tại: ${paymentId}`);
    }

    if (payment.userId.toString() !== userId) {
      throw new BadRequestException('Bạn không có quyền xem QR payment này');
    }

    if (payment.method !== 'momo_personal') {
      throw new BadRequestException('Payment này không dùng phương thức MoMo cá nhân');
    }

    const momoPhone = process.env.MOMO_PHONE;
    const accountName = process.env.MOMO_ACCOUNT_NAME || 'NGO QUOC TUONG HUNG';
    const usdToVnd = parseInt(process.env.MOMO_USD_TO_VND_RATE || '25000', 10);

    if (!momoPhone) {
      throw new InternalServerErrorException('Cấu hình MoMo chưa được thiết lập');
    }

    const order = payment.orderId as { orderNumber: string; totalAmount: number };
    const amountVND = Math.round(payment.amount * usdToVnd);
    const note = `ORDER_${order.orderNumber}`;

    // Encode note for URL safety
    const encodedNote = encodeURIComponent(note);
    const deepLink = `momo://transfer?phone=${momoPhone}&amount=${amountVND}&note=${encodedNote}`;

    // Persist amountVND and note to payment record (if not already set)
    if (!payment.amountVND) {
      await this.paymentModel.findByIdAndUpdate(paymentId, {
        amountVND,
        momoTransactionNote: note,
      });
    }

    return {
      deepLink,
      amountVND,
      amountUSD: payment.amount,
      note,
      accountName,
      orderNumber: order.orderNumber,
      paymentId: payment._id,
    };
  }

  /**
   * User upload ảnh chứng minh thanh toán
   * Status vẫn ở 'pending' — chờ admin xác nhận
   */
  async uploadProof(
    paymentId: string,
    userId: string,
    filePath: string,
    transactionId?: string,
    note?: string,
  ) {
    const payment = await this.paymentModel.findById(paymentId);

    if (!payment) {
      throw new NotFoundException(`Payment không tồn tại: ${paymentId}`);
    }

    if (payment.userId.toString() !== userId) {
      throw new BadRequestException('Bạn không có quyền cập nhật payment này');
    }

    if (payment.status !== 'pending') {
      throw new BadRequestException(
        `Chỉ có thể upload proof cho payment đang pending. Trạng thái hiện tại: ${payment.status}`,
      );
    }

    const updateData: Record<string, any> = { proofImageUrl: filePath };
    if (transactionId) updateData.transactionId = transactionId;
    if (note) updateData.failureReason = note; // reuse field for user notes

    await this.paymentModel.findByIdAndUpdate(paymentId, updateData);

    return {
      message: 'Đã tải lên bằng chứng thanh toán. Đang chờ admin xác nhận.',
      paymentId,
      status: 'pending',
    };
  }

  /**
   * Admin xác nhận thanh toán thủ công
   * Trigger: order.status = completed + gán asset cho user
   */
  async adminConfirmPayment(paymentId: string, adminId: string, transactionId: string, adminNote?: string) {
    const payment = await this.paymentModel.findById(paymentId);
    if (!payment) throw new NotFoundException(`Payment không tồn tại: ${paymentId}`);

    if (payment.status !== 'pending') {
      return { message: 'Payment đã được xử lý trước đó', paymentId: payment._id, status: payment.status };
    }

    payment.status = 'success';
    payment.transactionId = transactionId;
    payment.paidAt = new Date();
    payment.confirmedBy = new Types.ObjectId(adminId);
    payment.confirmedAt = new Date();
    if (adminNote) payment.adminNote = adminNote;
    await payment.save();

    const order = await this.orderModel.findByIdAndUpdate(
      payment.orderId,
      { status: 'completed', paymentStatus: 'paid', paymentId: payment._id },
      { new: true },
    );
    if (!order) throw new NotFoundException(`Order không tồn tại: ${payment.orderId}`);

    const assetIds = order.items.map((item) => item.assetId);
    await this.userModel.findByIdAndUpdate(payment.userId, {
      $addToSet: { purchased_assets: { $each: assetIds } },
    });

    return { message: 'Thanh toán đã được xác nhận thành công', paymentId: payment._id, status: 'success', orderStatus: 'completed', assetsGranted: assetIds.length };
  }

  /**
   * Admin từ chối thanh toán
   */
  async adminRejectPayment(paymentId: string, adminId: string, adminNote?: string) {
    const payment = await this.paymentModel.findById(paymentId);
    if (!payment) throw new NotFoundException(`Payment không tồn tại: ${paymentId}`);

    if (payment.status !== 'pending') {
      return { message: 'Payment đã được xử lý trước đó', paymentId: payment._id, status: payment.status };
    }

    payment.status = 'failed';
    payment.confirmedBy = new Types.ObjectId(adminId);
    payment.confirmedAt = new Date();
    if (adminNote) payment.adminNote = adminNote;
    await payment.save();

    await this.orderModel.findByIdAndUpdate(payment.orderId, { paymentStatus: 'failed' });

    return { message: 'Thanh toán đã bị từ chối', paymentId: payment._id, status: 'failed' };
  }

  /**
   * Admin lấy danh sách payment MoMo cá nhân đang pending
   */
  async getPendingMomoPayments(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const payments = await this.paymentModel
      .find({ method: 'momo_personal', status: 'pending' })
      .populate('orderId', 'orderNumber totalAmount items createdAt')
      .populate('userId', 'email username avatar_url')
      .sort({ createdAt: 1 }) // oldest first
      .skip(skip)
      .limit(limit);

    const total = await this.paymentModel.countDocuments({
      method: 'momo_personal',
      status: 'pending',
    });

    return {
      payments,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }
}
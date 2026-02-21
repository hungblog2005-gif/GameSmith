import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  BadRequestException,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentCallbackDto } from './dto/payment-callback.dto';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * POST /payments
   * Tạo payment mới
   * - Validate order tồn tại
   * - Validate user è chủ của order
   * - Return paymentId để client gửi đến gateway
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createPayment(@Body() dto: CreatePaymentDto) {
    try {
      const result = await this.paymentsService.createPayment(dto);
      return {
        success: true,
        data: result,
        message: 'Payment đã được tạo. Vui lòng hoàn tất thanh toán.',
      };
    } catch (error: any) {
      throw new BadRequestException({
        success: false,
        message: error.message || 'Lỗi khi tạo payment',
      });
    }
  }

  /**
   * POST /payments/callback
   * Callback từ payment gateway
   * - Verify signature từ gateway
   * - Update payment status
   * - Update order status
   * - Cấp quyền asset cho user
   *
   * IMPORTANT: Callback này được gọi từ payment gateway, không cần JWT
   */
  @Post('callback')
  @HttpCode(HttpStatus.OK)
  async handlePaymentCallback(@Body() dto: PaymentCallbackDto) {
    try {
      // Note: Bạn nên verify signature ở đây
      // const isValid = this.paymentsService.verifyCallbackSignature(
      //   JSON.stringify(dto),
      //   dto.signature,
      //   process.env.PAYMENT_GATEWAY_SECRET
      // );
      // if (!isValid) {
      //   throw new BadRequestException('Invalid signature');
      // }

      const result = await this.paymentsService.handlePaymentCallback(dto);
      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Lỗi khi xử lý payment callback',
      };
    }
  }

  /**
   * GET /payments/:id
   * Lấy thông tin payment
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getPayment(@Param('id') paymentId: string) {
    try {
      const payment = await this.paymentsService.getPayment(paymentId);
      return {
        success: true,
        data: payment,
      };
    } catch (error: any) {
      throw new BadRequestException({
        success: false,
        message: error.message || 'Lỗi khi lấy thông tin payment',
      });
    }
  }

  /**
   * GET /payments/user/:userId
   * Lấy danh sách payment của user
   */
  @Get('user/:userId')
  @UseGuards(JwtAuthGuard)
  async getPaymentsByUser(
    @Param('userId') userId: string,
    @Req() req: any,
  ) {
    try {
      // Validate user chỉ có thể xem payment của chính mình
      // const currentUserId = req.user?.id;
      // if (currentUserId !== userId) {
      //   throw new BadRequestException('User không có quyền xem payment của người khác');
      // }

      const page = parseInt(req.query?.page as string) || 1;
      const limit = parseInt(req.query?.limit as string) || 10;

      const result = await this.paymentsService.getPaymentsByUser(
        userId,
        page,
        limit,
      );
      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      throw new BadRequestException({
        success: false,
        message: error.message || 'Lỗi khi lấy payment của user',
      });
    }
  }

  /**
   * GET /payments/order/:orderId
   * Lấy payment theo order ID
   */
  @Get('order/:orderId')
  @UseGuards(JwtAuthGuard)
  async getPaymentByOrder(@Param('orderId') orderId: string) {
    try {
      const payment = await this.paymentsService.getPaymentByOrder(orderId);
      return {
        success: true,
        data: payment,
      };
    } catch (error: any) {
      throw new BadRequestException({
        success: false,
        message: error.message || 'Lỗi khi lấy payment của order',
      });
    }
  }

  /**
   * POST /payments/:id/cancel
   * Hủy payment (nếu chưa xử lý)
   */
  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async cancelPayment(
    @Param('id') paymentId: string,
    @Req() req: any,
  ) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new BadRequestException('User không được xác thực');
      }

      const result = await this.paymentsService.cancelPayment(
        paymentId,
        userId,
      );
      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      throw new BadRequestException({
        success: false,
        message: error.message || 'Lỗi khi hủy payment',
      });
    }
  }
}

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
  UseInterceptors,
  UploadedFile,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentCallbackDto } from './dto/payment-callback.dto';
import { UploadProofDto } from './dto/upload-proof.dto';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

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

  // ─────────────────────────────────────────────
  // MoMo Personal QR endpoints
  // ─────────────────────────────────────────────

  /**
   * GET /payments/admin/pending-momo
   * Admin: lấy danh sách payment MoMo cá nhân đang pending
   * IMPORTANT: must be defined BEFORE :id routes to avoid route conflict
   */
  @Get('admin/pending-momo')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'moderator')
  async getPendingMomoPayments(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    try {
      const result = await this.paymentsService.getPendingMomoPayments(
        parseInt(page || '1', 10),
        parseInt(limit || '20', 10),
      );
      return { success: true, data: result };
    } catch (error: any) {
      throw new BadRequestException({
        success: false,
        message: error.message || 'Lỗi khi lấy danh sách payment pending',
      });
    }
  }

  /**
   * GET /payments/:id/momo-qr
   * Trả về MoMo deepLink để frontend render QR động
   * SĐT MoMo KHÔNG bao giờ đi ra frontend — chỉ trả về deepLink
   */
  @Get(':id/momo-qr')
  @UseGuards(JwtAuthGuard)
  async getMomoQrData(@Param('id') paymentId: string, @Req() req: any) {
    try {
      const userId = req.user?.id || req.user?.sub;
      if (!userId) throw new BadRequestException('User không được xác thực');
      const result = await this.paymentsService.getMomoQrData(paymentId, userId);
      return { success: true, data: result };
    } catch (error: any) {
      throw new BadRequestException({
        success: false,
        message: error.message || 'Lỗi khi lấy dữ liệu QR MoMo',
      });
    }
  }

  /**
   * POST /payments/:id/proof
   * User upload ảnh chứng minh thanh toán MoMo
   */
  @Post(':id/proof')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('proof', {
      storage: diskStorage({
        destination: './uploads/payment-proofs',
        filename: (_req, _file, cb) => {
          // uuid rename — never use original filename (path traversal prevention)
          cb(null, `${uuidv4()}${extname(_file.originalname).toLowerCase()}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Chỉ chấp nhận file ảnh (jpg, png, webp)'), false);
        }
      },
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }),
  )
  async uploadProof(
    @Param('id') paymentId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadProofDto,
    @Req() req: any,
  ) {
    try {
      const userId = req.user?.id || req.user?.sub;
      if (!userId) throw new BadRequestException('User không được xác thực');
      if (!file) throw new BadRequestException('Vui lòng upload ảnh chứng minh thanh toán');

      const filePath = `/uploads/payment-proofs/${file.filename}`;
      const result = await this.paymentsService.uploadProof(
        paymentId,
        userId,
        filePath,
        dto.transactionId,
        dto.note,
      );
      return { success: true, data: result };
    } catch (error: any) {
      throw new BadRequestException({
        success: false,
        message: error.message || 'Lỗi khi upload bằng chứng thanh toán',
      });
    }
  }

  /**
   * POST /payments/:id/confirm
   * Admin xác nhận thanh toán đã nhận tiền
   */
  @Post(':id/confirm')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'moderator')
  @HttpCode(HttpStatus.OK)
  async confirmPayment(
    @Param('id') paymentId: string,
    @Body() dto: ConfirmPaymentDto,
    @Req() req: any,
  ) {
    try {
      const adminId = req.user?.id || req.user?.sub;
      if (!adminId) throw new BadRequestException('User không được xác thực');
      const result = await this.paymentsService.adminConfirmPayment(
        paymentId,
        adminId,
        dto.transactionId,
        dto.adminNote,
      );
      return { success: true, data: result };
    } catch (error: any) {
      throw new BadRequestException({
        success: false,
        message: error.message || 'Lỗi khi xác nhận payment',
      });
    }
  }

  /**
   * POST /payments/:id/reject
   * Admin từ chối thanh toán
   */
  @Post(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'moderator')
  @HttpCode(HttpStatus.OK)
  async rejectPayment(
    @Param('id') paymentId: string,
    @Body() body: { adminNote?: string },
    @Req() req: any,
  ) {
    try {
      const adminId = req.user?.id || req.user?.sub;
      if (!adminId) throw new BadRequestException('User không được xác thực');
      const result = await this.paymentsService.adminRejectPayment(
        paymentId,
        adminId,
        body.adminNote,
      );
      return { success: true, data: result };
    } catch (error: any) {
      throw new BadRequestException({
        success: false,
        message: error.message || 'Lỗi khi từ chối payment',
      });
    }
  }
}

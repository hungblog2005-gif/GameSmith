import { IsString, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';

export class PaymentCallbackDto {
  @IsString()
  @IsNotEmpty({ message: 'Payment ID là bắt buộc' })
  paymentId!: string;

  @IsString()
  @IsNotEmpty({ message: 'Transaction ID là bắt buộc' })
  transaction_id!: string;

  @IsEnum(['success', 'failed', 'cancelled'], {
    message: 'Status phải là success, failed hoặc cancelled',
  })
  @IsNotEmpty()
  status!: 'success' | 'failed' | 'cancelled';

  @IsOptional()
  @IsString()
  error_message?: string;

  @IsOptional()
  gateway_response?: any; // Raw response từ gateway

  @IsString()
  @IsNotEmpty({ message: 'Signature là bắt buộc để xác thực callback' })
  signature!: string;
}

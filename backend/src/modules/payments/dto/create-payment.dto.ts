import { IsMongoId, IsNumber, IsEnum, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreatePaymentDto {
  @IsMongoId({ message: 'Order ID phải là MongoDB ObjectId hợp lệ' })
  @IsNotEmpty()
  orderId!: string;

  @IsMongoId({ message: 'User ID phải là MongoDB ObjectId hợp lệ' })
  @IsNotEmpty()
  userId!: string;

  @IsNumber()
  @Min(0, { message: 'Số tiền không được âm' })
  @IsNotEmpty()
  amount!: number;

  @IsEnum(['card', 'paypal', 'wallet', 'bank_transfer', 'momo_personal', 'free'], {
    message: 'Phương thức thanh toán không hợp lệ',
  })
  @IsNotEmpty()
  method!: string;

  @IsOptional()
  @IsString()
  idempotency_key?: string;
}

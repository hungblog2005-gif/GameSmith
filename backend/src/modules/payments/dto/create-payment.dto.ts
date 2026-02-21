import { IsMongoId, IsNumber, IsEnum, IsNotEmpty, Min } from 'class-validator';

export class CreatePaymentDto {
  @IsMongoId({ message: 'Order ID phải là MongoDB ObjectId hợp lệ' })
  @IsNotEmpty()
  orderId!: string;

  @IsMongoId({ message: 'User ID phải là MongoDB ObjectId hợp lệ' })
  @IsNotEmpty()
  userId!: string;

  @IsNumber()
  @Min(0.01, { message: 'Số tiền phải lớn hơn 0' })
  @IsNotEmpty()
  amount!: number;

  @IsEnum(['card', 'paypal', 'wallet', 'bank_transfer'], {
    message: 'Phương thức thanh toán không hợp lệ',
  })
  @IsNotEmpty()
  method!: string;

  // Optional idempotency key để tránh duplicate request
  idempotency_key?: string;
}

import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class ConfirmPaymentDto {
  @IsString()
  @IsNotEmpty({ message: 'Transaction ID MoMo là bắt buộc khi xác nhận' })
  @MaxLength(100)
  transactionId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  adminNote?: string;
}

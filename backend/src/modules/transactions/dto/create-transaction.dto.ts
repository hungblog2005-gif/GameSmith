import { IsMongoId, IsNumber, IsString } from 'class-validator';

export class CreateTransactionDto {
  @IsMongoId()
  userId!: string;

  @IsMongoId()
  orderId!: string;

  @IsNumber()
  amount!: number;

  @IsString()
  method!: string;
}

import {
  IsArray,
  IsMongoId,
  IsNumber,
  IsOptional,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

class OrderItemDto {
  @IsMongoId()
  assetId!: string;

  @IsNumber()
  price!: number;
}

export class CreateOrderDto {
  @IsMongoId()
  userId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];

  @IsNumber()
  @IsOptional()
  subtotal?: number;

  @IsNumber()
  @IsOptional()
  discountAmount?: number;

  @IsNumber()
  @IsOptional()
  taxAmount?: number;

  @IsNumber()
  totalAmount!: number;

  @IsEnum(['USD', 'EUR', 'GBP', 'VND'])
  @IsOptional()
  currency?: string;

  @IsOptional()
  paymentMethod?: string;
}

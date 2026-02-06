import {
  IsArray,
  IsMongoId,
  IsNumber,
  ValidateNested,
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
  totalPrice!: number;
}

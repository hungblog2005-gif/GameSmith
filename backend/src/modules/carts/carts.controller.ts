import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { CartsService } from './carts.service';

@Controller('carts')
export class CartsController {
  private readonly logger = new Logger(CartsController.name);

  constructor(private readonly cartsService: CartsService) {}

  /** GET /carts/user/:userId */
  @Get('user/:userId')
  async getCart(@Param('userId') userId: string) {
    try {
      return await this.cartsService.getCart(userId);
    } catch (error: any) {
      this.logger.error(`getCart error for ${userId}:`, error);
      throw new HttpException(
        { message: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /** POST /carts/user/:userId/items  body: { assetId, quantity?, options? } */
  @Post('user/:userId/items')
  async addItem(
    @Param('userId') userId: string,
    @Body()
    body: { assetId: string; quantity?: number; options?: Record<string, any> },
  ) {
    try {
      return await this.cartsService.addItem(
        userId,
        body.assetId,
        body.quantity,
        body.options,
      );
    } catch (error: any) {
      this.logger.error(`addItem error:`, error);
      throw new HttpException(
        { message: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /** PATCH /carts/user/:userId/items/:assetId  body: { quantity, options? } */
  @Patch('user/:userId/items/:assetId')
  async updateItem(
    @Param('userId') userId: string,
    @Param('assetId') assetId: string,
    @Body() body: { quantity: number; options?: Record<string, any> },
  ) {
    try {
      return await this.cartsService.updateItem(
        userId,
        assetId,
        body.quantity,
        body.options,
      );
    } catch (error: any) {
      this.logger.error(`updateItem error:`, error);
      throw new HttpException(
        { message: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /** DELETE /carts/user/:userId/items/:assetId */
  @Delete('user/:userId/items/:assetId')
  async removeItem(
    @Param('userId') userId: string,
    @Param('assetId') assetId: string,
  ) {
    try {
      return await this.cartsService.removeItem(userId, assetId);
    } catch (error: any) {
      this.logger.error(`removeItem error:`, error);
      throw new HttpException(
        { message: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /** DELETE /carts/user/:userId */
  @Delete('user/:userId')
  async clearCart(@Param('userId') userId: string) {
    try {
      return await this.cartsService.clearCart(userId);
    } catch (error: any) {
      this.logger.error(`clearCart error:`, error);
      throw new HttpException(
        { message: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /** POST /carts/user/:userId/merge  body: { items: [{ id, quantity, options }] } */
  @Post('user/:userId/merge')
  async mergeGuestCart(
    @Param('userId') userId: string,
    @Body()
    body: {
      items: Array<{
        id: string;
        quantity?: number;
        options?: Record<string, any>;
      }>;
    },
  ) {
    try {
      return await this.cartsService.mergeGuestCart(userId, body.items || []);
    } catch (error: any) {
      this.logger.error(`mergeGuestCart error:`, error);
      throw new HttpException(
        { message: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}

import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CartService } from './cart.service';

@Controller('cart')
@UseGuards(AuthGuard('jwt'))
export class CartController {
  constructor(private cartService: CartService) {}

  @Get()
  async getCart(@Request() req) {
    return this.cartService.getCart(req.user.id);
  }

  @Post('items')
  async addItem(
    @Request() req,
    @Body()
    data: {
      productId: string;
      quantity: number;
      startDate: string;
      endDate: string;
    },
  ) {
    return this.cartService.addItem(
      req.user.id,
      data.productId,
      data.quantity,
      data.startDate,
      data.endDate,
    );
  }

  @Post('items/:itemId/quantity')
  async updateQuantity(
    @Request() req,
    @Param('itemId') itemId: string,
    @Body('quantity') quantity: number,
  ) {
    return this.cartService.updateQuantity(req.user.id, itemId, quantity);
  }

  @Delete('items/:itemId')
  async removeItem(@Request() req, @Param('itemId') itemId: string) {
    return this.cartService.removeItem(req.user.id, itemId);
  }

  @Delete()
  async clearCart(@Request() req) {
    return this.cartService.clearCart(req.user.id);
  }
}

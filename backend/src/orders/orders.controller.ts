import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
  Patch,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../entities/user.entity';
import { FulfillmentStatus } from '../entities/order.entity';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /**
   * 장바구니에서 주문 생성
   */
  @Post()
  async create(@Request() req, @Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.createFromCart(req.user.id, createOrderDto);
  }

  /**
   * 내 주문 목록
   */
  @Get('my')
  async findMyOrders(@Request() req) {
    return this.ordersService.findMyOrders(req.user.id);
  }

  /**
   * 주문 상세 조회
   */
  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    return this.ordersService.findOne(id, req.user.id);
  }

  /**
   * 관리자: 모든 주문 조회
   */
  @Get()
  @Roles(UserRole.ADMIN)
  async findAll(@Query('status') status?: FulfillmentStatus) {
    return this.ordersService.findAll(status);
  }

  /**
   * 주문 취소
   */
  @Patch(':id/cancel')
  async cancel(
    @Request() req,
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    return this.ordersService.cancel(id, req.user.id, reason);
  }

  /**
   * 관리자: 주문 승인
   */
  @Patch(':id/approve')
  @Roles(UserRole.ADMIN)
  async approve(@Param('id') id: string) {
    return this.ordersService.approve(id);
  }

  /**
   * 관리자: 입금 확인
   */
  @Patch(':id/confirm-payment')
  @Roles(UserRole.ADMIN)
  async confirmPayment(@Param('id') id: string) {
    return this.ordersService.confirmPayment(id);
  }

  /**
   * 관리자: 상품 발송
   */
  @Patch(':id/dispatch')
  @Roles(UserRole.ADMIN)
  async dispatch(@Param('id') id: string) {
    return this.ordersService.dispatch(id);
  }

  /**
   * 관리자: 상품 회수
   */
  @Patch(':id/collect')
  @Roles(UserRole.ADMIN)
  async collect(@Param('id') id: string) {
    return this.ordersService.collect(id);
  }
}

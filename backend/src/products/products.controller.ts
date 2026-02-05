import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../entities/user.entity';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get()
  async findAll() {
    return this.productsService.findAll();
  }

  @Get('search')
  async search(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('q') query?: string,
    @Query('categoryId') categoryId?: string,
    @Query('includeUnavailable') includeUnavailable?: string,
  ) {
    return this.productsService.search(
      startDate,
      endDate,
      query,
      categoryId,
      includeUnavailable === 'true',
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Get(':id/blocked-periods')
  async getBlockedPeriods(@Param('id') id: string) {
    return this.productsService.getBlockedPeriods(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPPLIER, UserRole.ADMIN)
  async create(@Request() req, @Body() productData: any) {
    return this.productsService.create(productData, req.user.id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPPLIER, UserRole.ADMIN)
  async update(@Param('id') id: string, @Body() productData: any) {
    return this.productsService.update(id, productData);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPPLIER, UserRole.ADMIN)
  async delete(@Param('id') id: string) {
    return this.productsService.delete(id);
  }

  // Admin: Add blocked period
  @Post(':id/block-periods')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async addBlockedPeriod(
    @Param('id') productId: string,
    @Body() body: { blockedStart: string; blockedEnd: string; reason?: string },
    @Request() req,
  ) {
    return this.productsService.addBlockedPeriod(
      productId,
      body.blockedStart,
      body.blockedEnd,
      body.reason || '',
      req.user.id,
    );
  }

  // Admin: Delete blocked period
  @Delete(':id/block-periods/:periodId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async deleteBlockedPeriod(
    @Param('id') productId: string,
    @Param('periodId') periodId: string,
  ) {
    const result = await this.productsService.deleteBlockedPeriod(productId, periodId);
    if (!result) {
      return { success: false, message: 'Blocked period not found' };
    }
    return { success: true, message: 'Blocked period deleted successfully' };
  }
}

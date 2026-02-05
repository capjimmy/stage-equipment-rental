import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../entities/user.entity';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('products')
  async getAllProducts(
    @Query('status') status?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.adminService.getAllProducts({ status, categoryId });
  }

  @Get('orders')
  async getAllOrders(
    @Query('status') status?: string,
  ) {
    return this.adminService.getAllOrders({ status });
  }

  @Get('users')
  async getAllUsers(
    @Query('role') role?: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.getAllUsers({ role, status });
  }
}

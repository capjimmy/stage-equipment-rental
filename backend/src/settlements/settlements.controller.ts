import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { SettlementsService } from './settlements.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../entities/user.entity';
import { SettlementStatus } from '../entities/settlement.entity';

@Controller('settlements')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SettlementsController {
  constructor(private settlementsService: SettlementsService) {}

  /**
   * 내 정산 목록 (공급자용)
   */
  @Get('my')
  @Roles(UserRole.SUPPLIER, UserRole.ADMIN)
  async getMySettlements(
    @Request() req,
    @Query('status') status?: SettlementStatus,
  ) {
    return this.settlementsService.findBySupplier(req.user.id, status);
  }

  /**
   * 내 정산 통계 (공급자용)
   */
  @Get('my/stats')
  @Roles(UserRole.SUPPLIER, UserRole.ADMIN)
  async getMyStats(@Request() req) {
    return this.settlementsService.getSupplierStats(req.user.id);
  }

  /**
   * 관리자: 모든 정산 조회
   */
  @Get()
  @Roles(UserRole.ADMIN)
  async getAllSettlements(@Query('status') status?: SettlementStatus) {
    return this.settlementsService.findAll(status);
  }

  /**
   * 관리자: 플랫폼 수익 통계
   */
  @Get('platform/stats')
  @Roles(UserRole.ADMIN)
  async getPlatformStats() {
    return this.settlementsService.getPlatformStats();
  }

  /**
   * 정산 상세 조회
   */
  @Get(':id')
  @Roles(UserRole.SUPPLIER, UserRole.ADMIN)
  async getSettlement(@Param('id') id: string) {
    return this.settlementsService.findOne(id);
  }

  /**
   * 관리자: 정산 확정
   */
  @Patch(':id/confirm')
  @Roles(UserRole.ADMIN)
  async confirmSettlement(@Param('id') id: string) {
    return this.settlementsService.confirm(id);
  }

  /**
   * 관리자: 정산 지급 완료
   */
  @Patch(':id/mark-paid')
  @Roles(UserRole.ADMIN)
  async markAsPaid(@Param('id') id: string) {
    return this.settlementsService.markAsPaid(id);
  }
}

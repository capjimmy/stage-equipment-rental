import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { RentalIssuesService } from './rental-issues.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../entities/user.entity';
import {
  IssueType,
  IssueSeverity,
  IssueStatus,
} from '../entities/rental-issue.entity';

@Controller('rental-issues')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RentalIssuesController {
  constructor(private rentalIssuesService: RentalIssuesService) {}

  /**
   * 관리자: 이슈 생성
   */
  @Post()
  @Roles(UserRole.ADMIN)
  async create(
    @Request() req,
    @Body()
    data: {
      rentalId: string;
      type: IssueType;
      severity: IssueSeverity;
      impactNextBooking?: boolean;
      impactNotes?: string;
      impactCost?: number;
      evidencePhotos?: string[];
      additionalCharge?: number;
    },
  ) {
    const { rentalId, type, severity, ...rest } = data;
    return this.rentalIssuesService.create(
      rentalId,
      type,
      severity,
      req.user.id,
      rest,
    );
  }

  /**
   * 관리자/공급자: 이슈 목록 조회
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPPLIER)
  async findAll(@Query('status') status?: IssueStatus) {
    return this.rentalIssuesService.findAll(status);
  }

  /**
   * 관리자: 이슈 통계
   */
  @Get('stats')
  @Roles(UserRole.ADMIN)
  async getStats() {
    return this.rentalIssuesService.getStats();
  }

  /**
   * 렌탈별 이슈 조회
   */
  @Get('rental/:rentalId')
  @Roles(UserRole.ADMIN, UserRole.SUPPLIER)
  async findByRental(@Param('rentalId') rentalId: string) {
    return this.rentalIssuesService.findByRental(rentalId);
  }

  /**
   * 이슈 상세 조회
   */
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPPLIER)
  async findOne(@Param('id') id: string) {
    return this.rentalIssuesService.findOne(id);
  }

  /**
   * 관리자: 이슈 상태 업데이트
   */
  @Patch(':id/status')
  @Roles(UserRole.ADMIN)
  async updateStatus(
    @Param('id') id: string,
    @Body() data: { status: IssueStatus; resolutionNotes?: string },
  ) {
    return this.rentalIssuesService.updateStatus(
      id,
      data.status,
      data.resolutionNotes,
    );
  }

  /**
   * 관리자: 추가 청구액 설정
   */
  @Patch(':id/additional-charge')
  @Roles(UserRole.ADMIN)
  async setAdditionalCharge(
    @Param('id') id: string,
    @Body('additionalCharge') additionalCharge: number,
  ) {
    return this.rentalIssuesService.setAdditionalCharge(id, additionalCharge);
  }

  /**
   * 관리자: 증거 사진 추가
   */
  @Patch(':id/evidence-photos')
  @Roles(UserRole.ADMIN)
  async addEvidencePhotos(
    @Param('id') id: string,
    @Body('photoUrls') photoUrls: string[],
  ) {
    return this.rentalIssuesService.addEvidencePhotos(id, photoUrls);
  }

  /**
   * 관리자: 이슈 해결
   */
  @Patch(':id/resolve')
  @Roles(UserRole.ADMIN)
  async resolve(
    @Param('id') id: string,
    @Body('resolutionNotes') resolutionNotes: string,
  ) {
    return this.rentalIssuesService.resolve(id, resolutionNotes);
  }
}

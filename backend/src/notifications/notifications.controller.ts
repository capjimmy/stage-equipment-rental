import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  /**
   * 내 알림 목록 조회
   */
  @Get()
  async getMyNotifications(
    @Request() req,
    @Query('onlyUnread') onlyUnread?: string,
  ) {
    return this.notificationsService.findByUser(
      req.user.id,
      onlyUnread === 'true',
    );
  }

  /**
   * 알림 읽음 처리
   */
  @Patch(':id/read')
  async markAsRead(@Request() req, @Param('id') id: string) {
    return this.notificationsService.markAsRead(id, req.user.id);
  }

  /**
   * 모든 알림 읽음 처리
   */
  @Patch('read-all')
  async markAllAsRead(@Request() req) {
    await this.notificationsService.markAllAsRead(req.user.id);
    return { message: 'All notifications marked as read' };
  }

  /**
   * 알림 삭제
   */
  @Delete(':id')
  async deleteNotification(@Request() req, @Param('id') id: string) {
    await this.notificationsService.delete(id, req.user.id);
    return { message: 'Notification deleted' };
  }
}

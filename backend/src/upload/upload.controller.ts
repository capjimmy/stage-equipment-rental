import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../entities/user.entity';

@Controller('upload')
export class UploadController {
  // 단일 이미지 업로드
  @Post('image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPPLIER, UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  uploadImage(@UploadedFile() file: any) {
    if (!file) {
      return { error: 'No file uploaded' };
    }

    return {
      url: `/uploads/${file.filename}`,
      filename: file.filename,
      originalname: file.originalname,
      size: file.size,
    };
  }

  // 다중 이미지 업로드
  @Post('images')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPPLIER, UserRole.ADMIN)
  @UseInterceptors(FilesInterceptor('files', 10))
  uploadImages(@UploadedFiles() files: any[]) {
    if (!files || files.length === 0) {
      return { error: 'No files uploaded' };
    }

    return {
      files: files.map((file) => ({
        url: `/uploads/${file.filename}`,
        filename: file.filename,
        originalname: file.originalname,
        size: file.size,
      })),
    };
  }
}

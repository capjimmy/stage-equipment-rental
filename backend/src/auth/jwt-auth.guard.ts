import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    console.log('🔒 JwtAuthGuard.canActivate() called');
    const request = context.switchToHttp().getRequest();
    console.log('🔒 Authorization header:', request.headers.authorization);
    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    console.log('🔒 JwtAuthGuard.handleRequest() called');
    console.log('🔒 Error:', err);
    console.log('🔒 User:', user);
    console.log('🔒 Info:', info);

    if (err || !user) {
      console.error('🔒 Authentication failed:', info);
      throw new UnauthorizedException(info?.message || 'Unauthorized');
    }
    return user;
  }
}

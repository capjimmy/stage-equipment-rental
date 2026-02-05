import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from './auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    });
    console.log('✅ JwtStrategy constructor called - Strategy initialized');
  }

  async validate(payload: any) {
    console.log('JWT Strategy validate - payload:', payload);
    const user = await this.authService.validateUser(payload.sub);
    console.log('JWT Strategy validate - user:', user);
    if (!user) {
      console.error('JWT Strategy validate - User not found!');
      throw new UnauthorizedException();
    }
    return user;
  }
}

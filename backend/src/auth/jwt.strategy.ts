import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from '../users/user.service';

interface JwtPayload {
  sub: number;
  email: string;
  role: string;
  exp: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>(
        'JWT_SECRET',
        'cupuacu-dev-access-secret',
      ),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.userService
      .findActiveById(payload.sub)
      .catch(() => {
        throw new UnauthorizedException('Token inválido');
      });

    if (user.email !== payload.email) {
      throw new UnauthorizedException('Token inválido');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      expiresAt: payload.exp * 1000,
    };
  }
}

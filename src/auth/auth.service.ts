import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService, JwtSignOptions } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { UserService } from "../users/user.service";
import { LoginDto } from "./dto/login.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";

interface TokenPayload {
  sub: number;
  email: string;
  role: string;
  tokenType?: "refresh";
}

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.userService.findByEmailWithPassword(loginDto.email);

    if (
      !user ||
      !user.ativo ||
      !(await bcrypt.compare(loginDto.senha, user.senha))
    ) {
      throw new UnauthorizedException("E-mail ou senha inválidos");
    }

    await this.userService.updateLastLogin(user.id);
    return this.createTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
  }

  async refresh(refreshTokenDto: RefreshTokenDto) {
    try {
      const payload = await this.jwtService.verifyAsync<TokenPayload>(
        refreshTokenDto.refreshToken,
        {
          secret: this.configService.get<string>(
            "JWT_REFRESH_SECRET",
            "cupuacu-dev-refresh-secret",
          ),
        },
      );

      if (payload.tokenType !== "refresh") {
        throw new UnauthorizedException("Refresh token inválido");
      }

      const user = await this.userService.findActiveById(payload.sub);
      return this.createTokens({
        sub: user.id,
        email: user.email,
        role: user.role,
      });
    } catch {
      throw new UnauthorizedException("Refresh token inválido ou expirado");
    }
  }

  private async createTokens(payload: Omit<TokenPayload, "tokenType">) {
    const accessToken = await this.jwtService.signAsync(payload);
    const refreshToken = await this.jwtService.signAsync(
      { ...payload, tokenType: "refresh" },
      {
        secret: this.configService.get<string>(
          "JWT_REFRESH_SECRET",
          "cupuacu-dev-refresh-secret",
        ),
        expiresIn: this.configService.get<string>(
          "JWT_REFRESH_EXPIRES_IN",
          "7d",
        ) as JwtSignOptions["expiresIn"],
      },
    );

    return {
      accessToken,
      refreshToken,
    };
  }
}

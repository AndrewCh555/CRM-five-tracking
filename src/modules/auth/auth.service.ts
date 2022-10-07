import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as util from 'node:util';
import * as crypto from 'node:crypto';
import { Request } from 'express';
import { JwtPayload } from '@common/interfaces/jwt';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

import { SignUpRequestDto, SignInRequestDto, TokenResponseDto } from '@modules/auth/dto';
import { UserInterface } from '@common/interfaces/user';
import { UserService } from '@modules/user/user.service';
import { UserResponseDto } from '@modules/user/dto';
import { User } from '@shared/models';
import { FastifyReply } from 'fastify';
import { UpdatePasswordRequestDto } from '@modules/auth/dto';

const encryptIterations = 50_000;
const encryptKeyLength = 64;
const encryptDigest = 'sha512';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    @InjectPinoLogger(UserService.name)
    private readonly logger: PinoLogger,
  ) {}

  async registration(dto: SignUpRequestDto): Promise<UserResponseDto> {
    dto.password = await this.encryptPassword(dto.password);

    const user = await this.userService.create(dto);

    return UserResponseDto.mapFrom(user);
  }

  async login(dto: SignInRequestDto): Promise<UserResponseDto> {
    const user: User = await this.userService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Incorrect password or email');
    }

    if (!(await this.checkPassword(dto.password, user.password))) {
      throw new UnauthorizedException('Incorrect password or email');
    }

    return UserResponseDto.mapFrom(user);
  }

  async verifyPayload(payload: JwtPayload): Promise<User> {
    let user: User;

    try {
      user = await this.userService.findByEmail(payload.sub);
    } catch (error) {
      this.logger.error({ error }, 'AuthService:verifyPayload:error');
      throw new UnauthorizedException(`There isn't any user with email: ${payload.sub}`);
    }
    delete user.password;

    return user;
  }

  signToken(user: User): string {
    const payload = {
      sub: user.email,
    };

    return this.jwtService.sign(payload);
  }

  private async encryptPassword(plainPassword: string): Promise<string> {
    const salt = crypto.randomBytes(16).toString('hex');

    const crypt = util.promisify(crypto.pbkdf2);

    const encryptedPassword = await crypt(plainPassword, salt, encryptIterations, encryptKeyLength, encryptDigest);

    return salt + ':' + encryptedPassword.toString('hex');
  }

  private async checkPassword(password: string, existPassword: string): Promise<boolean> {
    const [salt, key] = existPassword.split(':');

    const crypt = util.promisify(crypto.pbkdf2);

    const encryptedPassword = await crypt(password, salt, encryptIterations, encryptKeyLength, encryptDigest);
    return key === encryptedPassword.toString('hex');
  }

  async regenerateTokens(request, response: FastifyReply): Promise<TokenResponseDto> {
    const tokenData = await this.jwtService.decode(request.headers.authorization.split(' ')[1]);
    const user = await this.userService.findByEmailForToken(tokenData.sub);
    delete user.password;
    const accessToken = await this.getJwtToken(user);
    const refreshToken = await this.getRefreshToken(user.id);

    return {
      accessToken,
      refreshToken,
    };
  }

  async changePassword(userId: string, dto: UpdatePasswordRequestDto): Promise<void> {
    const user = await this.userService.findById(userId);
    if (!(await this.checkPassword(dto.oldPassword, user.password))) {
      throw new UnauthorizedException('Incorrect password');
    }
    dto.newPassword = await this.encryptPassword(dto.newPassword);
    await this.userService.changePassword(userId, dto.newPassword);
  }

  public async getJwtToken(user: User): Promise<string> {
    const payload = {
      ...user,
    };
    return this.jwtService.signAsync(payload);
  }

  public async getRefreshToken(id: string): Promise<string> {
    const userDataToUpdate = {
      refreshToken: process.env.JWT_REFRESH_TOKEN_SECRET,
    };

    await this.userService.updateToken(id, userDataToUpdate.refreshToken);
    return userDataToUpdate.refreshToken;
  }

  public async validateToken(request: Request, payload: any): Promise<UserInterface> {
    if (!payload) {
      throw new BadRequestException('Invalid jwt token');
    }
    const data = request?.cookies['Auth-cookie'];
    if (!data?.refreshToken) {
      throw new BadRequestException('Invalid refresh token');
    }
    const user = await this.validRefreshToken(payload.email, data.refreshToken);
    if (!user) {
      throw new BadRequestException('Token expired');
    }

    return user;
  }

  public async validRefreshToken(email: string, refreshToken: string): Promise<UserInterface | null> {
    const user = await this.userService.findOneWithToken(email, refreshToken);

    if (!user) {
      throw new BadRequestException('Token expired');
    }

    const currentUser = new UserInterface();
    currentUser.id = user.id;
    currentUser.firstName = user.profile.firstName;
    currentUser.email = user.email;

    return currentUser;
  }
}

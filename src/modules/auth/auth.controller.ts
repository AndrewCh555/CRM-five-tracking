import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { TokenInterceptor } from '@shared/interseptors';
import { AuthService } from '@modules/auth/auth.service';
import { SignUpRequestDto, SignInRequestDto, TokenResponseDto } from '@modules/auth/dto';
import { UserResponseDto } from '@modules/user/dto';
import { FastifyReply } from 'fastify';
import { AuthUser } from '@shared/decorators';
import { User } from '@shared/models';
import { UpdatePasswordRequestDto } from '@modules/auth/dto/request/update-password.request.dto';
import { AuthGuard } from '@nestjs/passport';
import { StrategiesEnum } from '@common/enums/strategies';
import { CookieTokenInterceptor } from '@shared/interseptors/cookie-token.interceptor';

@Controller('auth')
@ApiTags('Authentication')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('registration')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ description: 'Registration' })
  @ApiOkResponse({ type: UserResponseDto, description: 'Successfully created user' })
  @ApiBadRequestResponse({ description: 'Incorrect registration data.' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async register(@Body() signUpDto: SignUpRequestDto): Promise<UserResponseDto> {
    return this.authService.registration(signUpDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ description: 'Login' })
  @UseInterceptors(TokenInterceptor)
  async login(@Body() signInDto: SignInRequestDto): Promise<UserResponseDto> {
    return this.authService.login(signInDto);
  }

  @Get('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseInterceptors(CookieTokenInterceptor)
  @ApiOperation({ description: 'Refresh' })
  async refresh(@Req() request, @Res({ passthrough: true }) response: FastifyReply): Promise<TokenResponseDto> {
    return await this.authService.regenerateTokens(request, response);
  }

  @Post('password-change')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(AuthGuard(StrategiesEnum.JWT))
  @ApiOperation({ description: 'Password change' })
  async passwordChange(@AuthUser() user: User, @Body() dto: UpdatePasswordRequestDto): Promise<void> {
    await this.authService.changePassword(user.id, dto);
  }
}

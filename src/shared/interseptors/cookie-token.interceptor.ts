import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { FastifyReply } from 'fastify';
import { TokenResponseDto } from '@modules/auth/dto';
import { RefreshCookiesEnum } from '@common/enums/cookies';

@Injectable()
export class CookieTokenInterceptor implements NestInterceptor {
  constructor() {}

  intercept(context: ExecutionContext, next: CallHandler<TokenResponseDto>): Observable<{ msg: string }> {
    return next.handle().pipe(
      map((dto) => {
        const response = context.switchToHttp().getResponse<FastifyReply>();

        response.setCookie(RefreshCookiesEnum.Access, `Bearer ${dto.accessToken}`);
        response.setCookie(RefreshCookiesEnum.Refresh, dto.refreshToken);
        return { msg: 'success' };
      }),
    );
  }
}

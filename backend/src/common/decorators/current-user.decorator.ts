import { createParamDecorator, ExecutionContext } from '@nestjs/common';

type CurrentUserData = 'id' | 'email' | undefined;

export const CurrentUser = createParamDecorator<CurrentUserData>(
  (data: CurrentUserData, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as { id?: string; email?: string } | undefined;
    return data ? user?.[data] : user;
  },
);

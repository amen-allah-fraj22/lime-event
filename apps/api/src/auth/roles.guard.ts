import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AppRole } from './app-roles';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<AppRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles?.length) return true;

    const req = context.switchToHttp().getRequest();
    const user = req.dbUser as { roles?: string[] } | undefined;
    const userRoles = user?.roles ?? [];
    const hasRole = requiredRoles.some((r) => userRoles.includes(r));
    if (!user || !hasRole) {
      throw new ForbiddenException();
    }
    return true;
  }
}

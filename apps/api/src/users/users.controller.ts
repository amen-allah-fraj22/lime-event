import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { DbUserGuard } from '../auth/db-user.guard';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { UsersService } from './users.service';
import { AddRoleDto } from './dto/add-role.dto';
import { SetActiveRoleDto } from './dto/set-active-role.dto';

@Controller('users')
@UseGuards(ClerkAuthGuard, DbUserGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  async me(@Req() req: { clerkUserId: string }) {
    const user = await this.usersService.getMe(req.clerkUserId);
    const completeness = user
      ? await this.usersService.profileCompleteness(user.id)
      : 0;
    return { ...user, profile_completeness: completeness };
  }

  @Patch('me/add-role')
  addRole(@Req() req: { dbUser: { id: string } }, @Body() body: AddRoleDto) {
    return this.usersService.addRole(req.dbUser.id, body.role);
  }

  @Patch('me/active-role')
  setActiveRole(
    @Req() req: { dbUser: { id: string } },
    @Body() body: SetActiveRoleDto,
  ) {
    return this.usersService.setActiveRole(req.dbUser.id, body.active_role);
  }
}

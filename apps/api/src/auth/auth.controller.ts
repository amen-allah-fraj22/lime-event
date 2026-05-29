import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SyncUserDto } from './dto/sync-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('sync')
  sync(@Body() dto: SyncUserDto) {
    return this.authService.syncUser(dto);
  }
}

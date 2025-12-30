import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req) {
    const userId = req.user?.sub || req.user?.id;
    const user = await this.usersService.findById(userId);
    if (!user) {
      return { error: 'User not found' };
    }
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

import { Controller, Get, Post, Delete, Param, Body, Req, UseGuards } from '@nestjs/common';
import { UserService } from '../service/user.service.js';
import { JwtAuthGuard } from '../../AuthModule/guard/jwt-auth.guard.js';
import { RolesGuard } from '../../AuthModule/guard/roles.guard.js';
import { Roles } from '../../AuthModule/decorator/roles.decorator.js';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('all')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'super-admin')
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'super-admin')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(Number(id));
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'super-admin', 'ADMIN', 'admin')
  create(@Body() data: { email: string; password: string; firstname?: string, lastname?: string, role?: string }) {
    return this.userService.create(data);
  }

  @Post('updateStatus')
  updateStatus(
    @Body() data: { id: number; activated: boolean },
    @Req() req: { user: { userId: number } },
  ) {
    return this.userService.updateBlock(data, req.user.userId);
  }

  @Post('update')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'super-admin')
  update(@Body() data: { id: number, email?: string; firstname?: string, lastname?: string, role?: string, phone?: string }) {
    return this.userService.update(data);
  }

  @Post('updatePassword')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'super-admin')
  updatePassword(@Body() data: { id: number, password: string }) {
    return this.userService.updatePass(data);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'super-admin', 'ADMIN', 'admin')
  remove(@Param('id') id: string) {
    return this.userService.remove(Number(id));
  }

  @Get('stats/by-month')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'super-admin')
  getStatsByMonth() {
    return this.userService.getStatsByMonth();
  }
}



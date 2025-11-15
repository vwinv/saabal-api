import { Controller, Get, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { UserService } from '../service/user.service.js';
import { JwtAuthGuard } from '../../AuthModule/guard/jwt-auth.guard.js';
import { RolesGuard } from '../../AuthModule/guard/roles.guard.js';
import { Roles } from '../../AuthModule/decorator/roles.decorator.js';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('all')
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(Number(id));
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'admin')
  create(@Body() data: { email: string; password: string; firstname?: string, lastname?: string, role?: string }) {
    return this.userService.create(data);
  }

  @Post('updateStatus')
  updateStatus(@Body() data: { id: number,activated: boolean}) {
    return this.userService.updateBlock(data);
  }

  @Post('update')
  update(@Body() data: { id: number, email?: string; firstname?: string, lastname?: string, role?: string, phone?: string }) {
    return this.userService.update(data);
  }

  @Post('updatePassword')
  updatePassword(@Body() data: { id: number, password: string }) {
    return this.userService.updatePass(data);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'admin')
  remove(@Param('id') id: string) {
    return this.userService.remove(Number(id));
  }

  @Get('stats/by-month')
  getStatsByMonth() {
    return this.userService.getStatsByMonth();
  }
}



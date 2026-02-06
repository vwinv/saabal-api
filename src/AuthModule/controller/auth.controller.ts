import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from '../service/auth.service.js';
import { JwtAuthGuard } from '../guard/jwt-auth.guard.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('me/deactivate')
  @UseGuards(JwtAuthGuard)
  deactivateMyAccount(@Req() req: { user: { userId: number } }) {
    return this.authService.deactivateMyAccount(req.user.userId);
  }

  @Post('register')
  register(@Body() body: {
    email: string;
    password: string;
    firstname?: string;
    lastname?: string;
    phone?: string;
  }) {
    return this.authService.register(body);
  }

  @Post('login')
  login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }

  @Post('refresh')
  async refresh(@Body() body: { refresh_token: string }) {
    return this.authService.refresh(body.refresh_token);
  }
}



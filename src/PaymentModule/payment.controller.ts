import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { PaymentService } from './payment.service.js';
import { JwtAuthGuard } from '../AuthModule/guard/jwt-auth.guard.js';
import { Public } from '../AuthModule/decorator/public.decorator.js';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  /**
   * Crée une facture PayDunya pour une offre donnée.
   * Utilisateur doit être authentifié (on récupère son id via le token).
   * Body: { offreId: number }
   */
  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  createCheckout(
    @Body() body: { offreId: number },
    @Req() req: { user: { userId: number } },
  ) {
    const userId = req.user.userId;
    return this.paymentService.createCheckout({
      userId,
      offreId: Number(body.offreId),
    });
  }

  /**
   * Endpoint de callback / webhook PayDunya.
   * Doit être configuré dans le dashboard PayDunya comme callback_url.
   * Public car appelé par PayDunya.
   */
  @Post('paydunya-callback')
  @Public()
  handleCallback(@Body() body: any) {
    return this.paymentService.handleCallback(body);
  }
}


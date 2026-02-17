import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { PaymentService } from './payment.service.js';
import { JwtAuthGuard } from '../AuthModule/guard/jwt-auth.guard.js';
import { Public } from '../AuthModule/decorator/public.decorator.js';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  /**
   * Initialise un paiement PayTech pour une offre donnée.
   * Utilisateur doit être authentifié (on récupère son id via le token).
   * Body: { offreId: number }
   *
   * Réponse: { success: true, data: { token, redirect_url } }
   */
  @Post('paytech/init')
  @UseGuards(JwtAuthGuard)
  initPaytech(
    @Body() body: { offreId: number },
    @Req() req: { user: { userId: number } },
  ) {
    const userId = req.user.userId;
    return this.paymentService.createPaytechCheckout({
      userId,
      offreId: Number(body.offreId),
    });
  }

  /**
   * Endpoint IPN / webhook PayTech.
   * À configurer comme ipn_url dans la requête request-payment.
   * Public car appelé directement par PayTech.
   */
  @Post('paytech/ipn')
  @Public()
  handlePaytechIpn(@Body() body: any) {
    return this.paymentService.handlePaytechIpn(body);
  }
}


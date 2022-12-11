import { Router } from 'express';
import { WebhookController } from './webhooks.controller';

const router = Router();

router.post('/paystack', WebhookController.handlePaystackWebhook);

export default router;

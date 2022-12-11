import { Router } from 'express';

import authRoutes from './users/users.route';
import walletRoutes from './wallets/wallets.route';
import webhookRoutes from './webhooks/webhooks.route';

const router = Router();

router.use('/auth', authRoutes);
router.use('/wallets', walletRoutes);
router.use('/webhook', webhookRoutes);

export default router;

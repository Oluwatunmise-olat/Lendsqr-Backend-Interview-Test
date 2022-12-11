import { Router } from 'express';

import { AuthMiddleware, RequestPayloadValidator } from '../utils';
import { WalletController } from './wallets.controller';
import WalletValidator from './wallets.validator';

const router = Router();

router.get('/balance', WalletController.getWalletBalance);
router.post(
  '/fund',
  AuthMiddleware.authenticate,
  RequestPayloadValidator(WalletValidator.fundWallet()),
  WalletController.fundWallet,
);
router.get(
  '/fund/verify/:reference',
  AuthMiddleware.authenticate,
  WalletController.verifyWalletFunding,
);
router.post(
  '/transfer',
  AuthMiddleware.authenticate,
  RequestPayloadValidator(WalletValidator.transfer()),
  WalletController.transferFunds,
);
router.post(
  '/withdraw',
  AuthMiddleware.authenticate,
  RequestPayloadValidator(WalletValidator.debitWallet()),
  WalletController.debitWallet,
);

export default router;

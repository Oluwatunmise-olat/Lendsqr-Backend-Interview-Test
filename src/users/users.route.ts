import { Router } from 'express';

import { UserController } from './users.controller';
import UserValidator from './users.validator';
import { RequestPayloadValidator } from '../utils';

const router = Router();

router.post(
  '',
  RequestPayloadValidator(UserValidator.register()),
  UserController.register,
);
router.post(
  '/login',
  RequestPayloadValidator(UserValidator.logIn()),
  UserController.logIn,
);

export default router;

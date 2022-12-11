import 'dotenv/config';
import * as joi from 'joi';

import { logger } from '..';

const envSchema = joi
  .object({
    PORT: joi.number().optional().allow(''),
    NODE_ENV: joi
      .string()
      .valid('production', 'staging', 'development', 'test'),
    SECRET_KEY: joi.string().required(),
    MYSQL_HOST: joi.string().required(),
    MYSQL_PORT: joi.number().required(),
    MYSQL_USER: joi.string().required(),
    MYSQL_PASSWORD: joi.string().allow('').optional().default(''),
    MYSQL_DATABASE_NAME: joi.string().required(),
    PAYSTACK_SECRET_KEY: joi.string().required(),
  })
  .options({ allowUnknown: true });

const { error, value } = envSchema
  .prefs({ errors: { label: 'key' } })
  .validate(process.env);

if (error) {
  logger.error('Error loading environment variables', error);
}

export const Env = {
  PORT: Number(value.PORT),
  NODE_ENV: value.NODE_ENV,
  SECRET_KEY: value.SECRET_KEY,
  MYSQL_HOST: value.MYSQL_HOST,
  MYSQL_PORT: Number(value.MYSQL_PORT),
  MYSQL_USER: value.MYSQL_USER,
  MYSQL_PASSWORD: value.MYSQL_PASSWORD,
  MYSQL_DATABASE_NAME: value.MYSQL_DATABASE_NAME,
  PAYSTACK_SECRET_KEY: value.PAYSTACK_SECRET_KEY,
};

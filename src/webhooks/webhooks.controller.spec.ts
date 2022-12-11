import * as request from 'supertest';
import * as express from 'express';

import app from '../main';
import { PayStackWebhookEvents } from '../utils';

describe('Webhook', () => {
  let server: express.Application;
  let controllerPrefix = '/webhook';

  beforeAll(async () => {
    server = app;
  });
  describe('Paystack', () => {
    test('should return an error response, when webhook is not from paystack', async () => {
      const response = await request(server)
        .post(`${controllerPrefix}/paystack`)
        .send({
          status: 'success',
          data: { event: PayStackWebhookEvents.TRANSACTION_SUCCESS },
        })
        .set('headers', 'oops');
      const { status, message } = response.body;

      expect(response.statusCode).toEqual(400);
      expect(status).toBeFalsy();
      expect(message).toBeDefined();
    });
  });
});

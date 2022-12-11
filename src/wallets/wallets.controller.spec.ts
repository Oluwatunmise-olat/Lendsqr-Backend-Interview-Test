import * as request from 'supertest';
import * as express from 'express';
import * as faker from '@withshepherd/faker';
import * as crypto from 'crypto';

import app from '../main';
import KnexDataSource from '../database/datasource';
import {
  generateJwt,
  generateReferenceCode,
  generateUUID,
  getCurrentTime,
  PaymentProviders,
  TransactionStatus,
  TransactionType,
} from '../utils';

jest.mock('../utils/third-party/paystack', () => ({
  PayStack: {
    getTransactionCheckoutPaymentLink: jest.fn().mockReturnValue({
      status: true,
      message: null,
      data: {
        authorization_url: 'https://checkout.paystack.com/5orel7u4r43hpi9"',
      },
    }),
    verifyTransaction: jest.fn().mockReturnValue({
      status: true,
      message: null,
      data: { status: 'success', gateway_response: 'Successful' },
    }),
  },
}));

describe('Wallets', () => {
  let server: express.Application;
  let controllerPrefix = '/wallets';
  let randomTransactionRef = crypto.randomBytes(6).toString('hex');

  let authUserEmail =
    faker.name.prefix() +
    Math.floor(Math.random() * 8999 + 1000).toString() +
    '@balance.com';

  let authUserToken;
  let authUserId;

  let authUserWalletId;

  beforeAll(async () => {
    server = app;

    const user_id = generateUUID();
    const wallet_id = generateUUID();
    await KnexDataSource('users').insert({
      first_name: faker.name.firstName(),
      last_name: faker.name.lastName(),
      email: authUserEmail,
      password: 'password',
      created_at: getCurrentTime(),
      updated_at: getCurrentTime(),
      uuid: user_id,
    });

    await KnexDataSource('wallets').insert({
      user_id: user_id,
      balance: 0,
      created_at: getCurrentTime(),
      updated_at: getCurrentTime(),
      uuid: wallet_id,
    });

    authUserToken = await generateJwt(user_id);
    authUserId = user_id;
    authUserWalletId = wallet_id;
  });

  describe('Transfer', () => {
    test('if user tries to transfer an amount greater than their wallet balance, returns an error response', async () => {
      // Create required test dependencies
      const email =
        faker.name.prefix() +
        Math.floor(Math.random() * 8999 + 1000).toString() +
        '@balance.com';
      const user_id = generateUUID();
      await KnexDataSource('users').insert({
        first_name: faker.name.firstName(),
        last_name: faker.name.lastName(),
        email,
        password: 'password',
        created_at: getCurrentTime(),
        updated_at: getCurrentTime(),
        uuid: user_id,
      });

      await KnexDataSource('wallets').insert({
        user_id: user_id,
        balance: 0,
        created_at: getCurrentTime(),
        updated_at: getCurrentTime(),
        uuid: generateUUID(),
      });

      // Test
      const response = await request(server)
        .post(`${controllerPrefix}/transfer`)
        .send({ recipient_email: email, amount: 2000 })
        .set('Authorization', `Bearer ${authUserToken}`);

      const { status, message, data } = response.body;

      expect(response.statusCode).toEqual(400);
      expect(status).toBeFalsy();
      expect(message).toBeDefined();
      expect(data).toBeUndefined();
    });

    test('if user tries to perform a transfer to themselves, returns an error response', async () => {
      const response = await request(server)
        .post(`${controllerPrefix}/transfer`)
        .send({ recipient_email: authUserEmail, amount: 2000 })
        .set('Authorization', `Bearer ${authUserToken}`);

      const { status, message, data } = response.body;

      expect(response.statusCode).toEqual(400);
      expect(status).toBeFalsy();
      expect(message).toBeDefined();
      expect(data).toBeUndefined();
    });

    test('if user tries to perform transfer to a non existent recipient account, returns an error response', async () => {
      const response = await request(server)
        .post(`${controllerPrefix}/transfer`)
        .send({ recipient_email: 'non.existent@user.com', amount: 2000 })
        .set('Authorization', `Bearer ${authUserToken}`);

      const { status, message, data } = response.body;

      expect(response.statusCode).toEqual(404);
      expect(status).toBeFalsy();
      expect(message).toBeDefined();
      expect(data).toBeUndefined();
    });

    test('if given valid payload i.e (transfer amount < wallet balance, valid recipient account), should return a success response and debit/credit associated accounts accordingly', async () => {
      // Test dependencies
      const KOBO = 100;
      const email =
        faker.name.prefix() +
        Math.floor(Math.random() * 8999 + 1000).toString() +
        '@balance.com';
      const user_id = generateUUID();
      await KnexDataSource('users').insert({
        first_name: faker.name.firstName(),
        last_name: faker.name.lastName(),
        email,
        password: 'password',
        created_at: getCurrentTime(),
        updated_at: getCurrentTime(),
        uuid: user_id,
      });

      await KnexDataSource('wallets').insert({
        user_id: user_id,
        balance: 0,
        created_at: getCurrentTime(),
        updated_at: getCurrentTime(),
        uuid: generateUUID(),
      });

      await KnexDataSource('wallets')
        .whereNull('deleted_at')
        .where('user_id', authUserId)
        .increment('balance', 5000 * KOBO);

      // Test
      const response = await request(server)
        .post(`${controllerPrefix}/transfer`)
        .send({ recipient_email: email, amount: 2000 })
        .set('Authorization', `Bearer ${authUserToken}`);

      const { status, message } = response.body;

      expect(response.statusCode).toEqual(200);
      expect(status).toBeTruthy();
      expect(message).toBeDefined();
      const recipientWallet = await KnexDataSource('wallets')
        .whereNull('deleted_at')
        .where('user_id', user_id)
        .first();
      const senderWallet = await KnexDataSource('wallets')
        .whereNull('deleted_at')
        .where('user_id', authUserId)
        .first();
      expect(recipientWallet.balance / KOBO).toEqual(2000);
      expect(senderWallet.balance / KOBO).toEqual(3000);

      await KnexDataSource('wallets')
        .whereNull('deleted_at')
        .where('user_id', authUserId)
        .update({ balance: 0 });
    });
  });
  describe('Balance', () => {
    test('given a user registered on platform email, returns a success response', async () => {
      // Create required test dependencies
      const email =
        faker.name.prefix() +
        Math.floor(Math.random() * 8999 + 1000).toString() +
        '@balance.com';

      const user_id = generateUUID();
      await KnexDataSource('users').insert({
        first_name: faker.name.firstName(),
        last_name: faker.name.lastName(),
        email,
        password: 'password',
        created_at: getCurrentTime(),
        updated_at: getCurrentTime(),
        uuid: user_id,
      });

      await KnexDataSource('wallets').insert({
        user_id: user_id,
        balance: 0,
        created_at: getCurrentTime(),
        updated_at: getCurrentTime(),
        uuid: generateUUID(),
      });

      // Test
      const response = await request(server).get(
        `${controllerPrefix}/balance?email=${email}`,
      );
      const { status, message, data } = response.body;

      expect(response.statusCode).toEqual(200);
      expect(status).toBeTruthy();
      expect(message).toBeDefined();
      expect(data).toBeDefined();
      expect(data.balance_in_naira).toBeDefined();

      expect(data.balance_in_naira).toEqual(0);
    });

    test('given a non existent user email, should return an error response', async () => {
      const response = await request(server).get(
        `${controllerPrefix}/balance?email=test.user@gmail.com`,
      );
      const { status, message, data } = response.body;

      expect(response.statusCode).toEqual(404);
      expect(status).toBeFalsy();
      expect(message).toBeDefined();
      expect(data).toBeUndefined();
    });
  });
  describe('Initialize Funding', () => {
    test('given a valid payload i.e (amount), should return a success response alongside an authorization_url to choose payment method and create a pending transaction record', async () => {
      const response = await request(server)
        .post(`${controllerPrefix}/fund`)
        .set('Authorization', `Bearer ${authUserToken}`)
        .send({ amount: 2000 });
      const { status, message, data } = response.body;

      expect(response.statusCode).toEqual(200);
      expect(status).toBeTruthy();
      expect(message).toBeDefined();
      expect(data).toBeDefined();
      expect(data.reference).toBeDefined();
      const transactionExists = await KnexDataSource('transactions')
        .whereNull('deleted_at')
        .where('transaction_reference', data.reference)
        .where('user_id', authUserId)
        .first();
      expect(transactionExists).toBeDefined();
      expect(transactionExists.status).toEqual(TransactionStatus.PENDING);
    });
  });

  describe('Finalize Funding', () => {
    test('if given an invalid transaction reference, should return an error response', async () => {
      const response = await request(server)
        .get(`${controllerPrefix}/fund/verify/${randomTransactionRef}`)
        .set('Authorization', `Bearer ${authUserToken}`);
      const { status, message, data } = response.body;

      expect(response.statusCode).toEqual(404);
      expect(status).toBeFalsy();
      expect(message).toBeDefined();
      expect(data).toBeUndefined();
    });
    test('if transaction status returned by paystack is a success status, credits users wallet and mark transaction as successful', async () => {
      // Create required test dependencies
      const KOBO = 100;
      const AMOUNT_IN_KOBO = 1000 * KOBO;
      const transaction_id = generateUUID();
      const transaction_ref = generateReferenceCode();

      await KnexDataSource('transactions').insert({
        user_id: authUserId,
        wallet_id: authUserWalletId,
        provider: PaymentProviders.PAYSTACK,
        amount: AMOUNT_IN_KOBO,
        previous_balance: Number(0),
        current_balance: Number(0) + Number(AMOUNT_IN_KOBO),
        type: TransactionType.CREDIT,
        status: TransactionStatus.PENDING,
        created_at: getCurrentTime(),
        updated_at: getCurrentTime(),
        uuid: transaction_id,
        transaction_reference: transaction_ref,
      });

      // Test
      const response = await request(server)
        .get(`${controllerPrefix}/fund/verify/${transaction_ref}`)
        .set('Authorization', `Bearer ${authUserToken}`);
      const { status, message, data } = response.body;

      expect(response.statusCode).toEqual(200);
      expect(status).toBeTruthy();
      expect(message).toBeDefined();
      expect(data).toBeDefined();
      expect(data.transaction_status).toBeDefined();

      const wallet = await KnexDataSource('wallets')
        .whereNull('deleted_at')
        .where('uuid', authUserWalletId)
        .first();
      const transaction = await KnexDataSource('transactions')
        .whereNull('deleted_at')
        .where('transaction_reference', transaction_ref)
        .where('user_id', authUserId)
        .first();
      expect(wallet.balance / KOBO).toEqual(1000);
      expect(transaction.status).toEqual(TransactionStatus.SUCCESSFUL);
    });
  });
  describe.skip('Withdrawal Funding', () => {});
});

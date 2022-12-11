import * as request from 'supertest';
import * as express from 'express';
import * as faker from '@withshepherd/faker';

import app from '../main';
import KnexDataSource from '../database/datasource';
import { generateUUID, getCurrentTime, Hash } from '../utils';

describe('Auth', () => {
  let server: express.Application;
  let controllerPrefix = '/auth';

  beforeAll(async () => {
    server = app;
  });

  describe('SignUp', () => {
    test('given valid registration payload, creates a user, user wallet and returns a success response', async () => {
      const email =
        faker.name.prefix() +
        Math.floor(Math.random() * 8999 + 1000).toString() +
        '@signup.com';

      const response = await request(server)
        .post(`${controllerPrefix}`)
        .send({
          first_name: faker.name.firstName(),
          last_name: faker.name.lastName(),
          email,
          password: faker.internet.password(7),
        });
      const { status, message } = response.body;

      expect(response.statusCode).toEqual(201);
      expect(status).toBeTruthy();
      expect(message).toBeDefined();
      const isUserCreated = await KnexDataSource('users')
        .whereNull('deleted_at')
        .where('email', '=', email)
        .first();
      expect(isUserCreated).toBeDefined();
      const isUserWalletCreated = await KnexDataSource('wallets')
        .whereNull('deleted_at')
        .where('user_id', isUserCreated.uuid)
        .first();
      expect(isUserWalletCreated).toBeDefined();
    });
    test('given an email in payload that already exists in users table, returns an error response', async () => {
      const email =
        faker.name.prefix() +
        Math.floor(Math.random() * 8999 + 1000).toString() +
        '@signup.com';

      await KnexDataSource('users').insert({
        first_name: faker.name.firstName(),
        last_name: faker.name.lastName(),
        email,
        password: await Hash.make(faker.internet.password(7)),
        created_at: getCurrentTime(),
        updated_at: getCurrentTime(),
        uuid: generateUUID(),
      });

      const response = await request(server)
        .post(`${controllerPrefix}`)
        .send({
          first_name: faker.name.firstName(),
          last_name: faker.name.lastName(),
          email,
          password: faker.internet.password(7),
        });
      const { status, message } = response.body;

      expect(response.statusCode).toEqual(400);
      expect(status).toBeFalsy();
      expect(message).toBeDefined();
    });
  });

  describe('LogIn', () => {
    test('given valid user login credentials, returns a success response', async () => {
      const email =
        faker.name.prefix() +
        Math.floor(Math.random() * 8999 + 1000).toString() +
        '@login.com';

      await KnexDataSource('users').insert({
        first_name: faker.name.firstName(),
        last_name: faker.name.lastName(),
        email,
        password: await Hash.make('password'),
        created_at: getCurrentTime(),
        updated_at: getCurrentTime(),
        uuid: generateUUID(),
      });

      const response = await request(server)
        .post(`${controllerPrefix}/login`)
        .send({ email, password: 'password' });
      const { status, message, data } = response.body;

      expect(response.statusCode).toEqual(200);
      expect(status).toBeTruthy();
      expect(message).toBeDefined();
      expect(data).toBeDefined();
      expect(data.auth_token).toBeDefined();
    });

    test('given an invalid credential e.g password, returns an error response', async () => {
      const email =
        faker.name.prefix() +
        Math.floor(Math.random() * 8999 + 1000).toString() +
        '@login.com';

      await KnexDataSource('users').insert({
        first_name: faker.name.firstName(),
        last_name: faker.name.lastName(),
        email,
        password: await Hash.make(faker.internet.password(7)),
        created_at: getCurrentTime(),
        updated_at: getCurrentTime(),
        uuid: generateUUID(),
      });

      const response = await request(server)
        .post(`${controllerPrefix}/login`)
        .send({ email, password: 'password001' });
      const { status, message, data } = response.body;

      expect(response.statusCode).toEqual(400);
      expect(status).toBeFalsy();
      expect(message).toBeDefined();
      expect(data).toBeUndefined();
    });

    test('given an email that is not associated with any user, returns an error response', async () => {
      const email =
        faker.name.prefix() +
        Math.floor(Math.random() * 8999 + 1000).toString() +
        '@login.com';

      const response = await request(server)
        .post(`${controllerPrefix}/login`)
        .send({ email, password: 'password' });
      const { status, message, data } = response.body;

      expect(response.statusCode).toEqual(400);
      expect(status).toBeFalsy();
      expect(message).toBeDefined();
      expect(data).toBeUndefined();
    });
  });
});

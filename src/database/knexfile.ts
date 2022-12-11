import { Env } from '../utils';
import type { Knex } from 'knex';

module.exports = {
  client: 'mysql2',
  connection: {
    host: Env.MYSQL_HOST,
    port: Env.MYSQL_PORT,
    user: Env.MYSQL_USER,
    password: Env.MYSQL_PASSWORD,
    database: Env.MYSQL_DATABASE_NAME,
    charset: 'utf8mb4',
    typeCast: (field: any, next: any) => {
      if (field.type === 'TINY' && field.length === 1) {
        const value = field.string();
        return value ? value === '1' : null;
      }
      return next();
    },
  },
  pool: {
    min: 5,
    max: 1000,
    acquireTimeoutMillis: 60 * 1000 * 4,
  },
  debug: false,
  migrations: {
    directory: './migrations',
    extension: 'ts',
  },
} as Knex.Config;

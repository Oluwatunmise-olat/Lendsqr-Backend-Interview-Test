import { Knex } from 'knex';

import { TransactionStatus, TransactionType } from '../../utils';

const tableName = 'transactions';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(tableName, (table) => {
    table.collate('utf8mb4_general_ci');
    table.uuid('uuid').unique().notNullable();
    table
      .string('user_id')
      .references('uuid')
      .inTable('users')
      .index()
      .notNullable();
    table
      .string('wallet_id')
      .references('uuid')
      .inTable('wallets')
      .index()
      .notNullable();
    table.string('session_id').nullable();
    table.string('provider').notNullable();
    table.string('transaction_reference').nullable();
    table.double('amount').notNullable().defaultTo(0);
    table.double('previous_balance').notNullable();
    table.double('current_balance').notNullable();
    table.enum('type', Object.values(TransactionType)).notNullable();
    table.enum('status', Object.values(TransactionStatus)).notNullable();
    table.text('meta').nullable();
    table.timestamp('created_at', { useTz: true }).nullable();
    table.timestamp('updated_at', { useTz: true }).nullable();
    table.timestamp('deleted_at', { useTz: true }).nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable(tableName);
}

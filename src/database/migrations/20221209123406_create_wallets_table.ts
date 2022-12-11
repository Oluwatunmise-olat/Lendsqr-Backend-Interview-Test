import { Knex } from 'knex';

const tableName = 'wallets';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(tableName, (table) => {
    table.collate('utf8mb4_general_ci');
    table.uuid('uuid').unique().notNullable().primary();
    table
      .string('user_id')
      .references('uuid')
      .inTable('users')
      .index()
      .notNullable();
    table.double('balance').notNullable().defaultTo(0);
    table.timestamp('created_at', { useTz: true }).nullable();
    table.timestamp('updated_at', { useTz: true }).nullable();
    table.timestamp('deleted_at', { useTz: true }).nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable(tableName);
}

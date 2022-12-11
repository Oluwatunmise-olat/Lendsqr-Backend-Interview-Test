import { knex } from 'knex';

const db_credentials = require('./knexfile');

export default knex(db_credentials);

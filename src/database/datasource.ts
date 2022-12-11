import { knex } from 'knex';

import * as db_credentials from './knexfile';

export default knex(db_credentials);

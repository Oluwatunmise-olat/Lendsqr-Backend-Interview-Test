const config = {
  client: 'mysql2',
  connection: {
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE_NAME,
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
};

module.exports = config;

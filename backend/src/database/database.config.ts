import 'dotenv/config';

import { DataSourceOptions } from 'typeorm';

const isDatabaseSslEnabled = process.env.DB_SSL === 'true';

export const databaseOptions: DataSourceOptions = {
  type: 'mysql',

  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 3306),

  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  ssl: isDatabaseSslEnabled
    ? {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true,
      }
    : undefined,

  entities: [__dirname + '/entities/**/*{.ts,.js}'],

  migrations: [__dirname + '/migrations/**/*{.ts,.js}'],

  migrationsTableName: 'typeorm_migrations',

  migrationsRun: false,

  synchronize: false,

  logging: process.env.NODE_ENV === 'development',
};

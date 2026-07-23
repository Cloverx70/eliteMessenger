import { DataSource } from 'typeorm';
import { databaseOptions } from './database.config';

const AppDataSource = new DataSource(databaseOptions);

export default AppDataSource;

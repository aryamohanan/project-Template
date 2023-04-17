import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { DataSourceOptions } from 'typeorm/data-source/DataSourceOptions';

const testDb: DataSourceOptions = {
  type: 'sqlite',
  name: 'default',
  database: ':memory:',
  dropSchema: true,
  synchronize: true,
  entities: ['src/entities/postgres/*.ts'],
  logging: false,
};

const defaultDb: DataSourceOptions = {
  name: 'default',
  type: 'postgres',
  host: process.env.postgresContactPoint,
  port: Number(process.env.postgresPort) || 5432,
  schema: process.env.postgresSchema,
  database: process.env.postgresDatabase,
  username: process.env.postgresDbUserName,
  password: process.env.postgresDbPassword,
  logging: false,
  synchronize: false,
  entities: ['src/entities/postgres/*.ts'],
};

export enum ConnectionTypes {
  DEFAULT = 'default',
}

export const PostgresDataSource = new DataSource(process.env.NODE_ENV === 'test' ? testDb : defaultDb);

const connections = {
  [ConnectionTypes.DEFAULT]: PostgresDataSource,
};

export const getConnection = (connectionType: ConnectionTypes): DataSource => {
  return connections[connectionType];
};

export const initDBConnections = async (): Promise<boolean> => {
  await PostgresDataSource.initialize();
  return true;
};

export const closeDBConnections = async (): Promise<boolean> => {
  await PostgresDataSource.destroy();
  return true;
};

export const restartDBConnections = async (): Promise<boolean> => {
  await closeDBConnections();
  await initDBConnections();
  return true;
};

export const isDBConnectionAvailable = (connectionType: ConnectionTypes): boolean => {
  return getConnection(connectionType).isInitialized;
};

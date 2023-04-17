import express, { Request, Response } from 'express';
import { Configurations } from '@config';
import { Routes } from './routes';
import {
  getSummary,
  getContentType,
  signalIsUp,
  createMiddleware,
} from '@promster/express';
import { Consumer } from '@services/kafka/consumer';
import { initDBConnections } from '@db';

const port = Configurations.port;
const uri = `localhost:${port}`;
const appInitialSetup = {
  environment: process.env.NODE_ENV,
  'port:': Configurations.port,
  hash: process.env.ShortHash,
};
console.log(`App Initial Setup: ${JSON.stringify(appInitialSetup)}`);

const app = express();
app.use(express.urlencoded());
app.use(createMiddleware({ app }));
app.use(express.json());
app.use('/metrics', (req: Request, res: Response) => {
  req.statusCode = 200;
  res.setHeader('Content-Type', getContentType());
  res.end(getSummary());
});

app.listen(port, () => {
  console.log(`Server ready at ${uri}`);
  return initDBConnections().then(() => {
    console.log('Created defaultDB connection');
    Routes.call(app);
    return true;
  }).catch(() => {
    Logger.error('index file', new Error('Initiating DB connection failed.'));
    throw new Error('Initiating DB connection failed.');
  });
});

const consumer = new Consumer();
consumer.do();
signalIsUp();

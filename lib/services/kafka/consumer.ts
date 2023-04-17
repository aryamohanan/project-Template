import events = require('events');
import { KafkaConsumer } from 'node-rdkafka';
import { FetchMessages, KafkaEvents } from './fetchMessage';
import { CommitMessage } from './commitMessage';
import { Configurations } from '@config';
import { KafkaMessage } from '@models/KafkaMessage';
import { Logger } from 'my-project-logger';
import { ConnectionTypes, getConnection, isDBConnectionAvailable } from '@db';

export enum MessageProcessingEvents {
  FINISHED = 'finished',
  FAILED = 'failed',
  my-project_DATABASE_OUTAGE = 'my-projectDatabaseOutage',
}
export enum KafkaBrokerMessage {
  ERROR = 'all broker connections are down',
}

export class Consumer extends events.EventEmitter {
  private kafkaConsumer: KafkaConsumer;

  private fetchMessage: FetchMessages;

  private commitMessage: CommitMessage;

  private isBrokersAvailable = true;

  private isKafkaConnected = false;

  constructor(kafkaConsumer?: KafkaConsumer) {
    super();
    this.kafkaConsumer =
      kafkaConsumer ||
      new KafkaConsumer(
        {
          ...Configurations.KafkaSettings,
          offset_commit_cb: (err, topicPartitions) => {
            if (err) {
              Logger.error('Consumer constructor', err);
            }
            Logger.info('Consumer constructor', JSON.stringify(topicPartitions));
          },
        },
        {},
      );
    this.on('brokersAvailablityCheck', () => {
      setTimeout(() => {
        this.handleKafkaBrokerDown();
      }, 1000 * 60 * Configurations.brokersAvailabilityCheckInterval);
    });

    this.fetchMessage = new FetchMessages(this.kafkaConsumer);
    this.commitMessage = new CommitMessage(this.kafkaConsumer);
    this.emit('brokersAvailablityCheck');
  }

  do() {
    return new Promise((resolve, reject) => {
      try {
        this.connectToKafka();
        this.kafkaConsumer.on('ready', () => {
          Logger.info('Consumer.do', 'Consumer is ready..');
          this.isBrokersAvailable = true;
          this.isKafkaConnected = true;
          this.kafkaConsumer.subscribe([
            Configurations.planChangeRequestsTopic,
          ]);
          this.startProcessingRequests()
            .then((result) => resolve(result))
            .catch((error) => {
              reject(error);
              throw error;
            });
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  private connectToKafka() {
    this.kafkaConsumer.connect({}, (err) => {
      if (err) {
        Logger.error(
          'Consumer.connectToKafka',
          new Error(`Error when initializing connector: ${err}`),
        );
      }
    });
    this.kafkaConsumer.on('event.error', (log) => {
      Logger.error('Consumer.connectToKafka', new Error(`Error on Kafka Consumer. ${log}`));
      if (this.kafkaConsumer) {
        this.kafkaConsumer.disconnect(() => {
          Logger.error(
            'Consumer.connectToKafka',
            new Error('Broker unavailability: Disconnected the consumer..'),
          );
        });
      }
      this.kafkaConsumer = null;
      this.isBrokersAvailable = false;
    });
  }

  private handleKafkaBrokerDown() {
    if (this.kafkaConsumer) {
      Logger.info('Consumer.handleKafkaBrokerDown', 'Active consumer available..');
      this.emit('brokersAvailablityCheck');
      if (!this.isKafkaConnected) {
        this.connectToKafka();
      }
    } else {
      Logger.info(
        'Consumer.handleKafkaBrokerDown',
        'No active consumer available. Creating new consumer..',
      );
      const consumer = new Consumer();
      consumer.do();
    }
  }

  private async startProcessingRequests() {
    this.fetchMessage.on(
      KafkaEvents.MESSAGE_RECEIVED,
      this.handleRequestReceived.bind(this),
    );
    this.fetchMessage.on(
      KafkaEvents.NO_MESSAGES,
      this.handleNoRequestsReceived.bind(this),
    );
    // <main-usecase-class>.on(MessageProcessingEvents.FINISHED, this.handleRequestProcessingFinished.bind(this));
    // <main-usecase-class>.on(MessageProcessingEvents.FAILED, this.handleRequestProcessingFailed.bind(this));
    // <main-usecase-class>.on(MessageProcessingEvents.my-project_DATABASE_OUTAGE, this.handleDBFailure.bind(this));
    return this.fetch();
  }

  private fetch() {
    if (this.isBrokersAvailable) return this.fetchMessage.do();
  }

  private handleRequestReceived(message: KafkaMessage) {
    Logger.info(
      'Consumer.handleRequestReceived',
      'Started processing request..',
    );
    //Add usecase call to handle the received message
  }

  private handleNoRequestsReceived(args) {
    setTimeout(() => {
      Logger.info(
        'Consumer.handleNoRequestsReceived',
        `Fetching from topics: ${Configurations.planChangeRequestsTopic}`,
      );
      this.fetch();
    }, Configurations.fetchWaitTime);
  }

  private async handleRequestProcessingFinished(message: KafkaMessage) {
    Logger.info(
      'Consumer.handleRequestProcessingFinished',
      'Finished processing request',
    );
    await this.commitMessage.do(message).catch((error) => {
      Logger.error(
        'Consumer.handleRequestProcessingFinished',
        new Error(`Unable to commitMessage.${error}`),
      );
    });
    Logger.info(
      'Consumer.handleRequestProcessingFinished',
      'Fetching new requests..',
    );
    this.fetch();
  }

  private async handleRequestProcessingFailed(message: KafkaMessage) {
    await this.commitMessage.do(message).catch((error) => {
      Logger.error(
        'Consumer.handleRequestProcessingFailed',
        new Error(`Unable to commitMessage.${error}`),
      );
    });
    Logger.info(
      'Consumer.handleRequestProcessingFailed',
      'Fetching new requests..',
    );
    this.fetch();
  }

  private async handleDBFailure(message: KafkaMessage) {
    await this.commitMessage.seek(message);
    const connection = getConnection(ConnectionTypes.DEFAULT);
    await connection.destroy();
    this.stopIntermittently();
  }

  private stopIntermittently() {
    Logger.info(
      'Consumer.stopIntermittently',
      'ERR-DB-UNAVAILABLE: Kafka fetch stopped temporarily due to db issue',
    );
    setTimeout(async () => {
      if (isDBConnectionAvailable(ConnectionTypes.DEFAULT)) {
        Logger.info('Consumer.stopIntermittently', 'fetching new requests after outage..');
        this.fetch();
      } else {
        const connection = getConnection(ConnectionTypes.DEFAULT);
        await connection.initialize();
        this.stopIntermittently();
      }
    }, Configurations.dbRetryInterval * 1000);
  }
}

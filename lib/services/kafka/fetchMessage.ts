import { KafkaMessage } from '@models/KafkaMessage';
import events = require('events');
import { KafkaConsumer } from 'node-rdkafka';

export enum KafkaEvents {
  MESSAGE_RECEIVED = 'messageReceived',
  NO_MESSAGES = 'noMessages',
  ERROR = 'error',
}

export class FetchMessages extends events.EventEmitter {
  private Consumer: KafkaConsumer;

  constructor(consumer: KafkaConsumer) {
    super();
    this.Consumer = consumer;
    this.Consumer.on('data', (data) => {
      const message = KafkaMessage.fromRawMessage(data);
      this.emit(KafkaEvents.MESSAGE_RECEIVED, message);
    });
  }

  do() {
    return new Promise((resolve) => {
      this.Consumer.consume(1, (err, message) => {
        if (!message || message.length === 0) {
          this.emit(KafkaEvents.NO_MESSAGES);
        } else {
          resolve(message[0]);
        }
      });
    });
  }
}

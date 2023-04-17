import { Message } from 'node-rdkafka';

export class KafkaMessage {
  raw: Message;

  value: string;

  request: any;

  constructor() {}

  get key() {
    return this.request.requestId.toString();
  }

  get keyBuffer(): Buffer {
    return Buffer.from(this.request.requestId.toString());
  }

  get valueBuffer(): Buffer {
    return Buffer.from(JSON.stringify(this.request));
  }

  get toJSON() {
    return {
      value: this.value,
    };
  }

  static fromRawMessage(raw: Message) {
    const instance = new KafkaMessage();
    instance.raw = raw;
    instance.value = raw.value.toString();
    return instance;
  }
}

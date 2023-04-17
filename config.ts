interface KafkaConfigs {
  [index: string]: number | string | boolean;
}

export class Configurations {
  public static get port() {
    return process.env.port || 9000;
  }

  public static get Kafkamy-projectConsumerSettings(): KafkaConfigs {
    return {
      'group.id': process.env.kafkaGroupId,
      'metadata.broker.list': `${process.env.kafkaBrokerList}:${process.env.kafkaBrokerPort}`,
      'enable.auto.commit': false,
    };
  }

  public static get KafkaConsumerSettings(): KafkaConfigs {
    if (this.connectInternalToK8Kafka) {
      return this.KafkaK8ConsumerSettings;
    }
    return this.Kafkamy-projectConsumerSettings;
  }

  public static get KafkaK8ConsumerSettings(): KafkaConfigs {
    return {
      'group.id': process.env.kafkaGroupId,
      'enable.auto.commit': false,
      ...this.KafkaK8Settings,
    };
  }

  public static get KafkaK8Settings(): KafkaConfigs {
    return {
      'metadata.broker.list': process.env.kafkaK8Broker,
      'security.protocol': 'ssl',
      'ssl.certificate.location': '/etc/kafka-secrets/kafka/kafkak8.crt',
      'ssl.key.location': '/etc/kafka-secrets/kafka/kafkak8.key',
      'ssl.ca.location': '/etc/kafka-secrets/kafka/ca.pem',
    };
  }

  public static get connectInternalToK8Kafka() {
    return process.env.connectInternalToK8Kafka === 'true';
  }

  public static get KafkaSettings(): KafkaConfigs {
    if (this.connectInternalToK8Kafka) {
      return this.KafkaK8ConsumerSettings;
    }
    return this.Kafkamy-projectConsumerSettings;
  }

  public static get brokersAvailabilityCheckInterval() {
    return parseInt(process.env.brokersAvailabilityCheckInterval);
  }

  public static get fetchWaitTime() {
    return 1000;
  }

  public static get dbRetryInterval() {
    return parseInt(process.env.dbRetryInterval);
  }

  public static get planChangeRequestsTopic() {
    return process.env.planChangeRequestsTopic;
  }
}

import { LibrdKafkaError } from 'node-rdkafka';
import { Status } from '@models/Enums/Status';

export class HealthCheckItem {
  name: string;

  status: string;

  details: string | LibrdKafkaError;

  properties: JSON;

  descriptionHref: string;

  constructor(jsonstring: string) {
    try {
      const jsonValue = JSON.parse(jsonstring);
      this.name = jsonValue.name;
      this.status = jsonValue.status;
      this.details = jsonValue.details;
      this.properties = jsonValue.properties;
      this.descriptionHref = jsonValue.descriptionHref;
    } catch (error: any) {
      console.warn(`Failed to parse Health Check Item. ${error.stack}`);
    }
  }

  get isValid(): boolean {
    return !!(this.name && this.status);
  }

  public setHealthStatus = (
    status: Status,
    details: string | LibrdKafkaError,
  ) => {
    this.status = Status[status];
    this.details = details;
  };
}

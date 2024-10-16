import { Kafka, Producer, Message } from "kafkajs";

export class KafkaProducer {
  private producer: Producer;

  constructor(brokers: string[], clientId: string) {
    const kafka = new Kafka({
      clientId: clientId,
      brokers: brokers,
    });

    this.producer = kafka.producer();
  }

  async connect(): Promise<void> {
    await this.producer.connect();
    console.log("Connected to Kafka");
  }

  async disconnect(): Promise<void> {
    await this.producer.disconnect();
    console.log("Disconnected from Kafka");
  }

  async sendMessage(topic: string, message: any): Promise<void> {
    const kafkaMessage: Message = {
      value: JSON.stringify(message),
    };

    await this.producer.send({
      topic: topic,
      messages: [kafkaMessage],
    });
  }
}

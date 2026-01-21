
import mqtt from 'mqtt';
import { MQTTAmbulanceLocation, MQTTSignalCommand } from '../types';

const BROKER_URL = 'wss://mr-connection-jof7dh84sc5.messaging.solace.cloud:8443';
const USERNAME = 'solace-cloud-client';
const PASSWORD = '868it98pctmon9t2ddih0vv3g9';

export class MQTTService {
  private client: mqtt.MqttClient | null = null;
  private onMessage: (topic: string, data: any) => void;
  private onConnect: () => void;
  private onDisconnect: () => void;

  constructor(callbacks: {
    onMessage: (topic: string, data: any) => void;
    onConnect: () => void;
    onDisconnect: () => void;
  }) {
    this.onMessage = callbacks.onMessage;
    this.onConnect = callbacks.onConnect;
    this.onDisconnect = callbacks.onDisconnect;
  }

  connect() {
    if (this.client) return;

    this.client = mqtt.connect(BROKER_URL, {
      username: USERNAME,
      password: PASSWORD,
      clientId: 'sam_dashboard_' + Math.random().toString(16).substring(2, 8),
    });

    this.client.on('connect', () => {
      console.log('Connected to Solace MQTT');
      this.client?.subscribe('sam/signals/command/#');
      this.client?.subscribe('sam/ambulance/location');
      this.onConnect();
    });

    this.client.on('message', (topic, message) => {
      try {
        const data = JSON.parse(message.toString());
        this.onMessage(topic, data);
      } catch (e) {
        console.error('MQTT JSON parse error', e);
      }
    });

    this.client.on('close', () => {
      this.onDisconnect();
    });

    this.client.on('error', (err) => {
      console.error('MQTT error', err);
    });
  }

  disconnect() {
    this.client?.end();
    this.client = null;
  }
}

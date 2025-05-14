// global.d.ts
import * as Paho from 'paho-mqtt';

declare global {
  var mqttClient: Paho.Client | null;
  var userId: string | null;
  var username: string | null
}

// This export is needed to make this a module
export {};
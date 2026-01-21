
export type CongestionLevel = 'low' | 'moderate' | 'heavy' | 'jammed';
export type SignalCommand = 'GREEN' | 'HOLD_GREEN' | 'EXTEND_GREEN' | 'EXTEND' | 'HOLD';

export interface LatLon {
  lat: number;
  lon: number;
}

export interface RouteSegment {
  street: string;
  start: [number, number];
  end: [number, number];
  lengthMeters: number;
  expectedTimeSeconds: number;
  arrivalTimestamp: number;
  congestion?: CongestionLevel;
  confidence?: number;
}

export interface AmbulanceSimulation {
  route: {
    totalDistanceMeters: number;
    totalTimeSeconds: number;
    segments: RouteSegment[];
  };
  polyline: [number, number][];
  startTimestamp: number;
}

export interface TrafficSignalAction {
  traffic_light_id: number | string;
  lat: number;
  lon: number;
  command: SignalCommand;
  send_at_unix: number;
  duration_seconds: number;
  status: 'PENDING' | 'SENT' | 'ACTIVE' | 'EXPIRED';
}

export interface AgentLog {
  id: string;
  agent: 'Orchestrator' | 'Ambulance' | 'TrafficBrain' | 'TrafficSignal' | 'MQTT';
  message: string;
  timestamp: Date;
  type: 'info' | 'success' | 'warning' | 'error' | 'mesh';
}

export enum SimulationState {
  IDLE = 'IDLE',
  ORCHESTRATING = 'ORCHESTRATING',
  ROUTING = 'ROUTING',
  ANALYZING = 'ANALYZING',
  PREEMPTING = 'PREEMPTING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  LIVE = 'LIVE'
}

export interface MQTTAmbulanceLocation {
  lat: number;
  lon: number;
  heading: number;
  speed: number;
  source: string;
}

export interface MQTTSignalCommand {
  intersectionId: number | string;
  command: SignalCommand;
  targetPosition: [number, number];
  durationSeconds: number;
  source: string;
}

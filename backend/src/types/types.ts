export interface HeartbeatData {
  device: string;
  counter: number;
  uptime: number;
  ip: string;
  rssi: number;
  timestamp: number;
}

export interface HeartbeatRecord {
  id: string;
  timestamp: string;
  data: HeartbeatData;
  status: 'online' | 'offline';
}

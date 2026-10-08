export type SafetyStatus = 'SAFE' | 'CAUTION' | 'UNSAFE' | 'UNVERIFIED';

export type SyncStatus = 'synced' | 'pending' | 'failed';

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface Device {
  id: string;
  name: string;
  macAddress: string;
  rssi: number;
  batteryLevel: number;
  isConnected: boolean;
  firmwareVersion: string;
  lastConnectedAt?: string;
}

export interface SensorReading {
  pH: number;
  tds: number; // in ppm
  conductivity: number; // in µS/cm
  turbidity: number; // in NTU
  temperature: number; // in °C
  timestamp: string;
  overallStatus: 'SAFE' | 'CAUTION' | 'UNSAFE';
}

export interface WaterTest {
  id: string;
  deviceId: string;
  userId: string;
  sourceId?: string;
  sourceName?: string;
  latitude: number;
  longitude: number;
  locationName: string;
  timestamp: string;
  pH: number;
  tds: number;
  conductivity: number;
  turbidity: number;
  temperature: number;
  safetyStatus: 'SAFE' | 'CAUTION' | 'UNSAFE';
  syncStatus: SyncStatus;
  notes?: string;
}

export interface WaterSource {
  id: string;
  name: string;
  locationName: string;
  latitude: number;
  longitude: number;
  safetyStatus: SafetyStatus;
  latestPh: number;
  latestTds: number;
  latestConductivity: number;
  latestTurbidity: number;
  latestTemperature: number;
  lastTestedAt: string;
  imageUrl?: string;
  testCount: number;
  description?: string;
}

export interface SyncQueueItem {
  id: string;
  action: 'CREATE_TEST' | 'UPDATE_SOURCE';
  payload: any;
  retryCount: number;
  createdAt: string;
  lastError?: string;
}

export interface ParameterThresholds {
  min: number;
  max: number;
  optimalMin: number;
  optimalMax: number;
  cautionMin?: number;
  cautionMax?: number;
  unit: string;
}

export const PARAMETER_CONFIG: Record<string, {
  name: string;
  unit: string;
  safeRange: string;
  safeMin: number;
  safeMax: number;
  cautionMin?: number;
  cautionMax?: number;
  description: string;
}> = {
  pH: {
    name: 'pH Level',
    unit: '',
    safeRange: '6.5 – 8.5',
    safeMin: 6.5,
    safeMax: 8.5,
    cautionMin: 6.0,
    cautionMax: 9.0,
    description: 'Measures hydrogen-ion concentration and acidity/alkalinity balance.',
  },
  tds: {
    name: 'Total Dissolved Solids (TDS)',
    unit: 'ppm',
    safeRange: '< 300 ppm',
    safeMin: 0,
    safeMax: 300,
    cautionMin: 300,
    cautionMax: 500,
    description: 'Combined content of all inorganic and organic substances in water.',
  },
  conductivity: {
    name: 'Electrical Conductivity (EC)',
    unit: 'µS/cm',
    safeRange: '100 – 500 µS/cm',
    safeMin: 100,
    safeMax: 500,
    cautionMin: 500,
    cautionMax: 800,
    description: 'Ability of water to conduct an electric current, directly tied to dissolved ions.',
  },
  turbidity: {
    name: 'Turbidity',
    unit: 'NTU',
    safeRange: '< 1.0 NTU',
    safeMin: 0,
    safeMax: 1.0,
    cautionMin: 1.0,
    cautionMax: 5.0,
    description: 'Measure of relative water clarity caused by suspended particulate matter.',
  },
  temperature: {
    name: 'Temperature',
    unit: '°C',
    safeRange: '10.0 – 25.0 °C',
    safeMin: 10.0,
    safeMax: 25.0,
    cautionMin: 25.0,
    cautionMax: 35.0,
    description: 'Water temperature affects dissolved oxygen, chemical kinetics, and palatability.',
  },
};

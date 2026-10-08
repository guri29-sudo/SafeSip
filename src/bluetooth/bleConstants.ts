/**
 * SafeSip ESP32 Bluetooth Low Energy (BLE) GATT Architecture
 * Standardized UUIDs matching ESP32 FreeRTOS firmware
 */
export const SAFESIP_BLE_CONFIG = {
  // Primary SafeSip Service UUID
  SERVICE_UUID: '4fafc201-1fb5-459e-8fcc-c5c9c331914b',

  // Sensor Stream Characteristic (Notify / Read): Transmits JSON telemetry
  // Payload: { ph: 7.4, tds: 125, ec: 310, turb: 0.8, temp: 22.5, status: "SAFE", progress: 68 }
  SENSOR_DATA_CHAR_UUID: 'beb5483e-36e1-4688-b7f5-ea07361b26a8',

  // Bottle Control / Command Characteristic (Write): Initiates test or calibration
  // Commands: { "cmd": "START_TEST" }, { "cmd": "STOP_TEST" }, { "cmd": "CALIBRATE_PH" }
  COMMAND_CHAR_UUID: '1c95d5e3-d8f7-413a-bf3d-7a2e5d7be87e',

  // Standard Battery Service UUID
  BATTERY_SERVICE_UUID: '0000180f-0000-1000-8000-00805f9b34fb',
  BATTERY_LEVEL_CHAR_UUID: '00002a19-0000-1000-8000-00805f9b34fb',

  // Device Information Service
  DEVICE_INFO_SERVICE_UUID: '0000180a-0000-1000-8000-00805f9b34fb',
  FIRMWARE_REVISION_CHAR_UUID: '00002a26-0000-1000-8000-00805f9b34fb',
};

/**
 * SafeSip Smart Bottle ESP32 Firmware
 * Framework: Arduino ESP32 + FreeRTOS (Dual Core)
 * Sensors:
 *   1. Analog pH Probe (E-201-C) -> GPIO 34 (ADC1_CH6)
 *   2. Gravity Analog TDS Sensor -> GPIO 35 (ADC1_CH7)
 *   3. Electrical Conductivity Probe -> Computed & calibrated from TDS/Temp
 *   4. Optical Turbidity Sensor (TS-300B) -> GPIO 32 (ADC1_CH4)
 *   5. DS18B20 1-Wire Digital Temperature Sensor -> GPIO 4
 *
 * Architecture:
 *   - Core 0: Real-time sensor sampling, rolling averaging, and FreeRTOS tasks
 *   - Core 1: BLE GATT Server, JSON serialization, and classification logic
 */

#include <Arduino.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <ArduinoJson.h>

// BLE GATT UUIDs matching SafeSip Mobile App
#define SERVICE_UUID           "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define SENSOR_CHAR_UUID       "beb5483e-36e1-4688-b7f5-ea07361b26a8"
#define COMMAND_CHAR_UUID      "1c95d5e3-d8f7-413a-bf3d-7a2e5d7be87e"
#define BATTERY_CHAR_UUID      "00002a19-0000-1000-8000-00805f9b34fb"

// Pin Definitions
#define PIN_PH_SENSOR          34
#define PIN_TDS_SENSOR         35
#define PIN_TURBIDITY_SENSOR   32
#define PIN_ONE_WIRE_BUS       4
#define PIN_STATUS_LED         2

// FreeRTOS Task Handles & Queues
TaskHandle_t SensorTaskHandle;
TaskHandle_t BleTaskHandle;

OneWire oneWire(PIN_ONE_WIRE_BUS);
DallasTemperature tempSensors(&oneWire);

BLEServer* pServer = nullptr;
BLECharacteristic* pSensorCharacteristic = nullptr;
BLECharacteristic* pBatteryCharacteristic = nullptr;
bool deviceConnected = false;
bool oldDeviceConnected = false;
bool isTestingActive = false;

// Global Sensor Measurements Structure
struct WaterQualityReading {
  float pH;
  int tds;
  int conductivity;
  float turbidity;
  float temperature;
  char safetyStatus[10]; // "SAFE", "CAUTION", "UNSAFE"
  int progress;
};

WaterQualityReading currentReading = {7.4, 125, 310, 0.8, 22.5, "SAFE", 0};

// Local Physicochemical Composite Classification Engine
void evaluateWaterSafety(WaterQualityReading &reading) {
  int violationScore = 0; // 0 = Safe, 1 = Caution, >=2 or severe = Unsafe

  // 1. pH Evaluation (Standard Safe Range: 6.5 - 8.5)
  if (reading.pH < 6.0 || reading.pH > 9.0) {
    violationScore += 3; // Severe
  } else if (reading.pH < 6.5 || reading.pH > 8.5) {
    violationScore += 1;
  }

  // 2. TDS Evaluation (ppm) (Safe < 300, Caution 300-500, Unsafe > 500)
  if (reading.tds > 500) {
    violationScore += 2;
  } else if (reading.tds > 300) {
    violationScore += 1;
  }

  // 3. Turbidity Evaluation (NTU) (Safe < 1.0, Caution 1.0-5.0, Unsafe > 5.0)
  if (reading.turbidity > 5.0) {
    violationScore += 3;
  } else if (reading.turbidity > 1.0) {
    violationScore += 1;
  }

  // 4. Conductivity (µS/cm)
  if (reading.conductivity > 800) {
    violationScore += 2;
  } else if (reading.conductivity > 500) {
    violationScore += 1;
  }

  if (violationScore == 0) {
    strcpy(reading.safetyStatus, "SAFE");
  } else if (violationScore <= 2) {
    strcpy(reading.safetyStatus, "CAUTION");
  } else {
    strcpy(reading.safetyStatus, "UNSAFE");
  }
}

// BLE Server Callbacks
class SafeSipServerCallbacks: public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) {
      deviceConnected = true;
      digitalWrite(PIN_STATUS_LED, HIGH);
    };

    void onDisconnect(BLEServer* pServer) {
      deviceConnected = false;
      digitalWrite(PIN_STATUS_LED, LOW);
    }
};

// BLE Command Characteristic Callback
class CommandCallbacks: public BLECharacteristicCallbacks {
    void onWrite(BLECharacteristic *pCharacteristic) {
      std::string rxValue = pCharacteristic->getValue();
      if (rxValue.length() > 0) {
        if (rxValue.find("START_TEST") != std::string::npos) {
          isTestingActive = true;
          currentReading.progress = 0;
        } else if (rxValue.find("STOP_TEST") != std::string::npos) {
          isTestingActive = false;
          currentReading.progress = 0;
        }
      }
    }
};

// FreeRTOS Sensor Acquisition Task (Core 0)
void SensorTask(void * pvParameters) {
  for(;;) {
    if (isTestingActive) {
      // Step 1: Read Temperature
      tempSensors.requestTemperatures();
      float tempC = tempSensors.getTempCByIndex(0);
      if (tempC < -50 || tempC > 100) tempC = 22.5; // fallback
      currentReading.temperature = tempC;

      // Step 2: Read Analog pH
      int phAdc = analogRead(PIN_PH_SENSOR);
      float voltagePh = phAdc * (3.3 / 4095.0);
      currentReading.pH = 7.0 + ((2.5 - voltagePh) / 0.18); // Calibrated slope
      if (currentReading.pH < 0) currentReading.pH = 0;
      if (currentReading.pH > 14) currentReading.pH = 14;

      // Step 3: Read TDS & Compute Electrical Conductivity (EC)
      int tdsAdc = analogRead(PIN_TDS_SENSOR);
      float voltageTds = tdsAdc * (3.3 / 4095.0);
      float compensationCoefficient = 1.0 + 0.02 * (tempC - 25.0);
      float compensationVoltage = voltageTds / compensationCoefficient;
      currentReading.tds = (int)((133.42 * pow(compensationVoltage, 3) - 255.86 * pow(compensationVoltage, 2) + 857.39 * compensationVoltage) * 0.5);
      if (currentReading.tds < 0) currentReading.tds = 0;
      currentReading.conductivity = (int)(currentReading.tds * 2.0); // Approx EC in µS/cm

      // Step 4: Read Turbidity
      int turbAdc = analogRead(PIN_TURBIDITY_SENSOR);
      float voltageTurb = turbAdc * (3.3 / 4095.0);
      // Turbidity transfer function (NTU)
      float ntu = -1120.4 * pow(voltageTurb, 2) + 5742.3 * voltageTurb - 4352.9;
      if (ntu < 0) ntu = 0.5;
      currentReading.turbidity = ntu;

      // Increment test progress
      currentReading.progress += 5;
      if (currentReading.progress >= 100) {
        currentReading.progress = 100;
        isTestingActive = false; // Test complete
      }

      // Local ESP32 composite classification
      evaluateWaterSafety(currentReading);

      // Transmit JSON Notification to Mobile Phone App via BLE
      if (deviceConnected && pSensorCharacteristic) {
        StaticJsonDocument<256> doc;
        doc["ph"] = serialized(String(currentReading.pH, 1));
        doc["tds"] = currentReading.tds;
        doc["ec"] = currentReading.conductivity;
        doc["turb"] = serialized(String(currentReading.turbidity, 1));
        doc["temp"] = serialized(String(currentReading.temperature, 1));
        doc["status"] = currentReading.safetyStatus;
        doc["progress"] = currentReading.progress;

        char output[256];
        serializeJson(doc, output);
        pSensorCharacteristic->setValue(output);
        pSensorCharacteristic->notify();
      }
    }

    vTaskDelay(pdMS_TO_TICKS(500));
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_STATUS_LED, OUTPUT);
  tempSensors.begin();

  // Initialize BLE Device
  BLEDevice::init("SafeSip_0012");
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new SafeSipServerCallbacks());

  // Create SafeSip Primary Service
  BLEService *pService = pServer->createService(SERVICE_UUID);

  // Sensor Telemetry Characteristic (Notify)
  pSensorCharacteristic = pService->createCharacteristic(
                      SENSOR_CHAR_UUID,
                      BLECharacteristic::PROPERTY_READ |
                      BLECharacteristic::PROPERTY_NOTIFY
                    );
  pSensorCharacteristic->addDescriptor(new BLE2902());

  // Command Characteristic (Write)
  BLECharacteristic *pCmdChar = pService->createCharacteristic(
                      COMMAND_CHAR_UUID,
                      BLECharacteristic::PROPERTY_WRITE
                    );
  pCmdChar->setCallbacks(new CommandCallbacks());

  // Start BLE Service & Advertising
  pService->start();
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  pAdvertising->setMinPreferred(0x06);
  BLEDevice::startAdvertising();

  // Create FreeRTOS task on Core 0 for deterministic sensor polling
  xTaskCreatePinnedToCore(
    SensorTask,
    "SensorTask",
    4096,
    NULL,
    1,
    &SensorTaskHandle,
    0
  );
}

void loop() {
  // Re-start advertising when client disconnects
  if (!deviceConnected && oldDeviceConnected) {
    delay(500);
    pServer->startAdvertising();
    oldDeviceConnected = deviceConnected;
  }
  if (deviceConnected && !oldDeviceConnected) {
    oldDeviceConnected = deviceConnected;
  }
  delay(100);
}

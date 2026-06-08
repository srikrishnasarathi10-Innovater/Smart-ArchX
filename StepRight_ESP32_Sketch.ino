#include "BluetoothSerial.h"

// =========================================================================
// STEP RIGHT - HIGH SENSITIVITY ESP32 TELEMETRY SKETCH
// Supports: Standard USB Serial (115200 Baud) AND Classic Bluetooth SPP!
// Bluetooth Broadcast Name: "StepRight-FootScan"
// =========================================================================

// Initialize Bluetooth Serial
BluetoothSerial SerialBT;

// Define ESP32 Analog Input Pins (ADC1 pins are safest when using Bluetooth)
const int FSR_TOE_PIN   = 32; // FSR 1 (Toe / Inner Ball) - GPIO 32
const int FSR_BALL_PIN  = 33; // FSR 2 (Ball / Arch Core) - GPIO 33
const int FSR_ARCH_PIN  = 34; // FSR 3 (Arch Outer Edge)  - GPIO 34
const int FSR_HEEL_PIN  = 35; // FSR 4 (Heel Support)    - GPIO 35

// Calibration offsets to capture the lightest touches (0-4095 range)
const int SENSITIVITY_THRESHOLD = 15; // Filter noise below this analog value

void setup() {
  // 1. Initialize physical USB Serial (matching the website baud rate)
  Serial.begin(115200);
  
  // 2. Initialize built-in ESP32 Bluetooth
  SerialBT.begin("StepRight-FootScan"); 
  
  Serial.println("=================================================");
  Serial.println("👣 STEP RIGHT: ESP32 FSR Telemetry System Ready!");
  Serial.println("🔗 USB Baud Rate: 115200");
  Serial.println("📶 Bluetooth Broadcaster: 'StepRight-FootScan'");
  Serial.println("=================================================");
}

void loop() {
  // Read raw 12-bit analog values (0 to 4095) from ESP32 ADCs
  int rawToe   = analogRead(FSR_TOE_PIN);
  int rawBall  = analogRead(FSR_BALL_PIN);
  int rawArch  = analogRead(FSR_ARCH_PIN);
  int rawHeel  = analogRead(FSR_HEEL_PIN);

  // Apply noise filtering
  if (rawToe  < SENSITIVITY_THRESHOLD) rawToe  = 0;
  if (rawBall < SENSITIVITY_THRESHOLD) rawBall = 0;
  if (rawArch < SENSITIVITY_THRESHOLD) rawArch = 0;
  if (rawHeel < SENSITIVITY_THRESHOLD) rawHeel = 0;

  // Convert 12-bit ADC (0-4095) to 10-bit scale (0-1023) for the website heatmap
  // We use floating-point math to preserve precision on light touches
  int toeVal  = (int)((rawToe  / 4095.0) * 1023.0);
  int ballVal = (int)((rawBall / 4095.0) * 1023.0);
  int archVal = (int)((rawArch / 4095.0) * 1023.0);
  int heelVal = (int)((rawHeel / 4095.0) * 1023.0);

  // Boost low-end sensitivity so light finger touches register clearly
  if (toeVal  > 0 && toeVal  < 100) toeVal  = map(toeVal,  1, 99, 80, 200);
  if (ballVal > 0 && ballVal < 100) ballVal = map(ballVal, 1, 99, 80, 200);
  if (archVal > 0 && archVal < 100) archVal = map(archVal, 1, 99, 80, 200);
  if (heelVal > 0 && heelVal < 100) heelVal = map(heelVal, 1, 99, 80, 200);

  // Format the output string. Our website's upgraded parser will read this:
  // "FSR:Toe,Ball,Arch,Heel"
  String telemetryData = "FSR:" + String(toeVal) + "," + String(ballVal) + "," + String(archVal) + "," + String(heelVal);

  // Send data over USB Serial (for wired connection)
  Serial.println(telemetryData);

  // Send data over Bluetooth Serial (for wireless connection)
  if (SerialBT.hasClient()) {
    SerialBT.println(telemetryData);
  }

  // Stream at 100ms intervals (10Hz) for responsive real-time graphing
  delay(100);
}

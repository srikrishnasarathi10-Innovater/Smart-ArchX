#include <SoftwareSerial.h>

// =========================================================================
// STEP RIGHT - HIGH SENSITIVITY ARDUINO UNO / NANO / MEGA SKETCH
// Supports: Standard USB Serial AND External Bluetooth Module (HC-05 / HC-06)!
//
// Wiring for Bluetooth Module (HC-05/HC-06):
//   - Module RX pin ➔ Arduino Pin D11 (TX) - *Use a voltage divider (1k & 2k resistors) since HC-05 RX is 3.3V
//   - Module TX pin ➔ Arduino Pin D10 (RX)
//   - Module VCC    ➔ Arduino 5V
//   - Module GND    ➔ Arduino GND
// =========================================================================

// Initialize SoftwareSerial for Bluetooth (RX on Pin 10, TX on Pin 11)
SoftwareSerial Bluetooth(10, 11); 

// Define Arduino Analog Input Pins
const int FSR_TOE_PIN   = A0; // FSR 1 (Toe / Inner Ball) - Analog A0
const int FSR_BALL_PIN  = A1; // FSR 2 (Ball / Arch Core) - Analog A1
const int FSR_ARCH_PIN  = A2; // FSR 3 (Arch Outer Edge)  - Analog A2
const int FSR_HEEL_PIN  = A3; // FSR 4 (Heel Support)    - Analog A3

// Noise threshold to filter empty raw sensor values (0-1023 scale)
const int SENSITIVITY_THRESHOLD = 5; 

void setup() {
  // 1. Initialize physical USB Serial (9600 or 115200. We will use 9600 as it is standard for Uno)
  Serial.begin(9600);
  
  // 2. Initialize Bluetooth module (HC-05/HC-06 default baud rate is 9600)
  Bluetooth.begin(9600);
  
  Serial.println("=================================================");
  Serial.println("👣 STEP RIGHT: Arduino FSR Telemetry System Ready!");
  Serial.println("🔗 USB Serial: 9600 Baud");
  Serial.println("📶 Bluetooth Module (HC-05/HC-06): 9600 Baud");
  Serial.println("=================================================");
}

void loop() {
  // Read raw 10-bit analog values (0 to 1023) directly from Arduino analog pins
  int toeVal  = analogRead(FSR_TOE_PIN);
  int ballVal = analogRead(FSR_BALL_PIN);
  int archVal = analogRead(FSR_ARCH_PIN);
  int heelVal = analogRead(FSR_HEEL_PIN);

  // Apply noise filtering
  if (toeVal  < SENSITIVITY_THRESHOLD) toeVal  = 0;
  if (ballVal < SENSITIVITY_THRESHOLD) ballVal = 0;
  if (archVal < SENSITIVITY_THRESHOLD) archVal = 0;
  if (heelVal < SENSITIVITY_THRESHOLD) heelVal = 0;

  // Boost low-end sensitivity so extremely light finger/hand touches register clearly
  if (toeVal  > 0 && toeVal  < 100) toeVal  = map(toeVal,  1, 99, 80, 200);
  if (ballVal > 0 && ballVal < 100) ballVal = map(ballVal, 1, 99, 80, 200);
  if (archVal > 0 && archVal < 100) archVal = map(archVal, 1, 99, 80, 200);
  if (heelVal > 0 && heelVal < 100) heelVal = map(heelVal, 1, 99, 80, 200);

  // Format the output string in the "FSR:Toe,Ball,Arch,Heel" packet format
  String telemetryData = "FSR:" + String(toeVal) + "," + String(ballVal) + "," + String(archVal) + "," + String(heelVal);

  // Send telemetry packets over USB Serial
  Serial.println(telemetryData);

  // Send telemetry packets wirelessly over Bluetooth (HC-05/HC-06)
  Bluetooth.println(telemetryData);

  // Stream at 100ms intervals (10Hz) for highly responsive real-time graphics
  delay(100);
}

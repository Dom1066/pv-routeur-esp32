#ifndef OTA_FUNCTIONS
#define OTA_FUNCTIONS

#include <Arduino.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <HTTPUpdate.h>
#include <WiFi.h>

#define FIRMWARE_VERSION 20260510
#define OTA_VERSION_URL  "http://ota.apper-solaire.org/firmware/version-routeur.json"

void doUpdate(String url);

void checkForUpdate() {
  WiFiClient client;
  HTTPClient http;

  http.begin(client, OTA_VERSION_URL);
  http.addHeader("User-Agent", "ESP32-OTA");

  int code = http.GET();
  if (code != HTTP_CODE_OK) {
    Serial.printf("[OTA] Erreur HTTP: %d\n", code);
    http.end();
    return;
  }

  JsonDocument doc;
  DeserializationError err = deserializeJson(doc, http.getString());
  http.end();

  if (err) {
    Serial.println("[OTA] JSON invalide");
    logging.Set_log_init("[OTA] JSON invalide\n", true);
    return;
  }

  long serverVersion = String(doc["version"].as<const char*>()).toInt();
  //String binUrl = doc["url"].as<String>();

  Serial.printf("[OTA] Local: %ld | Serveur: %ld\n", (long)FIRMWARE_VERSION, serverVersion);

  if (serverVersion > FIRMWARE_VERSION) {
    Serial.printf("[OTA] Mise à jour → %s\n", OTA_FIRMWARE_URL);
    doUpdate(OTA_FIRMWARE_URL);
  } else {
    Serial.println("[OTA] Firmware à jour.");
  }
}

void doUpdate(String url) {
  WiFiClient client;
  int avancement = 0;

  httpUpdate.onProgress([&avancement](int cur, int total) {
    Serial.printf("[OTA] %d / %d bytes\r", cur, total);
    int newPourcentage = (cur * 100) / total;
    if (newPourcentage != avancement) {
      avancement = newPourcentage;
      logging.Set_log_init(String("[OTA] " + String(avancement) + "%\n").c_str(), false);
    }
  });

  t_httpUpdate_return ret = httpUpdate.update(client, url);

  switch (ret) {
    case HTTP_UPDATE_OK:
      Serial.println("\n[OTA] Succès, redémarrage...");
      logging.Set_log_init("[OTA] Succès, redémarrage...\n", true);
      break;
    case HTTP_UPDATE_FAILED:
      Serial.printf("\n[OTA] Échec: %s\n", httpUpdate.getLastErrorString().c_str());
      logging.Set_log_init("[OTA] Échec \n", true);
      break;
    case HTTP_UPDATE_NO_UPDATES:
      Serial.println("\n[OTA] Pas de mise à jour.");
      logging.Set_log_init("[OTA] Pas de mise à jour.\n", true);
      break;
  }
}

#endif
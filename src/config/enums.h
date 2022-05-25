#ifndef ENUMS
#define ENUMS

#include <Arduino.h>

// The state in which the device can be. This mainly affects what
// is drawn on the display.
enum DEVICE_STATE {
  CONNECTING_WIFI,
  CONNECTING_AWS,
  FETCHING_TIME,
  UP,
};

// Place to store all the variables that need to be displayed.
// All other functions should update these!
struct DisplayValues {
  double watt;
  double amps;
  int8_t wifi_strength;
  DEVICE_STATE currentState;
  String IP;
  String time;
  bool injection; 
  int dimmer;
  int security; 
  int change;
  bool task;
  bool porteuse; 
  bool screenstate; 
  String temperature;
  int Fronius_conso; 
  int Fronius_prod; 
};

struct Config {
  char hostname[15];
  int port;
  char apiKey[64];
  bool UseDomoticz;
  bool UseJeedom;
  int IDX;
  char otapassword[64];
  int delta;
  int deltaneg;
  int cosphi;
  int readtime;
  int cycle;
  bool sending;
  bool autonome;
  char dimmer[15];
  bool dimmerlocal;
  float facteur;
  int num_fuse;
  bool mqtt;
  char mqttserver[15];
  int IDXdimmer;
  int tmax;
  int resistance;
  bool polarity; 
  char Publish[100];
  int  ScreenTime;
};

struct Configwifi {
  char SID[32];
  char passwd[64];
};

struct Configmodule {
  char hostname[15];
  bool enphase_present; 
  bool Fronius_present;
  char envoy[1];
};

#if DEBUG == true
  #define serial_print(x)  Serial.print (x)
  #define serial_println(x)  Serial.println (x)
#else
  #define serial_print(x)
  #define serial_println(x)
#endif

#endif
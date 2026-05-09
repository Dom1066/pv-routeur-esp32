#ifndef WEBFUNCTIONS
#define WEBFUNCTIONS

//***********************************
//************* LIBRAIRIES ESP
//***********************************
#ifdef ESP32
  #include <AsyncTCP.h>
  #include <esp_task_wdt.h>
#elif defined(ESP8266)
  #include <ESPAsyncTCP.h>
#endif
#include <ESPAsyncWebServer.h>

//***********************************
//************* PROGRAMME PV ROUTER
//***********************************
#include "appweb.h"
#include "functions/minuteur.h"
#ifdef WEBSOCKET_CLIENT
  #include "functions/websocket.h"
#endif

//***********************************
//************* Variables externes
//***********************************
extern DisplayValues gDisplayValues;
extern Configmodule configmodule; 
extern Configwifi configwifi; 
extern Logs logging;
extern Programme programme; 
extern Programme programme_relay1; 
extern Programme programme_relay2; 
extern Programme programme_marche_forcee;
extern Programme programme_batterie;
extern Memory task_mem; 
extern SemaphoreHandle_t mutex; 


//***********************************
//************* Déclaration de fonctions
//***********************************
extern bool boost();

//***********************************
//************* Variables locales
//***********************************
String inputMessage;
AsyncWebServer server(80);
String getMinuteur(const Programme& minuteur);
String getMinuteur();
String return_Memory();
bool checkAuth(AsyncWebServerRequest *request);

////***********************************
//************* checkAuth()
//***********************************

bool checkAuth(AsyncWebServerRequest *request) {
    if (!config.auth_enabled) return true;
    if (request->authenticate("admin", config.auth_pass.c_str())) return true;
    request->requestAuthentication("PV Dimmer");
    return false;
  }

//***********************************
//************* notfound()
//***********************************
void notFound(AsyncWebServerRequest *request) {
  request->send(404, "text/plain", "Not found");
}

//***********************************
//************* compress_html()
//***********************************
void compress_html(AsyncWebServerRequest *request,String filefs , String format ) {
  AsyncWebServerResponse *response = request->beginResponse(SPIFFS, filefs, format);
  response->addHeader("Content-Encoding", "gzip");
  response->addHeader("Cache-Control", "max-age=604800");
  yield();
  request->send(response);
}

//***********************************
//************* serveur_response()
//***********************************
void serveur_response(AsyncWebServerRequest *request, String response) {
  yield();
  request->send(200, "text/plain", response.c_str());
}

//***********************************
//************* call_pages()
//***********************************
void call_pages() {
/*  if (AP) {
      server.on("/",HTTP_GET, [](AsyncWebServerRequest *request) {
        if(SPIFFS.exists("/index.html.gz")){
          compress_html(request,"/index-ap.html.gz", "text/html");
        }
        else {request->send(200, "text/html", "<html><body>Filesystem is not present. <a href='https://ota.apper-solaire.org/firmware/spiffs-ttgo.bin'>download it here</a> <br>and after  <a href='/update'>upload on the ESP here </a></body></html>" ); }
      });

      server.on("/config.html", HTTP_GET, [](AsyncWebServerRequest *request){
        if(SPIFFS.exists("/config.html.gz")){
          compress_html(request,"/config-ap.html.gz", "text/html");
        }
        else {
          serveur_response(request, SPIFFSNO);
        }
      });
    }
    else */ {
      server.on("/",HTTP_GET, [](AsyncWebServerRequest *request) {
        if(SPIFFS.exists("/index.html.gz") ){
//          #ifndef LIGHT_FIRMWARE
            compress_html(request,"/index.html.gz", "text/html");
//          #else
//            compress_html(request,"/index-light.html.gz", "text/html");
//          #endif
        }
        else {
          serveur_response(request, SPIFFSNO);
        }
      });
/*
      server.on("/config.html", HTTP_GET, [](AsyncWebServerRequest *request){
        if(SPIFFS.exists("/config.html.gz")){
          #ifdef LIGHT_FIRMWARE
              compress_html(request,"/config-light.html.gz", "text/html");
          #elif ESP32D1MINI_FIRMWARE
            compress_html(request,"/config-dimmer.html.gz", "text/html");
          #else
            compress_html(request,"/config.html.gz", "text/html");
          #endif
        }
        else {
          serveur_response(request, SPIFFSNO);
        }
      }); */
    }

    // pages  statiques
    // Define static files array with URL paths and file paths
    const char* staticFiles[][2] = {
      {"/mqtt.json", "/mqtt.json"},
      {"/wifi.json", "/wifi.json"},
      {"/enphase.json", "/enphase.json"},
      {"/icons.svg", "/icons.svg"},
      {"/js/app.js", "/js/app.js"},
      {"/js/i18n.js", "/js/i18n.js"},
      {"/css/style.css", "/css/style.css"}

    };
  
    for (const auto& file : staticFiles) {
      if (strstr(file[0], ".json")) {
        server.serveStatic(file[0], SPIFFS, file[1]); // les json ne sont pas en cache
      } 
      else {
        server.serveStatic(file[0], SPIFFS, file[1]).setCacheControl("max-age=31536000"); // par contre les autres fichiers sont en cache
      }
    }

      /// sécurité : sécurisation pour ne pas voir le mdp de sécurité dans le fichier config.json
    server.on("/config.json", HTTP_GET, [](AsyncWebServerRequest *request){
      if (!checkAuth(request)) return;
      // envoi du fichier de config sans le mot de passe de sécurité
      if(SPIFFS.exists("/config.json")){
        AsyncWebServerResponse *response = request->beginResponse(SPIFFS, "/config.json", "application/json");
        response->addHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        response->addHeader("Pragma", "no-cache");
        response->addHeader("Expires", "0");
        request->send(response);
      }
      else {
        serveur_response(request, SPIFFSNO);
      } 
    }); 

    server.on("/state", HTTP_GET, [](AsyncWebServerRequest *request){
      request->send(200, "application/json", getState().c_str());
    });

    server.on("/stateshort", HTTP_GET, [](AsyncWebServerRequest *request){
      request->send(200, "application/json", getState_short().c_str());
    });

    server.on("/statefull", HTTP_GET, [](AsyncWebServerRequest *request){
      request->send(200, "application/json", getStateFull().c_str());
    });
    
    server.on("/config", HTTP_GET, [](AsyncWebServerRequest *request){
      request->send(200, "application/json", getconfig().c_str());

    });

    // ajout de la commande de boost 2h   
    server.on("/boost", HTTP_ANY, [] (AsyncWebServerRequest *request) {
      boost();    
      request->send(200, "application/json",  getMinuteur(programme_marche_forcee));
    });


    /// beta ? 
    server.on("/cosphi", HTTP_GET, [](AsyncWebServerRequest *request){
      serveur_response(request, getcosphi());
    });
    
    ///////////////
    //// wifi
    ///////////////
    server.on("/getwifi", HTTP_ANY, [] (AsyncWebServerRequest *request) {
      serveur_response(request, getwifi());
    });

    server.on("/ping", HTTP_GET, [](AsyncWebServerRequest *request) {
      request->send(200, "text/plain", "pong");
    });

    ///////////////
    //// Enphase
    ///////////////
    server.on("/getenvoy", HTTP_ANY, [] (AsyncWebServerRequest *request) {
      serveur_response(request, getenvoy());
    });

    ///////////////
    ///// MQTT
    ///////////////
    server.on("/getmqtt", HTTP_ANY, [] (AsyncWebServerRequest *request) {
      request->send(200, "application/json",  getmqtt().c_str()); 
    });

    ///////////////
    ///// LOGS
    ///////////////
    server.on("/log.txt", HTTP_ANY, [] (AsyncWebServerRequest *request) {
      request->send(SPIFFS, "/log.txt", "text/plain"); 
    });
    
    /// il serait bien que /getmqtt et getwifi soit directement en processing de l'appel de la page 

    ///////////////
    //// logs ////
    ///////////////
    server.on("/cs", HTTP_ANY, [](AsyncWebServerRequest *request){
      logging.Set_log_init("}1");
      serveur_response(request, logging.Get_log_init().c_str());
      // reinit de logging.log_init 
      logging.reset_log_init(); 
    });


    server.on("/reboot", HTTP_ANY, [](AsyncWebServerRequest *request){
      if (!checkAuth(request)) return;
      #ifndef LIGHT_FIRMWARE
        const int bufferSize = 150; //  Taille du tampon pour stocker le message
        char raison[bufferSize]; // NOSONAR
        getLocalTime( &timeinfo );
        snprintf(raison, bufferSize, "reboot manuel: %s", asctime(&timeinfo) ); 

          client.publish("memory/Routeur", raison, true);
      #endif
      request->redirect("/");
      yield();
      delay(1000);
      yield();
      delay(1000);
      yield();
      config.restart = true;
      ESP.restart();
    });
    
    // reset de la detection dallas précédente 
    server.on("/resetdallas", HTTP_ANY, [](AsyncWebServerRequest *request){
      config.dallas_present = false; 
      config.saveConfiguration();
      request->redirect("/");
 
    });

    server.onNotFound(notFound);

        // ── GET /getauth ─────────────────────────────────────────────────
    server.on("/getauth", HTTP_GET, [](AsyncWebServerRequest *request) {
      if (!checkAuth(request)) return;
      String json = "{\"auth_enabled\":" + String(config.auth_enabled ? "true" : "false") + "}";
      request->send(200, "application/json", json);
    });

    // ── POST /setauth ────────────────────────────────────────────────
    server.on("/setauth", HTTP_POST, [](AsyncWebServerRequest *request) {
      if (!checkAuth(request)) return;

      auto has = [&](const char* n) {
        return request->hasParam(n, true) || request->hasParam(n);
      };
      auto val = [&](const char* n) -> String {
        if (request->hasParam(n, true)) return request->getParam(n, true)->value();
        if (request->hasParam(n))       return request->getParam(n)->value();
        return "";
      };

      if (has("auth_enabled")) {
        config.auth_enabled = (val("auth_enabled") == "1");
      }
      if (has("auth_pass") && val("auth_pass").length() > 0) {
        config.auth_pass = val("auth_pass");
      }
      
      config.saveConfiguration().c_str();
      
      request->send(200, "application/json", "{\"ok\":true}");
    });

    /////////////////////////
    ////// mise à jour parametre d'envoie vers domoticz et récupération des modifications de configurations
    /////////////////////////
    server.on("/get", HTTP_ANY, [] (AsyncWebServerRequest *request) {

      if (!checkAuth(request)) return;
      // Ajouter ces deux lambdas en tête du handler
      auto has = [&](const char* n) {
        return request->hasParam(n, true) || request->hasParam(n);
      };
      auto val = [&](const char* n) -> String {
        if (request->hasParam(n, true)) return request->getParam(n, true)->value();
        if (request->hasParam(n))       return request->getParam(n)->value();
        return "";
      };

      ///  doc  /get?disengage_dimmer=on
      if (has(PARAM_INPUT_1)) {
        const char* engagedimmer;
        if(val(PARAM_INPUT_1) == "on") {
          engagedimmer = "dimmer disengaged";
          gDisplayValues.dimmer_disengaged = true;
        }
        else {
          engagedimmer = "dimmer engaged";
          gDisplayValues.dimmer_disengaged = false;
        }
        request->send(200, "text/html", engagedimmer);
      }
                              
      // doc /get?cycle=x
      if (has(PARAM_INPUT_save)) { Serial.println(F("Saving configuration..."));
        logging.Set_log_init(config.saveConfiguration().c_str(),true); // configuration sauvegardée
      }
                              
      if (has(PARAM_INPUT_2)) { 
        config.cycle = val(PARAM_INPUT_2).toInt(); 
      }
      if (has(PARAM_INPUT_3)) { 
        config.readtime = val(PARAM_INPUT_3).toInt();
      }
      if (has(PARAM_INPUT_4)) { 
        config.cosphi = val(PARAM_INPUT_4).toInt();  
      }
      if (has(PARAM_INPUT_dimmer)) { 
        val(PARAM_INPUT_dimmer).toCharArray(config.dimmer,64); 
        #ifdef WEBSOCKET_CLIENT
        closeWebSocket(); setupWebSocket(); 
        #endif
      }

      if (has(PARAM_INPUT_server)) { val(PARAM_INPUT_server).toCharArray(config.hostname,16);  }
      if (has(PARAM_INPUT_delta)) { config.delta_init = val(PARAM_INPUT_delta).toInt(); config.batterie_active = false ; config.delta = config.delta_init; } // sauvegarde de la valeur initiale de delta
      if (has(PARAM_INPUT_deltaneg)) { config.deltaneg_init = val(PARAM_INPUT_deltaneg).toInt(); config.batterie_active = false; config.deltaneg = config.deltaneg_init; } // sauvegarde de la valeur initiale de deltaneg
      if (has(PARAM_INPUT_port)) { config.port = val(PARAM_INPUT_port).toInt(); }
      if (has(PARAM_INPUT_IDX)) { config.IDX = val(PARAM_INPUT_IDX).toInt();}
      if (has(PARAM_INPUT_IDXdimmer)) { config.IDXdimmer = val(PARAM_INPUT_IDXdimmer).toInt();}
      if (has("idxdallas")) { config.IDXdallas = val("idxdallas").toInt();}
      if (has(PARAM_INPUT_API)) { val(PARAM_INPUT_API).toCharArray(config.apiKey,64);}
      if (has(PARAM_INPUT_dimmer_power)) {gDisplayValues.dimmer = val( PARAM_INPUT_dimmer_power).toInt(); gDisplayValues.change = 1 ;  } 
      if (has(PARAM_INPUT_facteur)) { config.facteur = val(PARAM_INPUT_facteur).toFloat();}
      if (has(PARAM_INPUT_tmax)) { config.tmax = val(PARAM_INPUT_tmax).toInt();}
      if (has("resistance")) { config.charge1 = val("resistance").toInt(); config.calcul_charge(); }
      if (has("resistance2")) { config.charge2 = val("resistance2").toInt(); config.calcul_charge();}
      if (has("resistance3")) { config.charge3 = val("resistance3").toInt(); config.calcul_charge();}
      if (has("screentime")) { config.ScreenTime = val("screentime").toInt(); } 
      if (has("voltage")) { config.voltage = val("voltage").toInt();}
      if (has("offset")) { config.offset = val("offset").toInt();}
      if (has("trigger")) { config.trigger = val("trigger").toInt();}
      if (has("mintemp")) { config.tmin = val("mintemp").toInt();}

      
      /// @brief  wifi
      bool wifimodif=false ; 
      if (has("ssid")) { 
        val("ssid").toCharArray(configwifi.SID,64); wifimodif=true; 
      }
      if (has("password")) { 
        char password[64];  
        val("password").toCharArray(password,64);
        if (strcmp(password,SECURITEPASS) != 0) {  ///sécurisation du mot de passe pas en clair     
          val("password").toCharArray(configwifi.passwd,64); 
        }      

        wifimodif=true; 
      }
      if (has("no_ap")) { 
        config.NO_AP = false;
        String no_ap_value = val("no_ap");
        config.NO_AP = (no_ap_value == "true" || no_ap_value == "1");
        Serial.println("No AP mode : " + no_ap_value);
        config.saveConfiguration();
      }
      
      if (wifimodif) { 
        configwifi.sauve_wifi(); 
      }


      // Shelly
      if (has("EM")) { 
        val("EM").toCharArray(config.topic_Shelly,100);  
        #ifdef NORMAL_FIRMWARE
          if (strcmp(config.topic_Shelly,"none") != 0 )  
          client.subscribe(config.topic_Shelly);
          else client.unsubscribe(config.topic_Shelly);
        #endif
      }


      // enphase
      bool enphasemodif=false ; 
      if (has("envoyserver")) { val("envoyserver").toCharArray(configmodule.hostname,16); enphasemodif=true; }
      if (has("envoyport")) { val("envoyport").toCharArray(configmodule.port,5); enphasemodif=true; }
      if (has("envmodele")) { val("envmodele").toCharArray(configmodule.envoy,2);  enphasemodif=true;}
      if (has("envversion")) { val("envversion").toCharArray(configmodule.version,2); enphasemodif=true; }
      if (has("envtoken")) { val("envtoken").toCharArray(configmodule.token,512); enphasemodif=true; }
      if (enphasemodif) { 
        saveenphase(enphase_conf, configmodule);
      }

      //// MQTT
      if (has(PARAM_INPUT_mqttserver)) { val(PARAM_INPUT_mqttserver).toCharArray(config.mqttserver,16);  }
      if (has(PARAM_INPUT_publish)) { 
        val(PARAM_INPUT_publish).toCharArray(config.Publish,100); 
        logging.Set_log_init(config.saveConfiguration().c_str(),true); // configuration sauvegardée   
      }
      if (has("mqttuser")) { val("mqttuser").toCharArray(configmqtt.username,50);  }
      if (has("mqttport")) { config.mqttport = val("mqttport").toInt();}
      if (has("mqttpassword")) {
        char password[65];  
        val("mqttpassword").toCharArray(password,65);
        //if (strcmp(password,SECURITEPASS) != 0) {  ///sécurisation du mot de passe pas en clair     
          val("mqttpassword").toCharArray(configmqtt.password,65); 
        //}
        logging.Set_log_init(configmqtt.savemqtt().c_str(),true); // configuration sauvegardée
      }

      //// Dimmer local
      if (has("Fusiblelocal")) { config.localfuse = val("Fusiblelocal").toInt();}
      if (has("maxtemp")) { config.tmax = val("maxtemp").toInt();}

      //reset
      if (has(PARAM_INPUT_reset)) {
        Serial.println("Resetting ESP");  
        ESP.restart();
      }

      //// for check boxs in web pages  
      if (has("servermode")) { inputMessage = val(PARAM_INPUT_servermode);
      if (getServermode(inputMessage)) {
        logging.Set_log_init(config.saveConfiguration().c_str(),true); // configuration sauvegardée
        logging.Set_log_init(configmqtt.savemqtt().c_str(),true); // configuration sauvegardée
      }
        request->send(200, "text/html", getconfig().c_str());
      }

      /// relays : 0 : off , 1 : on , other : switch 
      if (has("relay1")) { int relay = val("relay1").toInt(); 
        if ( relay == 0 ) { digitalWrite(RELAY1 , HIGH); } // correction bug de démarrage en GPIO 0
        else if ( relay == 1 ) { digitalWrite(RELAY1 , LOW); } // correction bug de démarrage en GPIO 0
        else if (relay == 2) { digitalWrite(RELAY1, !digitalRead(RELAY1)); }
        int relaystate = digitalRead(RELAY1); 
        char str[8];// NOSONAR
        itoa( relaystate, str, 10 );
        request->send(200, "text/html", str );
      }
      if (has("relay2")) { int relay = val("relay2").toInt(); 
        if ( relay == 0) { digitalWrite(RELAY2 , LOW); }
        else if ( relay == 1 ) { digitalWrite(RELAY2 , HIGH); } 
        else if (relay == 2) { digitalWrite(RELAY2, !digitalRead(RELAY2)); }
        int relaystate = digitalRead(RELAY2); 
        char str[8];// NOSONAR
        itoa( relaystate, str, 10 );
        request->send(200, "text/html", str );
      }
      if (has("SCT_13")) { config.SCT_13 = val("SCT_13").toInt();  
        /// la valeur de la sonde doit être entre 20 et 100 ( )
        if (config.SCT_13 < 20) config.SCT_13 = 20;
        if (config.SCT_13 > 100) config.SCT_13 = 100;
      }

      //// minuteur 
      if (has("heure_demarrage")) { val("heure_demarrage").toCharArray(programme.heure_demarrage,6);  }
      if (has("heure_arret")) { val("heure_arret").toCharArray(programme.heure_arret,6);  }
      if (has("temperature")) { programme.temperature = val("temperature").toInt();  programme.saveProgramme(); }
      serveur_response(request,  getconfig());
      }); 

      server.on("/getminuteur", HTTP_ANY, [] (AsyncWebServerRequest *request) {
        esp_task_wdt_reset();
        if (request->hasParam("dimmer")) { request->send(200, "application/json",  getMinuteur(programme));  }
        else if (request->hasParam("relay1")) { request->send(200, "application/json",  getMinuteur(programme_relay1)); }
        else if (request->hasParam("relay2")) { request->send(200, "application/json",  getMinuteur(programme_relay2)); }
        else if (request->hasParam("batterie")) { request->send(200, "application/json",  getMinuteur(programme_batterie)); }
        else { request->send(200, "application/json",  getMinuteur());  }
    }); // /get

    server.on("/setminuteur", HTTP_ANY, [] (AsyncWebServerRequest *request) {
//      String name; 
      if (request->hasParam("dimmer")) { 
              if (request->hasParam("heure_demarrage")) { request->getParam("heure_demarrage")->value().toCharArray(programme.heure_demarrage,6);  }
              if (request->hasParam("heure_arret")) { request->getParam("heure_arret")->value().toCharArray(programme.heure_arret,6);  }
              if (request->hasParam("temperature")) { programme.temperature = request->getParam("temperature")->value().toInt();   }
              if (request->hasParam("puissance")) { programme.puissance = request->getParam("puissance")->value().toInt(); }
              programme.saveProgramme();
        request->send(200, "application/json",  getMinuteur(programme));  
      }
      if (request->hasParam("batterie")) { 
              if (request->hasParam("heure_demarrage")) { request->getParam("heure_demarrage")->value().toCharArray(programme_batterie.heure_demarrage,6);  }
              if (request->hasParam("heure_arret")) { request->getParam("heure_arret")->value().toCharArray(programme_batterie.heure_arret,6);  }
              if (request->hasParam("temperature")) { programme_batterie.temperature = request->getParam("temperature")->value().toInt();   }
              if (request->hasParam("puissance")) { programme_batterie.puissance = request->getParam("puissance")->value().toInt(); }
              programme_batterie.saveProgramme();
        request->send(200, "application/json",  getMinuteur(programme_batterie));  
      }
      if (request->hasParam("relay1")) { 
            if (request->hasParam("heure_demarrage")) { request->getParam("heure_demarrage")->value().toCharArray(programme_relay1.heure_demarrage,6);  }
            if (request->hasParam("heure_arret")) { request->getParam("heure_arret")->value().toCharArray(programme_relay1.heure_arret,6);  }
            if (request->hasParam("temperature")) { programme_relay1.temperature = request->getParam("temperature")->value().toInt();  }
            programme_relay1.saveProgramme(); 
      request->send(200, "application/json",  getMinuteur(programme_relay1)); 
      }
      if (request->hasParam("relay2")) { 
              if (request->hasParam("heure_demarrage")) { request->getParam("heure_demarrage")->value().toCharArray(programme_relay2.heure_demarrage,6);  }
              if (request->hasParam("heure_arret")) { request->getParam("heure_arret")->value().toCharArray(programme_relay2.heure_arret,6);  }
              if (request->hasParam("temperature")) { programme_relay2.temperature = request->getParam("temperature")->value().toInt();  }
              programme_relay2.saveProgramme(); 
        request->send(200, "application/json",  getMinuteur(programme_relay2)); 
      }
      else { request->send(200, "application/json",  getMinuteur()); }
    });

    server.on("/getmemory", HTTP_ANY, [] (AsyncWebServerRequest *request) {
      request->send(200, "application/json",  return_Memory());
    });
  } // call_pages()

//***********************************
//************* getMinuteur(const Programme& minuteur)
//***********************************
String getMinuteur(const Programme& minuteur) {
  JsonDocument doc;
    if (millis() < 5000) {
        Serial.println("System not ready yet");
        esp_task_wdt_reset();
        return "false";
  }
  yield();
  struct tm timeinfo;  // Déclaration locale
  if (!gDisplayValues.Shelly_local) {
        if (!getLocalTime(&timeinfo)) {
          Serial.println("Failed to obtain time");
          esp_task_wdt_reset();
          return "false";
      }
  }
  yield();
  doc["heure_demarrage"] = minuteur.heure_demarrage;
  doc["heure_arret"] = minuteur.heure_arret;
  doc["temperature"] = minuteur.temperature;
  doc["heure"] = timeinfo.tm_hour;
  doc["minute"] = timeinfo.tm_min;
  doc["puissance"] = minuteur.puissance;

  String retour;
  serializeJson(doc, retour);
  return retour;
}

//***********************************
//************* getMinuteur()
//***********************************
String getMinuteur() {
  //if (gDisplayValues.Shelly_local) { return "{}"; } // si Shelly local, pas de minuteur
  JsonDocument doc;
      if (millis() < 5000) {
        Serial.println("System not ready yet");
        esp_task_wdt_reset();
        return "false";
  }
  yield();
  
  struct tm timeinfo;  // Déclaration locale
      if (!getLocalTime(&timeinfo)) {
        Serial.println("Failed to obtain time");
        esp_task_wdt_reset();
        return "false";
    }
  yield();
  doc["heure"] = timeinfo.tm_hour;
  doc["minute"] = timeinfo.tm_min;

  String retour;
  serializeJson(doc, retour);
  return retour;
}

//***********************************
//************* return_Memory()
//***********************************
String return_Memory() {
  JsonDocument doc;
  doc["task_GetDImmerTemp"] = task_mem.task_GetDImmerTemp;
  doc["task_dallas_read"] = task_mem.task_dallas_read;
  doc["task_keepWiFiAlive2"] = task_mem.task_keepWiFiAlive2;
  doc["task_measure_electricity"] = task_mem.task_measure_electricity;
  doc["task_send_mqtt"] = task_mem.task_send_mqtt;
  doc["task_serial_read_task"] = task_mem.task_serial_read_task;
  doc["task_switchDisplay"] = task_mem.task_switchDisplay;
  doc["task_updateDimmer"] = task_mem.task_updateDimmer;
  doc["task_updateDisplay"] = task_mem.task_updateDisplay;
  doc["task_loop"] = task_mem.task_loop;

  String retour;
  serializeJson(doc, retour);
  return retour;
}
#endif

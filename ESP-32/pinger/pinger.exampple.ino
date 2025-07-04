#include <WiFi.h>
#include <PubSubClient.h>

// ⚠️ MODIFICA QUESTI VALORI ⚠️
const char* ssid = "ssid";
const char* password = "pwd";
const char* mqtt_server = "0.0.0.0"; 

const int mqtt_port = 1883;
const char* mqtt_topic = "zona/campagna/heartbeat";

WiFiClient espClient;
PubSubClient client(espClient);

unsigned long lastMsg = 0;
int heartbeatCounter = 0;

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("=== Test ESP32 + Mosquitto ===");
  
  // Connessione WiFi
  Serial.print("Connessione a WiFi: ");
  Serial.println(ssid);
  
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("");
  Serial.println("WiFi connesso!");
  Serial.print("IP ESP32: ");
  Serial.println(WiFi.localIP());
  
  // Setup MQTT
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();
  
  // Invia heartbeat ogni 10 secondi
  unsigned long now = millis();
  if (now - lastMsg > 10000) {
    lastMsg = now;
    
    heartbeatCounter++;
    
    // Crea messaggio JSON
    String message = "{";
    message += "\"device\":\"ESP32\",";
    message += "\"counter\":" + String(heartbeatCounter) + ",";
    message += "\"uptime\":" + String(millis()) + ",";
    message += "\"ip\":\"" + WiFi.localIP().toString() + "\",";
    message += "\"rssi\":" + String(WiFi.RSSI()) + ",";
    message += "\"timestamp\":" + String(now);
    message += "}";
    
    Serial.print("📡 Invio heartbeat #");
    Serial.print(heartbeatCounter);
    Serial.print(": ");
    Serial.println(message);
    
    client.publish(mqtt_topic, message.c_str());
  }
}

void callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Messaggio ricevuto [");
  Serial.print(topic);
  Serial.print("]: ");
  
  for (int i = 0; i < length; i++) {
    Serial.print((char)payload[i]);
  }
  Serial.println();
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Tentativo connessione MQTT...");
    
    String clientId = "ESP32PowerMonitor-";
    clientId += String(random(0xffff), HEX);
    
    if (client.connect(clientId.c_str())) {
      Serial.println(" connesso!");
      Serial.print("Client ID: ");
      Serial.println(clientId);
      
      // Sottoscrivi a un topic di test (opzionale)
      client.subscribe("casa/power/commands");
      
    } else {
      Serial.print(" fallito, rc=");
      Serial.print(client.state());
      Serial.println(" riprovo tra 5 secondi");
      delay(5000);
    }
  }
}

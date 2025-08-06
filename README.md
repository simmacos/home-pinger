
# Home Pinger 🏠

A real-time power monitoring tool for homes, with Telegram notifications for outages.

## ⚡ Stack

- ESP32
- Node.js & Express
- MQTT (Mosquitto)
- Socket.IO
- Telegram Bot
- JSON db (for logs)
- Docker

## 🚀 How it works

- ESP32 sends a ping every 10 seconds via MQTT.
- Node.js backend listens, logs pings in a JSON DB.
- Frontend displays live status via Socket.IO.
- If no ping for 20 minutes, the server sends a Telegram alert.

## 🛠 Quick Start

```
git clone https://github.com/simmacos/home-pinger.git
cd home-pinger
docker-compose up -d
```
Configure ESP32 to send MQTT pings to your broker.


---

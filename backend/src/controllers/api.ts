// src/controllers/api.ts
import { Router } from 'express';
import { MqttService } from '../services/mqtt';

export function createApiRoutes(mqttService: MqttService) {
  const router = Router();

  // Health check con MQTT
  router.get('/health', (req, res) => {
    const mqttStatus = mqttService.getStatus();
    
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      memory: process.memoryUsage(),
      mqtt: mqttStatus
    });
  });

  // Status generale del sistema
  router.get('/status', (req, res) => {
    const mqttStatus = mqttService.getStatus();
    const stats = mqttService.getStats();
    
    res.json({
      power: mqttStatus.connected ? 'online' : 'offline',
      lastHeartbeat: mqttStatus.lastHeartbeat,
      uptime: process.uptime(),
      mqtt: mqttStatus,
      stats: stats,
      timestamp: new Date().toISOString()
    });
  });

  // Endpoint MQTT specifici
  router.get('/mqtt/status', (req, res) => {
    res.json(mqttService.getStatus());
  });

  router.get('/mqtt/stats', (req, res) => {
    res.json(mqttService.getStats());
  });

  // Heartbeats (placeholder per ora)
  router.get('/heartbeats', (req, res) => {
    const limit = parseInt(req.query.limit as string) || 50;
    
    res.json({
      heartbeats: [], // TODO: Dal database quando l'avremo
      total: 0,
      limit,
      timestamp: new Date().toISOString()
    });
  });

  // Dati uptime per grafico a barre
  router.get('/uptime', (req, res) => {
    // TODO: Calcolare dai dati reali
    const mockData = [98.5, 95.2, 100, 87.3, 92.1, 99.8, 100];
    
    res.json({
      daily: mockData,
      labels: ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'],
      period: 'week',
      average: mockData.reduce((a, b) => a + b) / mockData.length,
      timestamp: new Date().toISOString()
    });
  });

  // Statistiche generali
  router.get('/stats', (req, res) => {
    const mqttStats = mqttService.getStats();
    
    res.json({
      totalHeartbeats: 0, // TODO: Dal database
      currentSession: {
        startTime: new Date().toISOString(),
        heartbeatCount: 0,
        uptime: mqttStats.timeSinceLastHeartbeat || 0,
        lastHeartbeat: mqttStats.lastHeartbeat
      },
      last24h: {
        heartbeats: 0,
        downtime: 0,
        uptime: mqttStats.connected ? 100 : 0
      },
      mqtt: mqttStats,
      timestamp: new Date().toISOString()
    });
  });

  return router;
}

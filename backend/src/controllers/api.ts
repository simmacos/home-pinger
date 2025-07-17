// src/controllers/api.ts
import { Router } from 'express';
import { MqttService } from '../services/mqtt';
import { DatabaseService } from '../services/database';


export function createApiRoutes(mqttService: MqttService, db: DatabaseService) {
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

  router.get('/status', async (req, res) => {
    try {
      const mqttStatus = mqttService.getStatus();
      const dbStats = await db.getStats();
      const lastHeartbeat = await db.getLastHeartbeat();
      
      res.json({
        power: mqttStatus.connected ? 'online' : 'offline',
        lastHeartbeat: lastHeartbeat?.timestamp || null,
        lastHeartbeatData: lastHeartbeat?.data || null,
        mqtt: mqttStatus,
        database: dbStats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
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


  
  router.get('/chart/uptime/:period', async (req, res) => {
    try {
      const period = req.params.period;
      const days = period === 'month' ? 30 : 7;
      
      const uptimeData = await db.getUptimeData(days);
      
      res.json({
        success: true,
        data: uptimeData
      });
    } catch (error) {
      console.error('Chart endpoint error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch chart data' 
      });
    }
  });

   

  return router;
}

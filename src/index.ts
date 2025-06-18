import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { webhookRoutes } from './routes/webhook.js';
import { healthRoutes } from './routes/health.js';
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Máximo 100 requests por ventana
  message: 'Demasiadas solicitudes desde esta IP',
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware de seguridad
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}));
app.use(limiter);

// Middleware para parsear JSON (con límite de tamaño)
app.use('/webhook', express.raw({ type: 'application/json', limit: '10mb' }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Rutas
app.use('/health', healthRoutes);
app.use('/webhook', webhookRoutes);

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    message: 'Notion Webhook Server',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// Manejo de errores
app.use(errorHandler);

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.originalUrl
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  logger.info(`🚀 Servidor iniciado en puerto ${PORT}`);
  logger.info(`📍 Entorno: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔗 Webhook endpoint: /webhook/notion`);
});

// Manejo de errores no capturados
process.on('uncaughtException', (err) => {
  logger.error('Error no capturado:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Promesa rechazada no manejada:', { reason, promise });
  process.exit(1);
});

export default app; 
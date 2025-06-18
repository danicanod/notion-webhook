import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const healthData = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100,
    },
    checks: {
      notion_token: !!process.env.NOTION_TOKEN,
      webhook_secret: !!process.env.WEBHOOK_SECRET,
      day_database_id: !!process.env.DAY_DATABASE_ID,
    }
  };

  res.json(healthData);
}));

router.get('/ping', asyncHandler(async (req: Request, res: Response) => {
  res.json({ message: 'pong', timestamp: new Date().toISOString() });
}));

export { router as healthRoutes }; 
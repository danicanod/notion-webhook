import { Router, Request, Response } from 'express';
import { WebhookController } from '../controllers/webhook.controller.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();
const webhookController = new WebhookController();

// Main Notion webhook endpoint
router.post('/notion', asyncHandler(async (req: Request, res: Response) => {
  await webhookController.handleNotionWebhook(req, res);
}));

// Webhook status endpoint
router.get('/status', asyncHandler(async (req: Request, res: Response) => {
  await webhookController.getWebhookStatus(req, res);
}));

// Test webhook endpoint
router.post('/test', asyncHandler(async (req: Request, res: Response) => {
  await webhookController.handleTestWebhook(req, res);
}));

export { router as webhookRoutes }; 
import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { Client } from '@notionhq/client';
import { asyncHandler, createError } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';

const router = Router();

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

interface WebhookPayload {
  object: string;
  id: string;
  created_time: string;
  last_edited_time: string;
  [key: string]: any;
}

// Verificar la firma del webhook
const verifyWebhookSignature = (body: Buffer, signature: string): boolean => {
  if (!process.env.WEBHOOK_SECRET) {
    logger.warn('WEBHOOK_SECRET no configurado, saltando verificación');
    return true;
  }

  const expectedSignature = crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET)
    .update(body)
    .digest('hex');

  const providedSignature = signature.replace('sha256=', '');
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'hex'),
    Buffer.from(providedSignature, 'hex')
  );
};

// Endpoint principal de webhook
router.post('/notion', asyncHandler(async (req: Request, res: Response) => {
  const signature = req.headers['notion-webhook-signature'] as string;
  
  if (!signature) {
    throw createError('Firma de webhook requerida', 401);
  }

  // Verificar firma
  if (!verifyWebhookSignature(req.body, signature)) {
    throw createError('Firma de webhook inválida', 401);
  }

  // Parsear el payload
  const payload: WebhookPayload = JSON.parse(req.body.toString());
  
  logger.info('Webhook recibido:', {
    object: payload.object,
    id: payload.id,
    created_time: payload.created_time,
    last_edited_time: payload.last_edited_time
  });

  try {
    // Procesar el webhook según el tipo
    await processWebhook(payload);
    
    res.status(200).json({
      success: true,
      message: 'Webhook procesado correctamente',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Error procesando webhook:', error);
    throw createError('Error procesando webhook', 500);
  }
}));

// Procesar diferentes tipos de webhooks
async function processWebhook(payload: WebhookPayload): Promise<void> {
  const { object, id } = payload;
  
  logger.info(`Procesando webhook para ${object} (ID: ${id})`);
  
  switch (object) {
    case 'page':
      await processPageWebhook(payload);
      break;
    case 'database':
      await processDatabaseWebhook(payload);
      break;
    default:
      logger.warn(`Tipo de objeto no manejado: ${object}`);
  }
}

// Procesar webhooks de páginas
async function processPageWebhook(payload: WebhookPayload): Promise<void> {
  try {
    // Obtener la página actualizada
    const page = await notion.pages.retrieve({ page_id: payload.id });
    
    logger.info('Página actualizada:', {
      id: page.id,
      last_edited_time: (page as any).last_edited_time,
      properties: Object.keys((page as any).properties || {})
    });
    
    // Aquí puedes agregar lógica específica para manejar cambios en páginas
    // Por ejemplo: actualizar balances, sincronizar datos, etc.
    
  } catch (error) {
    logger.error(`Error procesando webhook de página ${payload.id}:`, error);
    throw error;
  }
}

// Procesar webhooks de bases de datos
async function processDatabaseWebhook(payload: WebhookPayload): Promise<void> {
  try {
    // Obtener la base de datos actualizada
    const database = await notion.databases.retrieve({ database_id: payload.id });
    
    logger.info('Base de datos actualizada:', {
      id: database.id,
      title: (database as any).title?.[0]?.plain_text || 'Sin título',
      last_edited_time: (database as any).last_edited_time
    });
    
    // Aquí puedes agregar lógica específica para manejar cambios en bases de datos
    
  } catch (error) {
    logger.error(`Error procesando webhook de base de datos ${payload.id}:`, error);
    throw error;
  }
}

// Endpoint de prueba
router.post('/test', asyncHandler(async (req: Request, res: Response) => {
  logger.info('Webhook de prueba recibido:', req.body);
  
  res.json({
    success: true,
    message: 'Webhook de prueba recibido',
    timestamp: new Date().toISOString(),
    body: req.body
  });
}));

export { router as webhookRoutes }; 
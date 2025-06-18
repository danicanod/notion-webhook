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
  object?: string;
  id?: string;
  created_time?: string;
  last_edited_time?: string;
  verification_token?: string;
  [key: string]: any;
}

// Variable para almacenar el verification token
let storedVerificationToken: string | null = null;

// Verificar la firma del webhook usando el verification token de Notion
const verifyNotionSignature = (body: string, signature: string, verificationToken: string): boolean => {
  try {
    const calculatedSignature = `sha256=${crypto
      .createHmac('sha256', verificationToken)
      .update(body)
      .digest('hex')}`;

    return crypto.timingSafeEqual(
      Buffer.from(calculatedSignature),
      Buffer.from(signature)
    );
  } catch (error) {
    logger.error('Error verificando firma de Notion:', error);
    return false;
  }
};

// Endpoint principal de webhook
router.post('/notion', asyncHandler(async (req: Request, res: Response) => {
  // Parsear el body desde Buffer a JSON
  const bodyString = req.body.toString();
  const payload: WebhookPayload = JSON.parse(bodyString);
  
  // Debug logging
  logger.info('Webhook recibido de Notion:', {
    headers: req.headers,
    bodyString: bodyString.substring(0, 200),
    payload: payload,
    hasVerificationToken: !!payload.verification_token,
    hasObject: !!payload.object
  });
  
  // Step 2: Manejar verification token inicial
  if (payload.verification_token && !payload.object) {
    logger.info('Verification token recibido de Notion:', {
      token: payload.verification_token.substring(0, 20) + '...'
    });
    
    // Almacenar el verification token
    storedVerificationToken = payload.verification_token;
    
    // Responder exitosamente para completar la verificación
    res.status(200).json({
      success: true,
      message: 'Verification token recibido y almacenado',
      timestamp: new Date().toISOString()
    });
    
    logger.info('Webhook verificado exitosamente. Subscription activa.');
    return;
  }

  // Step 3: Validar payload para eventos subsecuentes
  const notionSignature = req.headers['x-notion-signature'] as string;
  
  if (!notionSignature) {
    throw createError('X-Notion-Signature header requerido', 401);
  }

  if (!storedVerificationToken) {
    throw createError('Webhook no verificado. Verification token no encontrado.', 401);
  }

  // Verificar la firma usando el verification token
  if (!verifyNotionSignature(bodyString, notionSignature, storedVerificationToken)) {
    throw createError('Firma de Notion inválida', 401);
  }

  logger.info('Webhook de Notion recibido y verificado:', {
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
  
  if (!object || !id) {
    logger.warn('Payload inválido: object o id faltante');
    return;
  }
  
  logger.info(`Procesando webhook para ${object} (ID: ${id})`);
  
  switch (object) {
    case 'page':
      await processPageWebhook(payload);
      break;
    case 'database':
      await processDatabaseWebhook(payload);
      break;
    case 'comment':
      await processCommentWebhook(payload);
      break;
    default:
      logger.warn(`Tipo de objeto no manejado: ${object}`);
  }
}

// Procesar webhooks de páginas
async function processPageWebhook(payload: WebhookPayload): Promise<void> {
  try {
    // Obtener la página actualizada
    const page = await notion.pages.retrieve({ page_id: payload.id! });
    
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
    const database = await notion.databases.retrieve({ database_id: payload.id! });
    
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

// Procesar webhooks de comentarios
async function processCommentWebhook(payload: WebhookPayload): Promise<void> {
  try {
    logger.info('Comentario creado:', {
      id: payload.id,
      created_time: payload.created_time
    });
    
    // Aquí puedes agregar lógica específica para manejar comentarios
    
  } catch (error) {
    logger.error(`Error procesando webhook de comentario ${payload.id}:`, error);
    throw error;
  }
}

// Endpoint para obtener el status del webhook
router.get('/status', asyncHandler(async (req: Request, res: Response) => {
  res.json({
    verified: !!storedVerificationToken,
    verification_token_stored: !!storedVerificationToken,
    timestamp: new Date().toISOString()
  });
}));

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
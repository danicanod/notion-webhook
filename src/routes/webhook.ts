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
  entity?: {
    id: string;
    type: string;
  };
  type?: string;
  data?: {
    updated_properties?: string[];
    parent?: any;
  };
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
  const entityType = payload.entity?.type;
  const eventType = payload.type;
  const entityId = payload.entity?.id;
  
  if (!entityType || !entityId || !eventType) {
    logger.warn('Payload inválido: entity.type, entity.id o type faltante', {
      entityType,
      entityId,
      eventType,
      payload: JSON.stringify(payload, null, 2)
    });
    return;
  }
  
  logger.info(`Procesando webhook: ${eventType} para ${entityType} (ID: ${entityId})`);
  
  // Procesar según tipo de entidad y evento
  if (entityType === 'page') {
    await processPageWebhook(payload, eventType, entityId);
  } else if (entityType === 'database') {
    await processDatabaseWebhook(payload, eventType, entityId);
  } else if (eventType === 'comment.created') {
    await processCommentWebhook(payload);
  } else {
    logger.warn(`Tipo de entidad/evento no manejado: ${entityType}/${eventType}`);
  }
}

// Procesar webhooks de páginas
async function processPageWebhook(payload: WebhookPayload, eventType: string, entityId: string): Promise<void> {
  try {
    // Obtener la página actualizada
    const page = await notion.pages.retrieve({ page_id: entityId });
    
    logger.info('Página actualizada:', {
      id: page.id,
      eventType,
      last_edited_time: (page as any).last_edited_time,
      properties: Object.keys((page as any).properties || {})
    });
    
    // Lógica específica para transacciones
    await handleTransactionLogic(page, eventType, payload);
    
  } catch (error) {
    logger.error(`Error procesando webhook de página ${entityId}:`, error);
    throw error;
  }
}

// Procesar webhooks de bases de datos
async function processDatabaseWebhook(payload: WebhookPayload, eventType: string, entityId: string): Promise<void> {
  try {
    // Obtener la base de datos actualizada
    const database = await notion.databases.retrieve({ database_id: entityId });
    
    logger.info('Base de datos actualizada:', {
      id: database.id,
      eventType,
      title: (database as any).title?.[0]?.plain_text || 'Sin título',
      last_edited_time: (database as any).last_edited_time
    });
    
    // Aquí puedes agregar lógica específica para manejar cambios en bases de datos
    
  } catch (error) {
    logger.error(`Error procesando webhook de base de datos ${entityId}:`, error);
    throw error;
  }
}

// Lógica específica para manejar transacciones
async function handleTransactionLogic(page: any, eventType: string, payload: WebhookPayload): Promise<void> {
  try {
    // Verificar si la página está en la base de datos de Transacciones
    const parent = page.parent;
    if (parent?.type !== 'database_id') {
      return; // No es una página de base de datos
    }
    
    const databaseId = parent.database_id;
    const database = await notion.databases.retrieve({ database_id: databaseId });
    const databaseTitle = (database as any).title?.[0]?.plain_text || '';
    
    logger.info('Procesando página en base de datos:', {
      databaseTitle,
      databaseId,
      pageId: page.id,
      eventType
    });
    
    // Solo procesar si es la base de datos de Transacciones
    if (databaseTitle.toLowerCase().includes('transaccion')) {
      await handleTransactionPage(page, eventType, payload);
    }
    
  } catch (error) {
    logger.error('Error en handleTransactionLogic:', error);
  }
}

// Manejar páginas de transacciones específicamente
async function handleTransactionPage(page: any, eventType: string, payload: WebhookPayload): Promise<void> {
  try {
    const properties = page.properties;
    
    // Buscar la propiedad de Fecha
    let fechaProperty = null;
    let fechaValue = null;
    
    for (const [key, prop] of Object.entries(properties)) {
      if (key.toLowerCase().includes('fecha') || (prop as any).type === 'date') {
        fechaProperty = key;
        fechaValue = (prop as any).date?.start;
        break;
      }
    }
    
    if (!fechaValue) {
      logger.warn('No se encontró fecha en la transacción:', { pageId: page.id });
      return;
    }
    
    logger.info('Transacción procesada:', {
      pageId: page.id,
      eventType,
      fechaProperty,
      fechaValue,
      updatedProperties: payload.data?.updated_properties || []
    });
    
    // Aquí implementarías la lógica para:
    // 1. Buscar o crear la entrada en la tabla "Día" para esa fecha
    // 2. Asignar la relación entre la transacción y el día
    
    // TODO: Implementar asignación a tabla Día
    await assignTransactionToDay(page.id, fechaValue);
    
  } catch (error) {
    logger.error('Error procesando transacción:', error);
  }
}

// Asignar transacción a la tabla Día
async function assignTransactionToDay(transactionId: string, fecha: string): Promise<void> {
  try {
    if (!process.env.DAY_DATABASE_ID) {
      logger.warn('DAY_DATABASE_ID no configurado, saltando asignación');
      return;
    }

    logger.info('Asignando transacción a día:', {
      transactionId,
      fecha,
      dayDatabaseId: process.env.DAY_DATABASE_ID
    });
    
    // Paso 1: Buscar si ya existe una entrada para esta fecha
    const existingDay = await findDayByDate(fecha);
    
    let dayPageId: string;
    
    if (existingDay) {
      dayPageId = existingDay.id;
      logger.info('Día encontrado existente:', { dayPageId, fecha });
    } else {
      // Paso 2: Crear nueva entrada en tabla Día
      dayPageId = await createDayEntry(fecha);
      logger.info('Nuevo día creado:', { dayPageId, fecha });
    }
    
    // Paso 3: Actualizar la transacción para referenciar el día
    await updateTransactionDayRelation(transactionId, dayPageId);
    
    logger.info('Transacción asignada a día exitosamente:', {
      transactionId,
      dayPageId,
      fecha
    });
    
  } catch (error) {
    logger.error('Error asignando transacción a día:', error);
  }
}

// Buscar día existente por fecha
async function findDayByDate(fecha: string): Promise<any | null> {
  try {
    const response = await notion.databases.query({
      database_id: process.env.DAY_DATABASE_ID!,
      filter: {
        property: 'Fecha', // Asumiendo que la propiedad se llama 'Fecha'
        date: {
          equals: fecha
        }
      }
    });
    
    return response.results.length > 0 ? response.results[0] : null;
  } catch (error) {
    logger.error('Error buscando día por fecha:', error);
    return null;
  }
}

// Crear nueva entrada en tabla Día
async function createDayEntry(fecha: string): Promise<string> {
  try {
    const response = await notion.pages.create({
      parent: {
        database_id: process.env.DAY_DATABASE_ID!
      },
      properties: {
        'Fecha': {
          date: {
            start: fecha
          }
        },
        // Puedes agregar más propiedades por defecto aquí
        'Name': {
          title: [
            {
              text: {
                content: `Día ${fecha}`
              }
            }
          ]
        }
      }
    });
    
    return response.id;
  } catch (error) {
    logger.error('Error creando entrada de día:', error);
    throw error;
  }
}

// Actualizar relación de transacción con día
async function updateTransactionDayRelation(transactionId: string, dayPageId: string): Promise<void> {
  try {
    await notion.pages.update({
      page_id: transactionId,
      properties: {
        'Día': { // Asumiendo que la propiedad de relación se llama 'Día'
          relation: [
            {
              id: dayPageId
            }
          ]
        }
      }
    });
    
    logger.info('Relación actualizada exitosamente:', {
      transactionId,
      dayPageId
    });
    
  } catch (error) {
    logger.error('Error actualizando relación transacción-día:', error);
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
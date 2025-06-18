import { Request, Response } from 'express';
import { WebhookService } from '../services/webhook.service.js';
import { NotionService } from '../services/notion.service.js';
import { TransactionService } from '../services/transaction.service.js';
import { logger } from '../utils/logger.js';
import { createError } from '../middleware/errorHandler.js';
import type { NotionWebhookPayload, WebhookResponse } from '../types/webhook.types.js';

export class WebhookController {
  private notionService: NotionService;
  private transactionService: TransactionService;

  constructor() {
    this.notionService = new NotionService();
    this.transactionService = new TransactionService();
  }

  async handleNotionWebhook(req: Request, res: Response): Promise<void> {
    try {
      const payload = WebhookService.parseWebhookBody(req.body);

      logger.info('Webhook received from Notion:', {
        headers: this.sanitizeHeaders(req.headers),
        payloadType: WebhookService.isVerificationPayload(payload) ? 'verification' : 'event',
        hasVerificationToken: !!(payload as any).verification_token,
        entityType: (payload as NotionWebhookPayload).entity?.type,
        eventType: (payload as NotionWebhookPayload).type
      });

      // Handle verification token (Step 2)
      if (WebhookService.isVerificationPayload(payload)) {
        WebhookService.handleVerificationToken(payload);
        
        const response: WebhookResponse = {
          success: true,
          message: 'Verification token received and stored',
          timestamp: new Date().toISOString()
        };
        
        res.status(200).json(response);
        return;
      }

      // Validate webhook signature (Step 3)
      await this.validateWebhookRequest(req, payload as NotionWebhookPayload);

      // Process webhook event
      await this.processWebhookEvent(payload as NotionWebhookPayload);

      const response: WebhookResponse = {
        success: true,
        message: 'Webhook processed successfully',
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Error processing webhook:', error);
      throw error;
    }
  }

  private async validateWebhookRequest(req: Request, payload: NotionWebhookPayload): Promise<void> {
    const signature = req.headers['x-notion-signature'] as string;
    
    if (!signature) {
      throw createError('X-Notion-Signature header required', 401);
    }

    const bodyString = req.body.toString();
    const isValidSignature = WebhookService.validateWebhookSignature(bodyString, signature);
    
    if (!isValidSignature) {
      throw createError('Invalid Notion signature', 401);
    }

    const isValidStructure = WebhookService.validatePayloadStructure(payload);
    
    if (!isValidStructure) {
      throw createError('Invalid webhook payload structure', 400);
    }
  }

  private async processWebhookEvent(payload: NotionWebhookPayload): Promise<void> {
    const { entity, type: eventType } = payload;

    logger.info(`Processing webhook: ${eventType} for ${entity.type} (ID: ${entity.id})`);

    switch (entity.type) {
      case 'page':
        await this.handlePageWebhook(payload, eventType, entity.id);
        break;
      case 'database':
        await this.handleDatabaseWebhook(payload, eventType, entity.id);
        break;
      default:
        logger.warn(`Unhandled entity/event type: ${entity.type}/${eventType}`);
    }
  }

  private async handlePageWebhook(payload: NotionWebhookPayload, eventType: string, entityId: string): Promise<void> {
    try {
      const page = await this.notionService.getPage(entityId);

      logger.info('Page updated:', {
        id: page.id,
        eventType,
        lastEditedTime: page.last_edited_time,
        propertyCount: Object.keys(page.properties).length
      });

      // Process transaction-specific logic
      await this.transactionService.processTransactionWebhook(page, eventType, payload);
    } catch (error) {
      logger.error(`Error processing page webhook ${entityId}:`, error);
      throw error;
    }
  }

  private async handleDatabaseWebhook(payload: NotionWebhookPayload, eventType: string, entityId: string): Promise<void> {
    try {
      const database = await this.notionService.getDatabase(entityId);

      logger.info('Database updated:', {
        id: database.id,
        eventType,
        title: database.title?.[0]?.plain_text || 'Untitled',
        lastEditedTime: database.last_edited_time
      });

      // Future: Add database-specific logic here
    } catch (error) {
      logger.error(`Error processing database webhook ${entityId}:`, error);
      throw error;
    }
  }

  async getWebhookStatus(req: Request, res: Response): Promise<void> {
    const response = {
      verified: !!process.env.NOTION_VERIFICATION_TOKEN,
      verificationTokenStored: !!process.env.NOTION_VERIFICATION_TOKEN,
      timestamp: new Date().toISOString()
    };

    res.json(response);
  }

  async handleTestWebhook(req: Request, res: Response): Promise<void> {
    logger.info('Test webhook received:', req.body);

    const response: WebhookResponse = {
      success: true,
      message: 'Test webhook received',
      timestamp: new Date().toISOString()
    };

    res.json({ ...response, body: req.body });
  }

  private sanitizeHeaders(headers: any): any {
    const { authorization, ...sanitized } = headers;
    return sanitized;
  }
} 
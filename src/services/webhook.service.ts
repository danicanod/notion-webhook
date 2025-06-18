import crypto from 'crypto';
import { logger } from '../utils/logger.js';
import type { NotionWebhookPayload, NotionVerificationPayload } from '../types/webhook.types.js';

export class WebhookService {
  private static verificationToken: string | null = null;

  static verifySignature(body: string, signature: string, verificationToken: string): boolean {
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
      logger.error('Error verifying Notion signature:', error);
      return false;
    }
  }

  static parseWebhookBody(bodyBuffer: Buffer): NotionWebhookPayload | NotionVerificationPayload {
    try {
      const bodyString = bodyBuffer.toString();
      return JSON.parse(bodyString);
    } catch (error) {
      logger.error('Error parsing webhook body:', error);
      throw new Error('Invalid JSON payload');
    }
  }

  static isVerificationPayload(payload: any): payload is NotionVerificationPayload {
    return !!(payload.verification_token && !payload.entity);
  }

  static handleVerificationToken(payload: NotionVerificationPayload): void {
    logger.info('🔑 VERIFICATION TOKEN RECEIVED FROM NOTION:');
    logger.info('Complete token for env var:', payload.verification_token);
    logger.info('Add this environment variable: NOTION_VERIFICATION_TOKEN=' + payload.verification_token);

    // Store verification token
    this.verificationToken = payload.verification_token;

    logger.info('✅ Webhook verified successfully. Subscription active.');
  }

  static validateWebhookSignature(bodyString: string, signature: string): boolean {
    // Check if we have stored verification token
    if (!this.verificationToken) {
      // Try to get token from environment variable (for persistence across restarts)
      if (process.env.NOTION_VERIFICATION_TOKEN) {
        this.verificationToken = process.env.NOTION_VERIFICATION_TOKEN;
        logger.info('Using verification token from environment variable');
      } else {
        // In development/testing, log and continue without validation
        logger.warn('Verification token not found - skipping signature validation (development only)');
        logger.info('To enable full validation, configure NOTION_VERIFICATION_TOKEN in env vars');
        return true; // Allow processing in development
      }
    }

    // Verify signature only if we have the token
    if (this.verificationToken) {
      const isValid = this.verifySignature(bodyString, signature, this.verificationToken);
      if (isValid) {
        logger.info('Webhook signature validated successfully');
      }
      return isValid;
    }

    return true; // Allow processing if no token available
  }

  static validatePayloadStructure(payload: NotionWebhookPayload): boolean {
    const entityType = payload.entity?.type;
    const eventType = payload.type;
    const entityId = payload.entity?.id;

    if (!entityType || !entityId || !eventType) {
      logger.warn('Invalid payload: missing entity.type, entity.id or type', {
        entityType,
        entityId,
        eventType
      });
      return false;
    }

    return true;
  }
} 
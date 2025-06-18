import { NotionService } from './notion.service.js';
import { logger } from '../utils/logger.js';
import type { NotionPage, NotionWebhookPayload } from '../types/webhook.types.js';

export class TransactionService {
  private notionService: NotionService;

  constructor() {
    this.notionService = new NotionService();
  }

  async processTransactionWebhook(page: NotionPage, eventType: string, payload: NotionWebhookPayload): Promise<void> {
    try {
      // Verificar si la página está en la base de datos de Transacciones
      if (!this.isTransactionPage(page)) {
        return;
      }

      const database = await this.notionService.getDatabase(page.parent.database_id!);
      const databaseTitle = database.title?.[0]?.plain_text || '';

      logger.info('Processing transaction page:', {
        databaseTitle,
        databaseId: page.parent.database_id,
        pageId: page.id,
        eventType
      });

      // Solo procesar si es la base de datos de Transacciones
      if (this.isTransactionDatabase(databaseTitle)) {
        await this.handleTransactionUpdate(page, eventType, payload);
      }
    } catch (error) {
      logger.error('Error in processTransactionWebhook:', error);
      throw error;
    }
  }

  private isTransactionPage(page: NotionPage): boolean {
    return page.parent?.type === 'database_id' && !!page.parent.database_id;
  }

  private isTransactionDatabase(databaseTitle: string): boolean {
    return databaseTitle.toLowerCase().includes('transaccion');
  }

  private async handleTransactionUpdate(page: NotionPage, eventType: string, payload: NotionWebhookPayload): Promise<void> {
    try {
      const dateInfo = this.extractDateFromTransaction(page);

      if (!dateInfo.value) {
        logger.warn('No date found in transaction:', { pageId: page.id });
        return;
      }

      logger.info('Transaction processed:', {
        pageId: page.id,
        eventType,
        dateProperty: dateInfo.property,
        dateValue: dateInfo.value,
        updatedProperties: payload.data?.updated_properties || []
      });

      // Assign transaction to corresponding day
      await this.assignTransactionToDay(page.id, dateInfo.value);
    } catch (error) {
      logger.error('Error handling transaction update:', error);
      throw error;
    }
  }

  private extractDateFromTransaction(page: NotionPage): { property: string | null; value: string | null } {
    for (const [key, prop] of Object.entries(page.properties)) {
      if (key.toLowerCase().includes('fecha') || prop.type === 'date') {
        return {
          property: key,
          value: prop.date?.start || null
        };
      }
    }
    return { property: null, value: null };
  }

  private async assignTransactionToDay(transactionId: string, fecha: string): Promise<void> {
    try {
      if (!process.env.DAY_DATABASE_ID) {
        logger.warn('DAY_DATABASE_ID not configured, skipping assignment');
        return;
      }

      logger.info('Assigning transaction to day:', {
        transactionId,
        fecha,
        dayDatabaseId: process.env.DAY_DATABASE_ID
      });

      // Step 1: Search for existing day entry
      const existingDay = await this.findDayByDate(fecha);

      let dayPageId: string;

      if (existingDay) {
        dayPageId = existingDay.id;
        logger.info('Found existing day:', { dayPageId, fecha });
      } else {
        // Step 2: Create new day entry
        dayPageId = await this.createDayEntry(fecha);
        logger.info('Created new day:', { dayPageId, fecha });
      }

      // Step 3: Update transaction with day relation
      await this.updateTransactionDayRelation(transactionId, dayPageId);

      logger.info('Transaction assigned to day successfully:', {
        transactionId,
        dayPageId,
        fecha
      });
    } catch (error) {
      logger.error('Error assigning transaction to day:', error);
      throw error;
    }
  }

  private async findDayByDate(fecha: string): Promise<any | null> {
    try {
      const results = await this.notionService.queryDatabase(
        process.env.DAY_DATABASE_ID!,
        {
          property: 'Fecha',
          date: {
            equals: fecha
          }
        }
      );

      return results.length > 0 ? results[0] : null;
    } catch (error) {
      logger.error('Error searching day by date:', error);
      return null;
    }
  }

  private async createDayEntry(fecha: string): Promise<string> {
    try {
      return await this.notionService.createPage(
        { database_id: process.env.DAY_DATABASE_ID! },
        {
          'Fecha': {
            date: {
              start: fecha
            }
          },
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
      );
    } catch (error) {
      logger.error('Error creating day entry:', error);
      throw error;
    }
  }

  private async updateTransactionDayRelation(transactionId: string, dayPageId: string): Promise<void> {
    try {
      await this.notionService.updatePage(transactionId, {
        'Día': {
          relation: [
            {
              id: dayPageId
            }
          ]
        }
      });

      logger.info('Relation updated successfully:', {
        transactionId,
        dayPageId
      });
    } catch (error) {
      logger.error('Error updating transaction-day relation:', error);
      throw error;
    }
  }
} 
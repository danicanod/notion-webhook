import { Client } from '@notionhq/client';
import { logger } from '../utils/logger.js';
import type { NotionPage, NotionDatabase } from '../types/webhook.types.js';

export class NotionService {
  private client: Client;

  constructor() {
    this.client = new Client({
      auth: process.env.NOTION_TOKEN,
    });
  }

  async getPage(pageId: string): Promise<NotionPage> {
    try {
      const page = await this.client.pages.retrieve({ page_id: pageId });
      return page as NotionPage;
    } catch (error) {
      logger.error(`Error fetching page ${pageId}:`, error);
      throw error;
    }
  }

  async getDatabase(databaseId: string): Promise<NotionDatabase> {
    try {
      const database = await this.client.databases.retrieve({ database_id: databaseId });
      return database as NotionDatabase;
    } catch (error) {
      logger.error(`Error fetching database ${databaseId}:`, error);
      throw error;
    }
  }

  async queryDatabase(databaseId: string, filter?: any): Promise<any[]> {
    try {
      const response = await this.client.databases.query({
        database_id: databaseId,
        filter,
      });
      return response.results;
    } catch (error) {
      logger.error(`Error querying database ${databaseId}:`, error);
      throw error;
    }
  }

  async createPage(parent: { database_id: string }, properties: any): Promise<string> {
    try {
      const response = await this.client.pages.create({
        parent,
        properties,
      });
      return response.id;
    } catch (error) {
      logger.error('Error creating page:', error);
      throw error;
    }
  }

  async updatePage(pageId: string, properties: any): Promise<void> {
    try {
      await this.client.pages.update({
        page_id: pageId,
        properties,
      });
    } catch (error) {
      logger.error(`Error updating page ${pageId}:`, error);
      throw error;
    }
  }
} 
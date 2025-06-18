export interface NotionWebhookPayload {
  id: string;
  timestamp: string;
  workspace_id: string;
  workspace_name: string;
  subscription_id: string;
  integration_id: string;
  authors: Array<{
    id: string;
    type: string;
  }>;
  attempt_number: number;
  entity: {
    id: string;
    type: 'page' | 'database' | 'comment';
  };
  type: string;
  data?: {
    updated_properties?: string[];
    parent?: {
      id: string;
      type: string;
    };
  };
  verification_token?: string;
}

export interface NotionVerificationPayload {
  verification_token: string;
}

export interface WebhookResponse {
  success: boolean;
  message: string;
  timestamp: string;
}

export interface PageProperties {
  [key: string]: {
    type: string;
    date?: {
      start: string;
      end?: string;
    };
    relation?: Array<{
      id: string;
    }>;
    title?: Array<{
      text: {
        content: string;
      };
    }>;
    [key: string]: any;
  };
}

export interface NotionPage {
  id: string;
  parent: {
    type: string;
    database_id?: string;
  };
  properties: PageProperties;
  last_edited_time: string;
}

export interface NotionDatabase {
  id: string;
  title: Array<{
    plain_text: string;
  }>;
  last_edited_time: string;
} 
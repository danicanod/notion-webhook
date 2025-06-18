export const config = {
  // Server configuration
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Notion configuration
  notion: {
    token: process.env.NOTION_TOKEN,
    verificationToken: process.env.NOTION_VERIFICATION_TOKEN,
    dayDatabaseId: process.env.DAY_DATABASE_ID,
  },
  
  // Logging configuration
  log: {
    level: process.env.LOG_LEVEL || 'info',
  },
  
  // External services
  mainSystemUrl: process.env.MAIN_SYSTEM_URL,
} as const;

// Validation function
export function validateEnvironment(): void {
  const requiredVars = [
    'NOTION_TOKEN',
    'DAY_DATABASE_ID',
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
}

// Helper to check if we're in development
export const isDevelopment = config.nodeEnv === 'development';
export const isProduction = config.nodeEnv === 'production';

// Database property names (can be made configurable later)
export const PROPERTY_NAMES = {
  fecha: 'Fecha',
  dia: 'Día',
  name: 'Name',
} as const; 
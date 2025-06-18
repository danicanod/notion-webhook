# Architecture Documentation

## Overview
This project follows a clean, scalable architecture with clear separation of concerns.

## Directory Structure

```
src/
├── config/           # Configuration and environment variables
├── controllers/      # Request/response handling (thin layer)
├── services/         # Business logic and external integrations
├── types/           # TypeScript type definitions
├── middleware/      # Express middleware
├── routes/          # Route definitions
├── utils/           # Utility functions
└── index.ts         # Application entry point
```

## Architecture Layers

### 1. **Controllers** (`src/controllers/`)
- Handle HTTP requests and responses
- Thin layer that delegates to services
- No business logic
- Input validation and error handling

### 2. **Services** (`src/services/`)
- Core business logic
- External API integrations
- Data processing and transformations
- Independent of HTTP concerns

### 3. **Types** (`src/types/`)
- TypeScript interfaces and type definitions
- Centralized type management
- Strong typing throughout the application

### 4. **Configuration** (`src/config/`)
- Environment variable management
- Application configuration
- Environment validation

## Service Layer Design

### NotionService
- Handles all Notion API interactions
- CRUD operations for pages and databases
- Centralized error handling for Notion API calls

### TransactionService
- Business logic for transaction processing
- Automatic day assignment logic
- Transaction-specific workflows

### WebhookService
- Webhook signature verification
- Payload parsing and validation
- Security and authentication logic

## Key Design Principles

### 1. **Single Responsibility**
Each class/module has one clear purpose

### 2. **Dependency Injection**
Services are injected into controllers for testability

### 3. **Strong Typing**
TypeScript interfaces ensure type safety

### 4. **Error Handling**
Centralized error handling with proper logging

### 5. **Configuration Management**
Environment variables centralized and validated

## Data Flow

```
HTTP Request
    ↓
Route Handler
    ↓
Controller
    ↓
Service Layer
    ↓
External APIs (Notion)
    ↓
Response
```

## Adding New Features

### 1. **New Webhook Handler**
1. Add types to `src/types/webhook.types.ts`
2. Create service in `src/services/`
3. Add controller method in `src/controllers/webhook.controller.ts`
4. Update route if needed

### 2. **New External Integration**
1. Create service class in `src/services/`
2. Add configuration to `src/config/environment.ts`
3. Add types to `src/types/`
4. Use in controllers

### 3. **New Endpoint**
1. Create controller class
2. Add route file
3. Import in `src/index.ts`

## Environment Variables

Required:
- `NOTION_TOKEN`: Notion integration token
- `DAY_DATABASE_ID`: ID of the "Día" database

Optional:
- `NOTION_VERIFICATION_TOKEN`: For webhook signature verification
- `LOG_LEVEL`: Logging level (default: info)
- `MAIN_SYSTEM_URL`: URL of main system

## Testing Strategy

- Unit tests for services
- Integration tests for controllers
- Mock external dependencies
- Type checking with TypeScript

## Code Quality

- Consistent naming conventions
- English for code, Spanish for business terms
- Comprehensive error handling
- Structured logging
- Graceful shutdown handling 
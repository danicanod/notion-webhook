# Notion Webhook Server

Servidor dedicado para recibir y procesar webhooks de Notion. Diseñado para deployment en Railway.

## 🚀 Características

- ✅ Recepción segura de webhooks de Notion
- ✅ Verificación de firmas criptográficas
- ✅ Logging estructurado
- ✅ Rate limiting y seguridad
- ✅ Health checks
- ✅ Listo para Railway

## 📦 Instalación

```bash
npm install
```

## ⚙️ Configuración

Copia `env.example` a `.env` y configura las variables:

```bash
cp env.example .env
```

### Variables de entorno requeridas:

- `NOTION_TOKEN`: Token de integración de Notion
- `WEBHOOK_SECRET`: Secret para verificar webhooks
- `DAY_DATABASE_ID`: ID de la base de datos de días

### Variables opcionales:

- `PORT`: Puerto del servidor (Railway lo configura automáticamente)
- `LOG_LEVEL`: Nivel de logging (debug, info, warn, error)
- `ALLOWED_ORIGINS`: Orígenes permitidos para CORS

## 🏃‍♂️ Uso

### Desarrollo
```bash
npm run dev
```

### Producción
```bash
npm run build
npm start
```

## 🌐 Endpoints

### Health Check
- `GET /health` - Estado del servidor
- `GET /health/ping` - Ping simple

### Webhooks
- `POST /webhook/notion` - Endpoint principal de Notion
- `POST /webhook/test` - Endpoint de prueba

## 🚂 Deploy en Railway

1. Conecta tu repositorio en Railway
2. Configura las variables de entorno
3. Railway detectará automáticamente el proyecto Node.js
4. El servidor se iniciará en el puerto asignado por Railway

### Variables de entorno en Railway:
```
NOTION_TOKEN=secret_...
WEBHOOK_SECRET=tu_secret
DAY_DATABASE_ID=database_id
LOG_LEVEL=info
NODE_ENV=production
```

## 🔧 Configuración de Webhook en Notion

1. Ve a [notion.so/my-integrations](https://notion.so/my-integrations)
2. Selecciona tu integración
3. En "Webhooks", agrega la URL: `https://tu-app.up.railway.app/webhook/notion`
4. Configura el secret que usaste en `WEBHOOK_SECRET`

## 📊 Monitoring

El servidor incluye logging estructurado y health checks para monitoreo.

## 🔒 Seguridad

- Verificación de firmas de webhook
- Rate limiting
- Helmet para headers de seguridad
- CORS configurado 
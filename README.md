# Notion Webhook Server

> **Servidor profesional para automatización de Notion con arquitectura escalable**

[![Deploy Status](https://img.shields.io/badge/Deploy-Render-46E3B7.svg)](https://notion-webhook-knbc.onrender.com)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-3178C6.svg)](https://typescriptlang.org)

## 🎯 Funcionalidades

### ✅ **Automatización de Transacciones**
- **Auto-asignación de fecha**: Las transacciones se asignan automáticamente al día correspondiente
- **Sincronización en tiempo real**: Los cambios de fecha actualizan la relación automáticamente
- **Gestión inteligente**: Crea días automáticamente si no existen

### 🔐 **Webhook Security**
- **Verificación completa de firmas** HMAC-SHA256 de Notion
- **Persistencia de tokens** entre reinicios del servidor
- **Validación de payloads** y estructura de datos

### 🏗️ **Arquitectura Limpia**
- **Separación de responsabilidades** por capas
- **Servicios especializados** para cada dominio
- **Tipado fuerte** con TypeScript
- **Escalabilidad** preparada para nuevas automatizaciones

## 🚀 Quick Start

### 1. **Configuración**
```bash
# Clonar y configurar
git clone https://github.com/danicanod/notion-webhook.git
cd notion-webhook-server
npm install
cp env.example .env
```

### 2. **Variables de entorno**
```env
# Requeridas
NOTION_TOKEN=secret_tu_token_de_notion
DAY_DATABASE_ID=id_de_base_datos_dia

# Opcionales (para máxima seguridad)
NOTION_VERIFICATION_TOKEN=token_de_verificacion
LOG_LEVEL=info
```

### 3. **Ejecutar**
```bash
# Desarrollo
npm run dev

# Producción
npm run build && npm start
```

## 🌐 Deploy en Producción

### **Render (Recomendado)**
1. Fork el repositorio
2. Conectar en [render.com](https://render.com)
3. Configurar variables de entorno
4. **Deploy automático** ✅

### **Railway**
1. Conectar repositorio en Railway
2. Variables de entorno automáticamente detectadas
3. Deploy instant

## 📡 Configuración de Webhook en Notion

### **Paso 1: Crear webhook**
1. Ve a [Notion Integrations](https://www.notion.so/my-integrations)
2. Selecciona tu integración → **Webhooks**
3. **Add webhook endpoint**: `https://tu-servidor.com/webhook/notion`
4. Seleccionar eventos: `page.property_updated`, `page.content_updated`

### **Paso 2: Verificación automática**
- ✅ El servidor maneja automáticamente la verificación
- ✅ Token persistente entre reinicios
- ✅ Logs detallados para debugging

### **Paso 3: Testing**
```bash
# Verificar estado
curl https://tu-servidor.com/webhook/status

# Health check
curl https://tu-servidor.com/health
```

## 🏛️ Arquitectura

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Controllers   │ ── │     Services     │ ── │  External APIs  │
│   (HTTP Layer)  │    │ (Business Logic) │    │    (Notion)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌──────────────────┐            │
         └──────────────│      Types       │────────────┘
                        │  (TypeScript)    │
                        └──────────────────┘
```

### **Servicios especializados:**
- **`NotionService`**: Interacciones con Notion API
- **`TransactionService`**: Lógica de automatización de transacciones
- **`WebhookService`**: Seguridad y validación de webhooks

> 📖 **Documentación técnica completa**: [ARCHITECTURE.md](./ARCHITECTURE.md)

## 🔧 API Endpoints

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/` | GET | Información del servidor |
| `/health` | GET | Health check completo |
| `/webhook/notion` | POST | **Endpoint principal de Notion** |
| `/webhook/status` | GET | Estado de verificación |
| `/webhook/test` | POST | Testing de webhooks |

## 📊 Monitoreo y Logs

### **Logging estructurado**
```json
{
  "level": "info",
  "message": "Transaction assigned to day successfully",
  "transactionId": "...",
  "dayPageId": "...",
  "fecha": "2025-06-18"
}
```

### **Health checks**
- ✅ **Servidor**: Estado general
- ✅ **Notion API**: Conectividad
- ✅ **Webhook**: Verificación activa

## 🛠️ Desarrollo

### **Agregar nueva automatización:**
1. **Crear servicio** en `src/services/`
2. **Definir tipos** en `src/types/`
3. **Usar en controller** existente
4. **¡Listo!** ✨

### **Scripts disponibles:**
```bash
npm run dev        # Desarrollo con hot reload
npm run build      # Compilar TypeScript
npm start          # Iniciar en producción
npm run type-check # Verificar tipos
```

## 🔒 Seguridad

- 🛡️ **HMAC-SHA256** signature verification
- 🔒 **Rate limiting** (100 req/15min)
- 🛡️ **Helmet** security headers
- 🌐 **CORS** configurado
- 📊 **Structured logging** para auditoría

## 📝 Configuración de Notion

### **Capabilities requeridas:**
- ✅ **Read content**: Acceso a páginas y bases de datos
- ✅ **Update content**: Modificar relaciones de páginas
- ⚡ **Comment read**: Para eventos de comentarios (opcional)

### **Eventos recomendados:**
- `page.property_updated` - Cambios en propiedades
- `page.content_updated` - Cambios en contenido  
- `database.schema_updated` - Cambios en esquema

## 🤝 Contribuir

1. Fork del proyecto
2. Crear feature branch
3. Seguir la arquitectura existente
4. Tests y documentación
5. Pull request

## 📄 Licencia

MIT License - Ver [LICENSE](LICENSE) para detalles.

---

**🚀 Listo para automatizar tu flujo de trabajo en Notion** 
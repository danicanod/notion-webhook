# Webhook Setup - Guía Técnica Detallada

> **📖 Para guía completa, ver [README.md](./README.md)**

Esta guía cubre los detalles técnicos específicos de configuración de webhooks de Notion.

## 🔧 Implementación Técnica

### **Verificación de Firma (HMAC-SHA256)**

El servidor implementa la verificación completa según la documentación oficial de Notion:

```javascript
// Signature verification
const calculatedSignature = `sha256=${crypto
  .createHmac('sha256', verificationToken)
  .update(bodyString)
  .digest('hex')}`;

const isValid = crypto.timingSafeEqual(
  Buffer.from(calculatedSignature),
  Buffer.from(notionSignature)
);
```

### **Flujo de Verificación**

1. **Step 2**: Notion envía `verification_token` → Servidor almacena automáticamente
2. **Step 3**: Eventos subsecuentes usan `X-Notion-Signature` → Validación HMAC

### **Persistencia del Token**

- ✅ **En memoria**: Para sesión actual
- ✅ **En env var**: `NOTION_VERIFICATION_TOKEN` para persistencia
- ✅ **Fallback**: Bypass en desarrollo si no hay token

## 📡 Eventos Soportados

| Evento | Descripción | Automatización |
|--------|-------------|----------------|
| `page.property_updated` | Cambio en propiedades de página | ✅ Asignación automática a Día |
| `page.content_updated` | Cambio en contenido | 📊 Logging detallado |
| `database.schema_updated` | Cambio en esquema de BD | 📊 Monitoring |
| `comment.created` | Comentario creado | 📋 Preparado para futuras automatizaciones |

## 🔍 Debugging y Troubleshooting

### **Logs de Webhook**
```json
{
  "message": "Webhook received from Notion",
  "payloadType": "event",
  "entityType": "page", 
  "eventType": "page.property_updated",
  "headers": { "x-notion-signature": "sha256=..." }
}
```

### **Estados de Verificación**
- `GET /webhook/status` - Estado actual del webhook

### **Problemas Comunes**

#### ❌ **Error 401: Verification token not found**
**Causa**: Token perdido en reinicio del servidor
**Solución**: Configurar `NOTION_VERIFICATION_TOKEN` en variables de entorno

#### ❌ **Error 401: Invalid Notion signature**  
**Causa**: Token incorrecto o body modificado
**Solución**: Verificar token y que el body llegue como raw buffer

#### ⚠️ **Webhook no recibe eventos**
**Posibles causas**:
1. Integración sin acceso al objeto
2. Capabilities faltantes
3. Subscription inactiva
4. URL incorrecta

## 🧪 Testing Detallado

### **Test 1: Verificación inicial**
```bash
# Crear webhook en Notion → Ver logs:
# "🔑 VERIFICATION TOKEN RECEIVED FROM NOTION"
# "✅ Webhook verified successfully"
```

### **Test 2: Evento de transacción**
```bash
# Modificar transacción → Ver logs:
# "Processing webhook: page.property_updated for page"
# "Transaction assigned to day successfully"
```

### **Test 3: Health check**
```bash
curl https://tu-servidor.com/webhook/status
# Expected: {"verified": true, "verificationTokenStored": true}
```

## 📊 Monitoreo de Producción

### **Métricas clave:**
- ✅ **Signature validation rate**: 100% válidas
- ✅ **Processing time**: < 2s por webhook
- ✅ **Error rate**: < 1%
- ✅ **Uptime**: 99.9%

### **Alertas recomendadas:**
- Webhook verification failures
- Processing timeouts > 5s
- Error rate > 5%

## 🔐 Consideraciones de Seguridad

### **Headers validados:**
- `X-Notion-Signature`: Firma HMAC-SHA256 requerida
- `User-Agent`: `notion-api` esperado
- `Content-Type`: `application/json` requerido

### **Rate limiting:**
- 100 requests / 15 minutos
- Headers informativos en respuesta

### **Logging de seguridad:**
- Todas las firmas inválidas se loggean
- IPs y User-Agents registrados
- Payloads sanitizados en logs

---

> **💡 Para configuración básica y deploy, ver [README.md](./README.md)** 
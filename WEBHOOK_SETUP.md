# Configuración de Webhooks de Notion

Este servidor implementa la verificación completa de webhooks de Notion según la documentación oficial.

## Pasos de configuración

### 1. Configurar la integración de Notion

1. Ve a [Notion Integrations](https://www.notion.so/my-integrations)
2. Crea una nueva integración
3. Configura las capabilities necesarias:
   - **Read content**: Para acceder a páginas y bases de datos
   - **Comment read**: Para recibir eventos de comentarios (opcional)
4. Copia el **Internal Integration Token**

### 2. Configurar variables de entorno

```bash
# Copia el env.example y configura tu token
cp env.example .env

# Edita .env con tu token de Notion
NOTION_TOKEN=secret_tu_token_aqui
```

### 3. Iniciar el servidor

```bash
npm start
```

### 4. Verificar el webhook en Notion

1. Ve a tu integración en Notion → pestaña **Webhooks**
2. Haz clic en **Add webhook endpoint**
3. Ingresa tu URL: `https://tu-servidor.com/webhook/notion`
4. Selecciona los eventos que quieres recibir:
   - `page.property_updated`
   - `page.content_updated`
   - `database.schema_updated`
   - `comment.created` (si tienes comment read capability)

5. Haz clic en **Add webhook**

### 5. Verificación automática

El servidor maneja automáticamente la verificación:

1. **Step 2**: Notion envía un `verification_token` → el servidor lo almacena automáticamente
2. **Step 3**: Para eventos subsecuentes, el servidor valida la firma `X-Notion-Signature`

### 6. Verificar el estado

Puedes verificar si el webhook está correctamente configurado:

```bash
curl https://tu-servidor.com/webhook/status
```

Respuesta esperada:
```json
{
  "verified": true,
  "verification_token_stored": true,
  "timestamp": "2024-01-XX..."
}
```

## Eventos soportados

- **page.property_updated**: Cuando se actualizan propiedades de una página
- **page.content_updated**: Cuando se actualiza el contenido de una página
- **database.schema_updated**: Cuando se modifica el esquema de una base de datos
- **comment.created**: Cuando se crea un comentario

## Testing

### Test 1: Cambiar título de página
1. Agrega la integración a una página en Notion
2. Cambia el título de la página
3. Espera 1-2 minutos (eventos agregados tienen delay)
4. Verifica los logs del servidor

### Test 2: Agregar comentario
1. Agrega un comentario en una página con acceso de la integración
2. Deberías recibir un evento `comment.created` inmediatamente

### Test 3: Modificar esquema de base de datos
1. Abre una base de datos con acceso de la integración
2. Agrega/modifica/elimina una propiedad
3. Deberías recibir un evento `database.schema_updated`

## Troubleshooting

### Webhook no recibe eventos
1. Verificar que la integración tenga acceso al objeto
2. Confirmar capabilities necesarias están habilitadas
3. Verificar que la subscription esté activa en Notion
4. Revisar logs del servidor para errores

### Error "Verification token no encontrado"
1. Verificar que Notion haya enviado el verification token inicial
2. Reiniciar el servidor puede requerir re-verificación
3. Borrar y recrear el webhook en Notion si es necesario

### Eventos agregados no llegan inmediatamente
Algunos eventos como `page.content_updated` son agregados para reducir ruido.
Para testing inmediato, usa eventos como `comment.created`.

## Seguridad

- ✅ Validación completa de firma HMAC-SHA256
- ✅ Verification token almacenado de forma segura
- ✅ Validation de headers requeridos
- ✅ Logging de eventos para auditoría 
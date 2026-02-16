# JuanBlog Telegram -> LLM Pipeline -> Blogger

Sistema end-to-end en **Node.js + TypeScript + Fastify + SQLite** para recibir ideas por Telegram, generar borradores con 2 modelos (Kimi gratis + Grok), iterar con `/revise` y publicar en Blogger **solo con `/approve`**.

## Checklist de implementación (máx. 15)

1. Inicializar proyecto TypeScript con scripts `dev/build/start/lint/test`.
2. Añadir configuración por `.env` con validación fuerte (Zod).
3. Configurar logging estructurado con pino.
4. Crear esquema SQLite (`articles`, `versions`, `ideas`) + índices.
5. Implementar repositorios con estado/versionado.
6. Implementar parser de comandos de Telegram.
7. Implementar webhook Fastify con validación de `X-Telegram-Bot-Api-Secret-Token`.
8. Implementar cliente Telegram (sendMessage) con reintentos/backoff.
9. Implementar clientes OpenAI, Claude y Kimi (OpenAI-compatible).
10. Implementar pipeline multi-ronda (divergente -> editor -> red team -> editor).
11. Implementar abstracción `Publisher`.
12. Implementar `BloggerPublisher` con OAuth2 refresh token.
13. Convertir Markdown -> HTML sanitizado antes de publicar.
14. Guardar/actualizar borradores en Blogger y publicar solo con `/approve`.
15. Añadir tests mínimos y documentación local + ngrok.

---

## Arquitectura

- **Webhook Telegram**: `POST /webhook/telegram`.
- **Estado** por artículo (`COLLECTING`, `DRAFTING`, `REVIEW`, `REVISING`, `APPROVED`, `PUBLISHED`).
- **Versionado**: cada `/draft` o `/revise` genera una nueva versión (`v1`, `v2`, ...).
- **Pipeline LLM** (simplificado, solo Kimi + Grok):
  - Ronda 1 (divergente): Kimi (estructura + borrador) y Grok (narrativa + crítica) en paralelo.
  - Ronda 2 (convergente): Kimi unifica en JSON estricto `v1`.
  - Ronda 3 (red team): Kimi + Grok critican, Grok aplica cambios -> `v2`.
- **Publisher (Blogger)**:
  - al producir `v2`: crea/actualiza `draft`.
  - `/approve`: publica.
- **Regla dura**: nunca publica automáticamente sin `/approve`.

## Comandos Telegram

- `/idea <texto>`: agrega idea al inbox del artículo activo.
- `/draft [1000|2000]`: ejecuta pipeline y devuelve versión revisada (default 1000).
- `/revise <instrucciones>`: nueva iteración sobre la última versión.
- `/approve`: publica en Blogger el draft actual.
- `/status`: estado + versión + objetivo de palabras + remote post id.
- `/new`: cierra artículo activo y crea uno nuevo en `COLLECTING`.

## Variables de entorno

Copia `.env.example` a `.env` y completa:

```bash
cp .env.example .env
```

### Variables obligatorias mínimas (para probar):

**Telegram:**
- `TELEGRAM_BOT_TOKEN` - Del @BotFather
- `TELEGRAM_WEBHOOK_SECRET` - Un secreto largo que inventas tú

**IA (necesitas al menos uno):**
- `OPENROUTER_API_KEY` - **GRATIS** en [openrouter.ai](https://openrouter.ai) para usar Kimi
- `GROK_API_KEY` - Desde [console.x.ai](https://console.x.ai) (tienes €25 gratis al registrarte)

### Variables para Blogger (opcionales para pruebas):

Si dejas estas vacías, el sistema funciona en **modo prueba**:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REFRESH_TOKEN`
- `BLOGGER_BLOG_ID`

En modo prueba los borradores se guardan localmente y se muestran en Telegram, pero no se publican en Blogger.

### Opcionales adicionales:
- `OPENAI_API_KEY` - Solo si quieres usar GPT también
- `ANTHROPIC_API_KEY` - Solo si quieres usar Claude también

Notas: `WP_*` quedaron opcionales solo por retrocompatibilidad y no se usan en runtime.

## Instalación y arranque

```bash
npm i
npm run dev
```

Servidor en `http://localhost:3000`.

---

## 🧪 Probar sin Blogger (modo prueba)

Puedes probar todo el flujo sin configurar Blogger. En este modo:
- Los borradores se generan con IA
- Se guardan localmente en SQLite
- Se muestran en Telegram
- No se publica nada en Blogger

### Pasos:

1. **Configura solo las variables mínimas** en `.env`:
```env
TELEGRAM_BOT_TOKEN=tu_token
TELEGRAM_WEBHOOK_SECRET=un_secreto_largo
OPENROUTER_API_KEY=tu_key_de_openrouter
GROK_API_KEY=tu_key_de_grok
# Deja vacías las variables de Google/Blogger
```

2. **Inicia el servidor**:
```bash
npm run dev
```

Verás en los logs: `"Usando MockPublisher (modo prueba - sin Blogger)"`

3. **Expón tu localhost con ngrok**:
```bash
ngrok http 3000
```

4. **Configura el webhook de Telegram** (reemplaza la URL):
```bash
curl -X POST "https://api.telegram.org/botTU_TOKEN/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://TU_URL.ngrok-free.app/webhook/telegram","secret_token":"TU_SECRETO"}'
```

5. **Prueba en Telegram**:
- `/idea Mi primera idea para un artículo`
- `/idea Otra idea relacionada`
- `/draft` → Generará el borrador con Kimi + Grok
- `/revise Hazlo más largo` → Revisará el borrador
- `/approve` → "Publicará" localmente (simulado)
- `/status` → Ver estado actual

Cuando estés listo para conectar Blogger, completa las variables de Google y reinicia.

## Smoke test real de Blogger

Ejecuta validación de autenticación + lectura de blog:

```bash
npm run smoke:blogger
```

Opcionalmente, crear un draft de prueba:

```bash
SMOKE_CREATE_DRAFT=true npm run smoke:blogger
```

El smoke test falla con errores explícitos para: variables faltantes, auth inválida (`invalid_grant`), permisos insuficientes y `BLOGGER_BLOG_ID` inválido.

## Crear bot Telegram y webhook

1. Habla con `@BotFather`.
2. Ejecuta `/newbot` y guarda token en `TELEGRAM_BOT_TOKEN`.
3. Define un `TELEGRAM_WEBHOOK_SECRET` largo.
4. Exponer local con ngrok:

```bash
ngrok http 3000
```

5. Configura webhook (usa tu URL pública de ngrok):

```bash
curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url":"https://TU_SUBDOMINIO.ngrok-free.app/webhook/telegram",
    "secret_token":"'"$TELEGRAM_WEBHOOK_SECRET"'"
  }'
```

## Configurar Blogger (paso a paso)

1. Crea tu blog en https://www.blogger.com.
2. En Google Cloud, habilita **Blogger API v3** para tu proyecto.
3. Configura OAuth consent screen (para estabilidad de largo plazo, usa estado **Production** cuando puedas).
4. Crea credenciales OAuth client (Desktop app recomendado para obtener token manual).

### Cómo obtener `GOOGLE_REFRESH_TOKEN` (OAuth Playground)

1. Abre https://developers.google.com/oauthplayground
2. En ⚙️ (Settings), activa **Use your own OAuth credentials** e ingresa:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
3. En Step 1, usa el scope:
   - `https://www.googleapis.com/auth/blogger`
4. Authorize APIs.
5. Exchange authorization code for tokens.
6. Copia el `refresh_token` a `GOOGLE_REFRESH_TOKEN`.

Importante:
- El refresh token debe emitirse con acceso **offline**.
- Si no aparece `refresh_token`, fuerza consentimiento (`prompt=consent`) o revoca acceso y repite el flujo.

### Cómo obtener `BLOGGER_BLOG_ID`

Opción API (recomendado):

```bash
curl -H "Authorization: Bearer <ACCESS_TOKEN>" \
  "https://www.googleapis.com/blogger/v3/users/self/blogs"
```

También puedes obtenerlo desde la UI/admin URL del blog según configuración.

## Troubleshooting Blogger OAuth/API

- `invalid_grant`:
  - refresh token inválido/revocado/expirado o client_id/client_secret no corresponden.
  - regenéralo y vuelve a guardar en `.env`.
- `insufficientPermissions`:
  - el token no incluye scope `https://www.googleapis.com/auth/blogger`.
- `404`/`invalid blogId`:
  - `BLOGGER_BLOG_ID` incorrecto o el usuario/token no tiene acceso a ese blog.
- no llega `refresh_token` en OAuth Playground:
  - usar `prompt=consent` o revocar permisos previos y repetir.

## Flujo operativo típico

1. En Telegram manda varias ideas con `/idea ...`.
2. Genera borrador por defecto: `/draft`
3. O largo: `/draft 2000`
4. Ajusta: `/revise hazlo más práctico y añade cierre más contundente`
5. Ver estado: `/status`
6. Publica manualmente: `/approve`

## Calidad y seguridad implementadas

- No inventar fuentes (instrucciones fuertes al editor).
- JSON estricto parseable y validado por Zod.
- Validaciones de contenido:
  - exactamente 1 H1
  - mínimo 3 H2
  - conclusión obligatoria
  - sección final `Notas / Claims a verificar` si hay claims
- Control de longitud ±15% frente a `target_words`.
- Reintentos con backoff exponencial para APIs externas.
- Logs estructurados con pino.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run test
npm run smoke:blogger
```

## Notas de proveedores

### Kimi (GRATIS vía OpenRouter)
- Regístrate gratis en [openrouter.ai](https://openrouter.ai)
- Usa el modelo `moonshotai/kimi-k2:free` (incluido en el código)
- No necesitas tarjeta de crédito

### Grok (xAI)
- Consigue tu API key en [console.x.ai](https://console.x.ai)
- Al registrarte recibes €25 en créditos gratuitos
- Después puedes recargar con tarjeta
- El modelo usado es `grok-2-latest`

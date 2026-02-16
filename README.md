# JuanBlog Telegram -> LLM Pipeline -> WordPress

Sistema end-to-end en **Node.js + TypeScript + Fastify + SQLite** para recibir ideas por Telegram, generar borradores con 3 modelos (GPT, Claude, Kimi), iterar con `/revise` y publicar en WordPress **solo con `/approve`**.

## Checklist de implementación (máx. 15)

1. Inicializar proyecto TypeScript con scripts `dev/build/start/lint/test`.
2. Añadir configuración por `.env` con validación fuerte (Zod).
3. Configurar logging estructurado con pino.
4. Crear esquema SQLite (`articles`, `versions`, `ideas`) + índices.
5. Implementar repositorios con estado/versionado.
6. Implementar parser de comandos de Telegram.
7. Implementar webhook Fastify con validación de `X-Telegram-Bot-Api-Secret-Token`.
8. Implementar cliente Telegram (sendMessage) con reintentos/backoff.
9. Implementar cliente OpenAI Responses API.
10. Implementar cliente Claude Messages API.
11. Implementar cliente Kimi vía provider OpenAI-compatible configurable.
12. Implementar pipeline multi-ronda (divergente -> editor -> red team -> editor).
13. Validar JSON estricto y reglas de estructura/longitud/claims.
14. Integrar WordPress REST: create/update draft y publish bajo `/approve`.
15. Añadir tests mínimos (parser/DB/pipeline stub) y documentación local + ngrok.

---

## Arquitectura

- **Webhook Telegram**: `POST /webhook/telegram`.
- **Estado** por artículo (`COLLECTING`, `DRAFTING`, `REVIEW`, `REVISING`, `APPROVED`, `PUBLISHED`).
- **Versionado**: cada `/draft` o `/revise` genera una nueva versión (`v1`, `v2`, ...).
- **Pipeline LLM**:
  - Ronda 1 (divergente): GPT (outline), Claude (narrativa), Kimi (crítica SEO/huecos).
  - Ronda 2 (convergente): Editor genera JSON estricto `v1`.
  - Ronda 3 (red team): 3 críticas + editor aplica cambios -> `v2`.
- **WordPress**:
  - al producir `v2`: crea/actualiza `draft`.
  - `/approve`: cambia a `publish`.
- **Regla dura**: nunca publica automáticamente sin `/approve`.

## Comandos Telegram

- `/idea <texto>`: agrega idea al inbox del artículo activo.
- `/draft [1000|2000]`: ejecuta pipeline y devuelve versión revisada (default 1000).
- `/revise <instrucciones>`: nueva iteración sobre la última versión.
- `/approve`: publica en WordPress el draft actual.
- `/status`: estado + versión + objetivo de palabras + wp_post_id.
- `/new`: cierra artículo activo y crea uno nuevo en `COLLECTING`.

## Variables de entorno

Copia `.env.example` a `.env` y completa:

```bash
cp .env.example .env
```

Variables:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_WEBHOOK_SECRET`
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `KIMI_API_KEY` o `OPENROUTER_API_KEY`
- `KIMI_BASE_URL` (default OpenAI-compatible provider)
- `WP_BASE_URL` (ej: `https://mi-sitio.com`)
- `WP_USERNAME`
- `WP_APP_PASSWORD`

## Instalación y arranque

```bash
npm i
npm run dev
```

Servidor en `http://localhost:3000`.

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

## Configurar WordPress (self-hosted)

1. En WP: **Usuarios -> Tu usuario -> Application Passwords**.
2. Crear nueva password de aplicación.
3. Guardar:
   - `WP_USERNAME`
   - `WP_APP_PASSWORD`
   - `WP_BASE_URL` (sin slash final)
4. Verifica REST:

```bash
curl "$WP_BASE_URL/wp-json/wp/v2/posts"
```

## Flujo operativo típico

1. En Telegram manda varias ideas con `/idea ...`.
2. Genera borrador por defecto:
   - `/draft`
3. O largo:
   - `/draft 2000`
4. Ajusta:
   - `/revise hazlo más práctico y añade cierre más contundente`
5. Ver estado:
   - `/status`
6. Publica manualmente:
   - `/approve`

## Calidad y seguridad implementadas

- No inventar fuentes (instrucciones fuertes al editor).
- JSON estricto parseable y validado por Zod.
- Validaciones de contenido:
  - exactamente 1 H1
  - mínimo 3 H2
  - conclusión obligatoria
  - sección final `Notas / Claims a verificar` si hay claims
- Control de longitud ±15% frente a `target_words`.
- Reintentos con backoff exponencial para APIs externas (LLM, Telegram, WP).
- Logs estructurados con pino.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run test
```

## Notas de proveedor Kimi

Por defecto se implementa Kimi en modo **OpenAI-compatible** usando `KIMI_BASE_URL` + `KIMI_API_KEY` (o `OPENROUTER_API_KEY`).
Si cambias de proveedor, ajusta `KIMI_BASE_URL` y modelo en `src/clients/llmClients.ts`.

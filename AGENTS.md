# AGENTS.md - Guía para Agentes de Código

Archivo de referencia para agentes de IA que trabajen en este proyecto. Este documento describe la arquitectura, convenciones y flujos de trabajo del proyecto JuanBlog.

---

## Visión General del Proyecto

**JuanBlog** es un sistema end-to-end en Node.js + TypeScript que implementa un pipeline de generación de contenido para blogs usando LLMs (Kimi y Grok) y publicación en Blogger.

### Flujo Principal
1. El usuario envía ideas por Telegram usando comandos (`/idea`)
2. El sistema genera borradores con IA usando un pipeline multi-ronda (`/draft`)
3. El usuario puede solicitar revisiones (`/revise`)
4. Finalmente, el usuario aprueba la publicación (`/approve`)

### Estados del Artículo
- `COLLECTING` → Recolectando ideas
- `DRAFTING` → Generando borrador con IA
- `REVIEW` → Borrador listo para revisión
- `REVISING` → Aplicando revisiones
- `APPROVED` → Aprobado pero no publicado
- `PUBLISHED` → Publicado en Blogger

---

## Stack Tecnológico

| Componente | Tecnología |
|------------|------------|
| Runtime | Node.js 22+ |
| Lenguaje | TypeScript 5.7 |
| Framework Web | Fastify 5.x |
| Base de datos | SQLite (better-sqlite3) |
| Validación | Zod |
| Logging | Pino |
| LLMs | OpenAI SDK (Kimi via OpenRouter, Grok via xAI) |
| Publicación | Blogger API v3 |
| Testing | Vitest |
| Linting | ESLint + Prettier |

---

## Estructura del Proyecto

```
src/
├── clients/           # Clientes de APIs externas
│   ├── llmClients.ts      # Clientes Kimi (OpenRouter) y Grok (xAI)
│   ├── telegramClient.ts  # Cliente para enviar mensajes a Telegram
│   └── wordpressClient.ts # (legacy, no usado actualmente)
├── config/            # Configuración
│   └── env.ts             # Validación de variables de entorno con Zod
├── db/                # Base de datos
│   ├── client.ts          # Conexión SQLite + inicialización de tablas
│   └── repositories.ts    # Funciones de acceso a datos
├── domain/            # Tipos y dominio
│   └── types.ts           # Interfaces Article, Version, Idea, etc.
├── pipeline/          # Pipeline de generación de contenido
│   └── contentPipeline.ts # Lógica multi-ronda con LLMs
├── publishers/        # Capa de publicación
│   ├── index.ts           # Factory: elige BloggerPublisher o MockPublisher
│   ├── types.ts           # Interfaces del publisher
│   ├── bloggerPublisher.ts # Publicación real en Blogger
│   └── mockPublisher.ts   # Mock para modo prueba
├── routes/            # Endpoints HTTP
│   └── telegramWebhook.ts # POST /webhook/telegram
├── services/          # Lógica de negocio
│   ├── commandParser.ts   # Parser de comandos Telegram
│   └── articleService.ts  # Handlers para cada comando
├── utils/             # Utilidades
│   ├── draftValidation.ts # Validación de estructura y contenido
│   ├── markdown.ts        # Conversión Markdown → HTML sanitizado
│   └── retry.ts           # Utilidad de reintentos con backoff
├── scripts/           # Scripts utilitarios
│   └── smokeBlogger.ts    # Test de conectividad con Blogger
├── index.ts           # Punto de entrada
├── config.ts          # (legacy, usar config/env.ts)
└── logger.ts          # Configuración de Pino

tests/                 # Tests con Vitest
├── commandParser.test.ts
├── db.test.ts
├── markdown.test.ts
├── pipeline.stub.test.ts
└── publisher-integration.test.ts
```

---

## Variables de Entorno

Copiar `.env.example` a `.env` y configurar:

### Oblatorias para desarrollo
```env
TELEGRAM_BOT_TOKEN=           # Del @BotFather
TELEGRAM_WEBHOOK_SECRET=      # Secreto largo personalizado
```

### Al menos una fuente de LLM
```env
OPENROUTER_API_KEY=           # Gratis en https://openrouter.ai
GROK_API_KEY=                 # €25 gratis en https://console.x.ai
```

### Para publicar en Blogger (opcional para pruebas)
```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REFRESH_TOKEN=
BLOGGER_BLOG_ID=
```

**Importante**: Si las variables de Blogger están vacías, el sistema usa `MockPublisher` (modo prueba) que guarda drafts localmente sin publicar.

---

## Comandos Disponibles

```bash
# Desarrollo con hot-reload
npm run dev

# Build de producción
npm run build

# Ejecutar en producción
npm run start

# Linting
npm run lint

# Tests
npm run test

# Test de conectividad con Blogger
npm run smoke:blogger
# Crear draft de prueba:
SMOKE_CREATE_DRAFT=true npm run smoke:blogger
```

---

## Comandos de Telegram

| Comando | Descripción |
|---------|-------------|
| `/idea <texto>` | Agrega idea al artículo activo |
| `/draft [1000\|2000]` | Genera borrador (default 1000 palabras) |
| `/revise <instrucciones>` | Nueva iteración sobre última versión |
| `/approve` | Publica el draft en Blogger |
| `/status` | Muestra estado del artículo activo |
| `/new` | Cierra artículo actual y crea nuevo |

---

## Pipeline de Generación de Contenido

El pipeline (`src/pipeline/contentPipeline.ts`) usa una estrategia multi-ronda:

1. **Ronda 1 (Divergente)**: Kimi y Grok generan en paralelo
   - Kimi: estructura + borrador inicial
   - Grok: narrativa + crítica

2. **Ronda 2 (Convergente)**: Kimi unifica en JSON estricto válido

3. **Ronda 3 (Red Team)**: Ambos modelos critican, Grok aplica mejoras

### Validaciones de Calidad
- Exactamente 1 H1 en el contenido
- Mínimo 3 H2
- Sección de conclusión obligatoria
- Sección "Notas / Claims a verificar" si hay claims
- Longitud dentro de ±15% del target de palabras

---

## Convenciones de Código

### Estilo
- TypeScript strict mode habilitado
- Módulos CommonJS (`"type": "commonjs"` en package.json)
- Imports con rutas relativas (`../config/env`)
- ESLint con reglas de TypeScript

### Base de Datos
- Usar `better-sqlite3` (síncrono)
- Transacciones para operaciones complejas
- Base de datos en memoria para tests (`DATABASE_PATH=:memory:`)

### Manejo de Errores
- Usar `logger` de Pino para errores
- Reintentos con backoff exponencial para APIs externas (`utils/retry.ts`)
- Mensajes de error amigables en Telegram

### Zod
- Todas las entradas externas validadas con Zod
- Esquema de variables de entorno en `config/env.ts`
- Esquema de borradores en `utils/draftValidation.ts`

---

## Testing

### Framework
- **Vitest** para unit tests e integración
- Tipos incluidos en tsconfig.json (`"types": ["node", "vitest/globals"]`)

### Estrategia
- Tests usan base de datos en memoria (`:memory:`)
- Mocks para clientes externos (LLMs, Telegram, Publisher)
- Tests de integración con publishers mockeados

### Estructura de Tests
```typescript
// Configurar env vars antes de importar módulos
beforeAll(() => {
  process.env.NODE_ENV = 'test';
  process.env.TELEGRAM_BOT_TOKEN = 'x';
  // ... resto de variables
});

// Usar vi.mock() para mockear módulos
vi.mock('../src/pipeline/contentPipeline', () => ({
  classifyTopic: vi.fn().mockResolvedValue('tecnologia'),
  generateDraft: vi.fn().mockResolvedValue({...})
}));
```

---

## Seguridad

### Webhook de Telegram
- Validación obligatoria de header `X-Telegram-Bot-Api-Secret-Token`
- Token configurable via `TELEGRAM_WEBHOOK_SECRET`
- Endpoint: `POST /webhook/telegram`

### Sanitización
- HTML sanitizado antes de enviar a Blogger (`sanitize-html`)
- Markdown convertido a HTML seguro (`marked` + `sanitize-html`)

### OAuth2 (Blogger)
- Refresh tokens almacenados en `.env` (nunca en código)
- Scope requerido: `https://www.googleapis.com/auth/blogger`

---

## Troubleshooting Común

### `invalid_grant` (Blogger)
- Refresh token inválido/revocado
- Regenerar en OAuth Playground y actualizar `.env`

### `insufficientPermissions`
- Token sin scope de Blogger
- Verificar consentimiento OAuth

### Webhook no recibe mensajes
- Verificar URL del webhook configurada correctamente
- Comprobar `X-Telegram-Bot-Api-Secret-Token`
- Usar ngrok para desarrollo local

### Error en pipeline LLM
- Verificar `OPENROUTER_API_KEY` o `GROK_API_KEY`
- Revisar logs de Pino para detalles

---

## Notas para Agentes

1. **Modo Prueba**: Siempre puedes desarrollar sin configurar Blogger. El sistema automáticamente usa `MockPublisher`.

2. **Duplicado de Config**: Hay dos archivos de config (`config.ts` y `config/env.ts`). Usa siempre `config/env.ts` - el otro es legacy.

3. **Estado Único**: Solo hay un artículo "activo" a la vez (el más reciente no publicado). El comando `/new` cierra el actual y crea uno nuevo.

4. **Versionado**: Cada `/draft` o `/revise` crea una nueva versión en la tabla `versions`.

5. **Topic Labels**: Los artículos se clasifican automáticamente en: `sociologia`, `entrenamiento`, `politica`, `estilo_vida`, `tecnologia`, `mixto`.

6. **Regla Dura**: Nunca se publica automáticamente. Siempre requiere comando `/approve` explícito.

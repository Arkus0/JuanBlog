# ARQUITECTURA OPTIMIZADA v4 - JuanBlog Pipeline

## 📊 Diagnóstico de Problemas (Feb 2026)

### Problemas Identificados

| Problema | Causa Raíz | Frecuencia |
|----------|------------|------------|
| "Network connection lost" en `write` | Timeout de OpenRouter durante tool calls largas | Alta |
| Model no respetado en spawn | El parámetro `model` se aplica a la sesión, no permite cambiar mid-session | Media |
| Timeouts en subagentes | Modelos lentos (Claude Opus) + respuestas largas | Alta |
| No hay paralelismo real | `sessions_spawn` es secuencial por diseño | N/A (confusión) |
| Subagentes que fallan silenciosamente | Sin retry logic, timeout mata la sesión | Alta |

### Evidencia del Log de Runs
```
corpus-design: timeout
revisor-kant: timeout  
opus-45-arquitectura: null (interrumpido)
```

---

## 🏗️ Arquitectura Propuesta v4

### Principios de Diseño

1. **Separación de concerns**: Research, Writing, Tooling son capas distintas
2. **Modelo = Tarea, no Sesión**: Cada modelo hace UNA cosa específica
3. **Tooling solo en Local**: Tools peligrosos (write, exec) NUNCA en modelos OpenRouter
4. **Retry con Fallback**: Si OpenRouter falla, hay plan B
5. **Timeouts Generosos**: Claude Opus necesita más tiempo

### Diagrama de Flujo Optimizado

```
┌─────────────────────────────────────────────────────────────────┐
│                    ORQUESTADOR (Kimi K2.5)                      │
│                    - Analiza tema                                │
│                    - Coordina agentes                            │
│                    - Ejecuta tools (write, git)                  │
│                    - NUNCA delega tools a OpenRouter             │
└────────────────────────────┬────────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
┌────────────────┐  ┌────────────────┐  ┌────────────────┐
│  RESEARCHER    │  │  NEWS SCOUT    │  │  FACT CHECKER  │
│  Perplexity    │  │  GPT-4o-mini   │  │  GPT-4o-mini   │
│  Sonar Pro     │  │  + web_search  │  │  + web_search  │
│                │  │                │  │                │
│  Solo TEXTO    │  │  Solo TEXTO    │  │  Solo TEXTO    │
│  No tools      │  │  No tools      │  │  No tools      │
└────────────────┘  └────────────────┘  └────────────────┘
         │                   │                   │
         └───────────────────┼───────────────────┘
                             │
                             ▼ (contexto compilado)
                ┌────────────────────────┐
                │       ESCRITOR         │
                │    Claude Opus 4.5     │
                │                        │
                │    Solo GENERA TEXTO   │
                │    No tools            │
                │    Timeout: 5 min      │
                └────────────────────────┘
                             │
                             ▼ (draft HTML string)
                ┌────────────────────────┐
                │       REVISOR          │
                │      Kimi K2.5         │
                │                        │
                │    Refina estilo       │
                │    No tools            │
                └────────────────────────┘
                             │
                             ▼ (final HTML string)
                ┌────────────────────────┐
                │     ORQUESTADOR        │
                │                        │
                │  AQUÍ ejecuta tools:   │
                │  - write(file)         │
                │  - git commit/push     │
                │  - message(telegram)   │
                └────────────────────────┘
```

### Regla de Oro: "Texto Entra, Texto Sale"

**Los modelos de OpenRouter NUNCA ejecutan tools.** Solo:
- Reciben prompts (texto)
- Devuelven respuestas (texto)
- El orquestador (Kimi local) hace todo el I/O

---

## 🔄 Manejo de Errores y Fallbacks

### Matriz de Fallbacks

| Agente | Modelo Primario | Fallback 1 | Fallback 2 |
|--------|-----------------|------------|------------|
| Researcher | `perplexity/sonar-pro` | `openrouter/openai/gpt-4o` | `kimi_search` local |
| News Scout | `openrouter/gpt-4o-mini` | `kimi_search` local | web_search Brave |
| Fact Checker | `openrouter/gpt-4o-mini` | `kimi_search` local | Skip (no crítico) |
| Escritor | `openrouter/claude-opus-4.5` | `openrouter/claude-opus-4` | `kimi-coding/k2p5` |
| Revisor | `kimi-coding/k2p5` | Ya es local | - |

### Patrón de Retry con Timeout

```python
# Pseudocódigo
async def call_openrouter_with_retry(model, prompt, max_retries=3):
    for attempt in range(max_retries):
        try:
            result = await spawn_agent(
                model=model,
                prompt=prompt,
                timeout_ms=300000,  # 5 minutos para Opus
                tools=[]  # CERO tools
            )
            return result
        except NetworkError:
            if attempt == max_retries - 1:
                return call_fallback_model(prompt)
            await sleep(exponential_backoff(attempt))
        except Timeout:
            # Reducir el prompt o usar modelo más rápido
            return call_fallback_model(prompt)
```

### Configuración de Timeouts por Modelo

```json
{
  "timeouts": {
    "perplexity/sonar-pro": 60000,
    "openai/gpt-4o-mini": 30000,
    "anthropic/claude-opus-4.5": 300000,
    "anthropic/claude-opus-4": 240000,
    "kimi-coding/k2p5": 120000
  }
}
```

---

## 🎯 Implementación: Caso "Kant, Magic y el Gimnasio"

### Paso 1: Usuario Envía Tema

```
Usuario → /new research "La autonomía kantiana aplicada al gimnasio moderno"
```

### Paso 2: Orquestador Analiza (Kimi K2.5 - Local)

```python
tema = "La autonomía kantiana aplicada al gimnasio moderno"
agentes = analizar_tema(tema)
# → researcher=True (Kant), news_scout=True (moderno), fact_checker=False
```

### Paso 3: Research en Paralelo (Sin Tools)

**Spawn paralelo con Promise.all equivalente:**

```javascript
// Pseudo-implementación
const research_results = await Promise.all([
    spawn_text_only('perplexity/sonar-pro', `
        Busca citas exactas de Kant sobre:
        - "¿Qué es la Ilustración?" (Was ist Aufklärung?)
        - Autonomía moral (Grundlegung)
        - Imperativo categórico
        
        Formato: CITA | OBRA | REFERENCIA (Ak. si disponible)
    `),
    spawn_text_only('openai/gpt-4o-mini', `
        Tendencias fitness 2024-2026:
        - Gamificación del entrenamiento
        - Cultura de "no pain no gain" vs mindfulness
        - Estadísticas de abandono de gimnasios
    `)
]);
```

### Paso 4: Compilar Contexto

El orquestador (Kimi local) recibe los textos y compila:

```markdown
# CONTEXTO ENRIQUECIDO

## Fuentes Filosóficas (Researcher)
- "La minoría de edad es la incapacidad de servirse del propio entendimiento..." - Kant, Was ist Aufklärung?, Ak. VIII: 35
- Concepto clave: Selbstdenken (pensar por uno mismo)
...

## Actualidad (News Scout)
- 67% abandona gimnasio antes de 3 meses (IHRSA 2025)
- Tendencia: apps gamificadas (Peloton, Zwift) vs. entrenamiento autónomo
...
```

### Paso 5: Escritor (Claude Opus 4.5 - Solo Texto)

```javascript
const draft = await spawn_text_only('anthropic/claude-opus-4.5', `
${SYSTEM_PROMPT_JUANBLOG}

CONTEXTO ENRIQUECIDO:
${compiled_context}

TEMA: La autonomía kantiana aplicada al gimnasio moderno

INSTRUCCIONES:
- Estructura: I.Diagnóstico → II.Genealogía → III.Categoría → IV.Ley de hierro → V.Éxtasis → VI.Conclusión
- Apertura: "Contemplamos el espectáculo..."
- MAYÚSCULAS para énfasis
- Momento de éxtasis: donde el esfuerzo se disuelve en experiencia pura
- Segunda persona: "Tú que lees esto..."

Retorna SOLO el HTML del artículo completo. Sin explicaciones.
`, { timeout: 300000 }); // 5 minutos
```

### Paso 6: Revisor (Kimi K2.5 - Local)

```javascript
const final_html = await revisar_estilo(draft, GUIA_ESTILO);
```

### Paso 7: Orquestador Escribe Archivos (Local)

```javascript
// SOLO el orquestador (Kimi local) ejecuta tools
await write_file(`docs/drafts/kant-gimnasio-v1.html`, final_html);
await exec('git add . && git commit -m "Draft: Kant Gimnasio" && git push');
await send_telegram(user, `📄 Borrador listo: ${preview_url}`);
```

---

## 📝 Scripts de Implementación

### orquestador_v4.py

```python
#!/usr/bin/env python3
"""
Orquestador JuanBlog v4 - Arquitectura Robusta
Principio: OpenRouter = SOLO TEXTO, Kimi Local = TOOLS
"""

import asyncio
from dataclasses import dataclass
from typing import Optional, List, Dict
import json

@dataclass
class AgentConfig:
    model: str
    timeout_ms: int
    fallback: Optional[str] = None

AGENTS = {
    'researcher': AgentConfig(
        model='openrouter/perplexity/sonar-pro',
        timeout_ms=60000,
        fallback='kimi_search'
    ),
    'news_scout': AgentConfig(
        model='openrouter/openai/gpt-4o-mini', 
        timeout_ms=30000,
        fallback='web_search'
    ),
    'fact_checker': AgentConfig(
        model='openrouter/openai/gpt-4o-mini',
        timeout_ms=30000,
        fallback=None  # Skip if fails
    ),
    'escritor': AgentConfig(
        model='openrouter/anthropic/claude-opus-4.5',
        timeout_ms=300000,  # 5 min
        fallback='openrouter/anthropic/claude-opus-4'
    ),
    'revisor': AgentConfig(
        model='kimi-coding/k2p5',
        timeout_ms=120000,
        fallback=None  # Local, no falla por red
    )
}

async def spawn_text_only(agent_name: str, prompt: str) -> str:
    """
    Spawn un agente que SOLO devuelve texto.
    Sin tools, sin file access, solo LLM puro.
    """
    config = AGENTS[agent_name]
    
    try:
        # sessions_spawn con tools=[] explícito
        result = await sessions_spawn(
            model=config.model,
            prompt=prompt,
            timeout_ms=config.timeout_ms,
            tools=[],  # CRÍTICO: sin tools
            cleanup='immediate'
        )
        return result.text
    except (NetworkError, TimeoutError) as e:
        if config.fallback:
            print(f"⚠️ {agent_name} falló, usando fallback...")
            return await spawn_fallback(config.fallback, prompt)
        raise

async def run_research_parallel(tema: str, agentes_activos: Dict[str, bool]) -> dict:
    """
    Ejecuta agentes de research en paralelo.
    Retorna dict con resultados por agente.
    """
    tasks = {}
    
    if agentes_activos.get('researcher'):
        tasks['researcher'] = spawn_text_only('researcher', 
            PROMPT_RESEARCHER.format(tema=tema))
    
    if agentes_activos.get('news_scout'):
        tasks['news_scout'] = spawn_text_only('news_scout',
            PROMPT_NEWS_SCOUT.format(tema=tema))
    
    if agentes_activos.get('fact_checker'):
        tasks['fact_checker'] = spawn_text_only('fact_checker',
            PROMPT_FACT_CHECKER.format(tema=tema))
    
    # Ejecutar en paralelo
    results = await asyncio.gather(
        *tasks.values(),
        return_exceptions=True
    )
    
    return {
        name: result 
        for name, result in zip(tasks.keys(), results)
        if not isinstance(result, Exception)
    }

async def pipeline_completo(tema: str, modo: str = 'auto') -> str:
    """
    Pipeline completo v4.
    Returns: URL del draft publicado
    """
    # 1. Analizar tema
    agentes = analizar_tema(tema) if modo == 'auto' else get_mode_config(modo)
    
    # 2. Research paralelo (sin tools)
    contexto = {}
    if any(agentes.values()):
        contexto = await run_research_parallel(tema, agentes)
    
    # 3. Compilar contexto
    contexto_compilado = compilar_contexto(contexto)
    
    # 4. Escritor (sin tools, timeout largo)
    draft = await spawn_text_only('escritor',
        PROMPT_ESCRITOR.format(
            tema=tema,
            contexto=contexto_compilado,
            guia_estilo=GUIA_ESTILO
        )
    )
    
    # 5. Revisor (local, puede fallar gracefully)
    try:
        final_html = await spawn_text_only('revisor',
            PROMPT_REVISOR.format(draft=draft)
        )
    except Exception:
        final_html = draft  # Si revisor falla, usar draft
    
    # 6. SOLO AQUÍ: ejecutar tools (local)
    return await publicar_draft(tema, final_html)

# === PROMPTS ===

PROMPT_RESEARCHER = """
Busca fuentes académicas sobre: {tema}

FORMATO REQUERIDO:
FUENTES:
- "[CITA EXACTA]" - AUTOR, OBRA (referencia)

CONCEPTOS:
- CONCEPTO: Definición breve

No expliques, solo lista.
"""

PROMPT_NEWS_SCOUT = """
Busca actualidad sobre: {tema}

FORMATO:
ACTUALIDAD (2024-2026):
- [TENDENCIA/NOTICIA]: Contexto breve

DATOS RECIENTES:
- [ESTADÍSTICA]: Fuente

Solo hechos verificables recientes.
"""

PROMPT_ESCRITOR = """
{guia_estilo}

CONTEXTO ENRIQUECIDO:
{contexto}

TEMA: {tema}

Escribe el artículo completo en HTML.
Solo el contenido del <body>, sin explicaciones.
"""

PROMPT_REVISOR = """
Revisa este artículo según la guía de estilo JuanBlog:
- Verificar estructura (I-VI)
- Verificar MAYÚSCULAS en conceptos clave
- Verificar momento de éxtasis presente
- Pulir transiciones

ARTÍCULO:
{draft}

Retorna HTML corregido, sin explicaciones.
"""
```

---

## ⚙️ Configuración Recomendada en openclaw.json

### Actualización de Modelos

```json
{
  "models": {
    "providers": {
      "openrouter": {
        "models": [
          {
            "id": "anthropic/claude-opus-4.5",
            "maxTokens": 16384,  // Aumentar para artículos largos
            "contextWindow": 200000
          },
          {
            "id": "anthropic/claude-opus-4",
            "maxTokens": 8192,
            "contextWindow": 200000
          }
        ]
      }
    }
  },
  "agents": {
    "defaults": {
      "subagents": {
        "maxConcurrent": 8,
        "defaultTimeoutMs": 300000  // 5 min default
      }
    }
  }
}
```

### Labels para Tracking

Usar labels descriptivos en spawn:
```
label: "research-kant-perplexity"
label: "writer-opus-kantgimnasio"  
label: "revisor-kimi-kantgimnasio"
```

---

## 📊 Métricas de Éxito

### KPIs para Validar v4

| Métrica | v3 (actual) | v4 (objetivo) |
|---------|-------------|---------------|
| Tasa de timeout | ~30% | <5% |
| Artículos completados sin intervención | ~60% | >95% |
| Tiempo promedio por artículo | ~8 min | ~5 min |
| Errores "Network connection lost" | Frecuentes | 0 |

### Logging Recomendado

```python
# Al iniciar cada agente
log.info(f"[{agent_name}] Starting with model={model}, timeout={timeout}ms")

# Al completar
log.info(f"[{agent_name}] Completed in {duration}ms, tokens={usage}")

# Al fallar
log.error(f"[{agent_name}] Failed: {error}, using fallback={fallback}")
```

---

## 🚀 Plan de Migración

### Fase 1: Inmediata (hoy)
1. ✅ Crear este documento
2. Modificar spawn de escritor para `tools=[]`
3. Aumentar timeout a 5 min para Claude Opus

### Fase 2: Esta semana
1. Implementar `orquestador_v4.py`
2. Añadir fallbacks automáticos
3. Crear wrapper de retry con exponential backoff

### Fase 3: Siguiente semana
1. Implementar paralelismo real de research
2. Dashboard de métricas
3. Tests automatizados del pipeline

---

## 📎 Anexo: Checklist Pre-Artículo

```markdown
## Antes de ejecutar /new

- [ ] Gateway corriendo: `openclaw gateway status`
- [ ] OpenRouter con créditos: Verificar dashboard
- [ ] Conexión estable: No WiFi inestable durante Opus
- [ ] Modo correcto: /new fast | /new | /new research

## Si falla

1. Verificar logs: `openclaw logs --tail 50`
2. Revisar runs: `cat /root/.openclaw/subagents/runs.json`
3. Si timeout de Opus: Reintentar o usar Opus 4 (no 4.5)
4. Si network lost: El orquestador debería haber guardado draft parcial
```

---

*Documento generado: Feb 17, 2026*
*Autor: Claude Opus 4.5 (subagente arquitectura)*
*Validar con: Juan + Kimi Claw*

# 🎯 RESUMEN: Optimización Pipeline JuanBlog v4

## Problema Central Resuelto

**"Network connection lost" en tool `write` desde agentes OpenRouter.**

**Causa raíz:** Los modelos de OpenRouter (Claude Opus, GPT-4o, etc.) intentaban ejecutar tools (write, exec) a través de una conexión de red que puede cortarse durante operaciones largas.

---

## Solución: Arquitectura "Texto Entra, Texto Sale"

### Regla de Oro
```
OpenRouter = SOLO genera texto
Kimi Local = EJECUTA todos los tools
```

### Cambios Clave

| Antes (v3) | Después (v4) |
|------------|--------------|
| Claude Opus ejecutaba `write` directamente | Claude Opus retorna HTML como string |
| Timeout implícito (~2 min) | Timeout explícito: 5 min para Opus |
| Sin fallbacks automáticos | Fallback: Opus 4.5 → Opus 4 → Kimi |
| Tools habilitados para todos | `tools=[]` para modelos OpenRouter |
| Research secuencial | Research paralelo real |

---

## Arquitectura v4

```
┌─────────────────────────────────────────────────┐
│           ORQUESTADOR (Kimi K2.5 Local)         │
│  ✅ Analiza tema                                 │
│  ✅ Coordina agentes                             │
│  ✅ EJECUTA tools (write, git, message)          │
└─────────────────────┬───────────────────────────┘
                      │
    ┌─────────────────┼─────────────────┐
    ▼                 ▼                 ▼
┌────────┐      ┌────────┐       ┌────────┐
│Research│      │News    │       │Fact    │
│Perplxty│      │GPT-4o  │       │GPT-4o  │
│        │      │mini    │       │mini    │
│SOLO    │      │SOLO    │       │SOLO    │
│TEXTO   │      │TEXTO   │       │TEXTO   │
└────┬───┘      └────┬───┘       └────┬───┘
     └───────────────┴────────────────┘
                     │
                     ▼ (contexto)
              ┌────────────┐
              │  Escritor  │
              │Claude Opus │
              │   4.5      │
              │ SOLO TEXTO │
              │ (5 min)    │
              └─────┬──────┘
                    │
                    ▼ (HTML string)
              ┌────────────┐
              │  Revisor   │
              │ Kimi K2.5  │
              │ SOLO TEXTO │
              └─────┬──────┘
                    │
                    ▼ (final HTML)
┌─────────────────────────────────────────────────┐
│           ORQUESTADOR (Kimi K2.5 Local)         │
│  ⬇️ write(docs/drafts/articulo.html)            │
│  ⬇️ exec(git commit && git push)                │
│  ⬇️ message(telegram, "Draft listo")            │
└─────────────────────────────────────────────────┘
```

---

## Implementación Práctica

### 1. Spawn sin Tools
```javascript
// ❌ ANTES (causa "Network connection lost")
await sessions_spawn({
    model: 'openrouter/anthropic/claude-opus-4.5',
    prompt: '...',
    // tools implícitos
});

// ✅ DESPUÉS (robusto)
await sessions_spawn({
    model: 'openrouter/anthropic/claude-opus-4.5',
    prompt: '...',
    tools: [],        // EXPLÍCITO: sin tools
    timeout_ms: 300000  // 5 minutos
});
```

### 2. Timeouts por Modelo
```javascript
const TIMEOUTS = {
    'perplexity/sonar-pro': 60_000,    // 1 min
    'openai/gpt-4o-mini': 30_000,       // 30 seg
    'anthropic/claude-opus-4.5': 300_000, // 5 min
    'anthropic/claude-opus-4': 240_000,   // 4 min
    'kimi-coding/k2p5': 120_000         // 2 min
};
```

### 3. Cadena de Fallbacks
```javascript
async function callEscritor(prompt) {
    try {
        return await spawn('claude-opus-4.5', prompt, 300000);
    } catch (e) {
        console.log('Opus 4.5 falló, intentando Opus 4...');
        try {
            return await spawn('claude-opus-4', prompt, 240000);
        } catch (e2) {
            console.log('Opus 4 falló, usando Kimi local...');
            return await spawn('kimi-coding/k2p5', prompt, 120000);
        }
    }
}
```

---

## Archivos Creados

| Archivo | Descripción |
|---------|-------------|
| `docs/ARQUITECTURA_OPTIMIZADA_V4.md` | Documentación técnica completa |
| `scripts/pipeline_v4.py` | Script de generación de planes |

---

## Comandos Recomendados

### Pipeline Completo
```bash
# Generar plan de ejecución
python scripts/pipeline_v4.py "La autonomía kantiana aplicada al gimnasio moderno" standard

# Modos disponibles:
# fast     - Solo escritor + revisor (~3.5¢)
# standard - Auto-detect research (~4-5¢) 
# research - Todos los agentes (~5-6¢)
```

### Para el Orquestador (Kimi Claw)
```
1. Analizar tema → detectar agentes
2. Spawn research PARALELO (tools=[])
3. Compilar contexto de todos
4. Spawn escritor (tools=[], timeout=5min)
5. Spawn revisor (tools=[])
6. LOCALMENTE: write + git + message
```

---

## Métricas Esperadas

| Métrica | v3 | v4 |
|---------|----|----|
| Timeouts | ~30% | <5% |
| "Network lost" | Frecuente | 0 |
| Artículos sin intervención | ~60% | >95% |
| Tiempo promedio | ~8 min | ~5 min |

---

## Próximos Pasos

1. **Inmediato:** Aplicar `tools=[]` a todos los spawn de OpenRouter
2. **Esta semana:** Implementar retry con exponential backoff
3. **Siguiente:** Dashboard de métricas de pipeline

---

*Generado por subagente opus-45-arquitectura*
*Feb 17, 2026*

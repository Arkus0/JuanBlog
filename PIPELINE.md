# PIPELINE JUANBLOG v3 - Agentes Híbridos (FINAL)

## Arquitectura Confirmada (Feb 2026)

### Agentes Base (Siempre activos)
| Agente | Modelo | Coste | Rol |
|--------|--------|-------|-----|
| **Orquestador** | Kimi Claw (yo) | - | Decisión, coordinación, publicación |
| **Escritor** | `anthropic/claude-opus-4.5` | ~3¢ | Escritura creativa premium |
| **Revisor** | `kimi-coding/k2.5` | ~0.5¢ | Pulido, formato, consistencia |

### Agentes Research (Bajo demanda - Paralelo)
| Agente | Modelo | Coste | Rol | Trigger |
|--------|--------|-------|-----|---------|
| **Researcher** | `perplexity/sonar` | ~1¢ | Fuentes académicas, citas exactas | Filosofía, historia, teoría |
| **News Scout** | `openai/gpt-4o-mini` | ~0.2¢ | Actualidad, tendencias | Temas con componente actual |
| **Fact Checker** | `openai/gpt-4o-mini` | ~0.2¢ | Verificación de datos | Estadísticas, cifras |

## Costes por Modo

| Modo | Agentes activos | Coste total | Tiempo |
|------|-----------------|-------------|--------|
| **Fast** | Base solo | ~3.5¢ | ~2 min |
| **Standard** | Base + 1 research | ~4.5¢ | ~3 min |
| **Research** | Base + 2 research | ~4.7¢ | ~3.5 min |
| **Full** | Base + 3 research | ~4.9¢ | ~4 min |

## Flujo de Ejecución (Paralelo)

```
Usuario: /new [tema]
    ↓
Orquestador analiza tema
    ↓
[DECISIÓN] ¿Qué agentes activar?
    ↓
┌─────────────────────────────────────┐
│  EJECUCIÓN PARALELA (si aplica)     │
│                                     │
│  ├─ Researcher ──────┐              │
│  ├─ News Scout ──────┼──→ Contexto  │
│  └─ Fact Checker ────┘              │
└─────────────────────────────────────┘
    ↓
Compila contexto de todos los agentes
    ↓
Envía a Escritor (Claude Opus 4.5)
    ↓
Revisa con Revisor (Kimi K2.5)
    ↓
Publica en GitHub Pages
```

## Ventajas del Paralelismo

- **Researcher** busca citas filosóficas mientras **News Scout** busca actualidad
- **Fact Checker** verifica datos simultáneamente
- Todo el contexto llega junto al Escritor
- Reducción de tiempo total (vs. secuencial)

## Comandos

| Comando | Descripción | Research |
|---------|-------------|----------|
| `/new [tema]` | Artículo estándar | Auto-detect |
| `/new research [tema]` | Forzar research completo | Sí (todos) |
| `/new fast [tema]` | Modo rápido | No |

## Lógica de Decisión (scripts/orquestador.py)

El orquestador analiza el tema y decide:
- **Researcher**: Si detecta filosofía, historia, conceptos teóricos
- **News Scout**: Si detecta actualidad, años recientes, tendencias
- **Fact Checker**: Si detecta números, porcentajes, estadísticas

## Notas

- Researcher usa Perplexity Sonar (mejor en pruebas comparativas)
- News Scout y Fact Checker usan GPT-4o-mini (rápido y barato)
- Todo research se pasa al Escritor como contexto enriquecido
- Los agentes research son **opcionales** y **paralelos**
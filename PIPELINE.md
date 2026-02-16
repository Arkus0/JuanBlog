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

## Prompt del Escritor (Claude Opus 4.5)

El system prompt SIEMPRE incluye:

```
Eres un ensayista político-filosófico con estilo beligerante y sofisticado. 
Tu referencia es "El Crepúsculo de los Invertebrados" de JuanBlog.

ESTILO OBLIGATORIO:
- Apertura: "Contemplamos el espectáculo..." o similar impactante
- Tono: Denso, intelectual, MAYÚSCULAS para énfasis conceptual
- Citas filosóficas: Asume que el lector conoce a los autores (Nietzsche, Foucault, Deleuze, Schmitt, Kant, Evola, Jünger)
- Referencias precisas: obra + referencia cuando aplique
- Segunda persona directa: "Tú que lees esto..."

ESTRUCTURA:
- I. El diagnóstico
- II. La genealogía / contexto
- III. [Concepto] como categoría metapolítica
- IV. La ley de hierro / consecuencias
- V. Éxtasis / Visión (momento donde el argumento se disuelve en poesía)
- VI. Conclusión (sin resumir, que propulse)

MOMENTO DE ÉXTASIS:
En algún punto, el texto debe tener un momento de visión donde lo filosófico 
se disuelva brevemente en experiencia pura: transmutación, gesto puro, 
voluntad desnuda. No es esoterismo barato; es la experiencia intensificada.

PROHIBIDO:
- Explicar quién es el filósofo citado
- "Según estudios..."
- Conclusión que resume
- Lenguaje de coach motivacional
- Estructura de Libros (eso es para lo esotérico puro)

El lector quiere INICIACIÓN INTELECTUAL con VISLUMBRES DE TRASCENDENCIA.
```

Más el contexto de research si aplica.

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
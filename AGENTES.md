# AGENTES ESPECIALIZADOS - JuanBlog Pipeline v3

## Arquitectura de Agentes (Confirmada Feb 2026)

### Visión General
Sistema de agentes híbridos donde los agentes de research ejecutan en **paralelo** para enriquecer el contexto que recibe el escritor creativo.

```
┌─────────────────────────────────────────────┐
│           ORQUESTADOR (Kimi Claw)           │
│         Analiza tema → Decide agentes       │
└──────────────────┬──────────────────────────┘
                   ↓
        ┌─────────────────────┐
        │   RESEARCH LAYER    │  ← Paralelo
        │  (Bajo demanda)     │
        └─────────────────────┘
                   ↓
        ┌─────────────────────┐
        │   WRITING LAYER     │  ← Secuencial
        │  (Siempre activo)   │
        └─────────────────────┘
```

## Agentes de Research (Paralelos)

### 1. Researcher
- **Modelo:** `perplexity/sonar`
- **Coste:** ~1¢ por consulta
- **Especialidad:** Fuentes académicas, citas exactas, contexto filosófico
- **Ganador en pruebas:** Mejor conectando Kant con temas contemporáneos
- **Trigger:** Filosofía, historia, teoría, conceptos abstractos

**Ejemplo de salida:**
```
FUENTES:
- "Suponiendo que no hubiera semejantes deberes..." - MdS, Ak. VI: 417-418
- Concepto: Autonomía como capacidad de darse la ley moral
```

### 2. News Scout
- **Modelo:** `openai/gpt-4o-mini`
- **Coste:** ~0.2¢ por consulta
- **Especialidad:** Actualidad, tendencias, contexto temporal
- **Trigger:** Años recientes, crisis, elecciones, tecnología, "hoy"

**Ejemplo de salida:**
```
ACTUALIDAD:
- Tendencia fitness 2025: Auge del entrenamiento funcional
- Dato: Industria wellness valorada en $X billones
```

### 3. Fact Checker
- **Modelo:** `openai/gpt-4o-mini`
- **Coste:** ~0.2¢ por consulta
- **Especialidad:** Verificación de datos, estadísticas, cifras
- **Trigger:** Porcentajes, números, "estudio dice", datos concretos

**Ejemplo de salida:**
```
DATOS VERIFICADOS:
- 70% de gimnasios cierran en primer año: Fuente [estudio X]
- Tasa de abandono: 80% tras 5 meses
```

## Agentes de Escritura (Secuenciales)

### 4. Escritor (Claude Opus 4.5)
- **Coste:** ~3¢
- **Rol:** Generar borrador literario con el contexto enriquecido
- **Input:** Tema + Contexto de research (si aplica)
- **Output:** Artículo en formato HTML

### 5. Revisor (Kimi K2.5)
- **Coste:** ~0.5¢
- **Rol:** Pulido final, formato, consistencia de voz
- **Input:** Borrador del Escritor
- **Output:** Versión final lista para publicar

## Flujo Paralelo en Detalle

```
Tiempo →

T0: Orquestador recibe tema
    ↓
T1: Análisis de tema (100ms)
    ↓
T2: Lanza agentes research en PARALELO
    ├─ Researcher buscando ──────┐
    ├─ News Scout buscando ──────┼──→ T3: Resultados listos
    └─ Fact Checker buscando ────┘
    ↓
T3: Compila contexto
    ↓
T4: Envía a Escritor
    ↓
T5: Revisión
    ↓
T6: Publicación
```

**Tiempo ahorrado vs. secuencial:** ~30-40%

## Decisiones de Activación

El orquestador usa `scripts/orquestador.py` para decidir:

```python
if "filosofía" or "Nietzsche" or "Kant" in tema:
    activar Researcher
    
if "2025" or "actualidad" or "crisis" in tema:
    activar News Scout
    
if "70%" or "estadística" or "dato" in tema:
    activar Fact Checker
```

## Ventajas del Sistema

1. **Especialización:** Cada agente hace lo que mejor sabe
2. **Paralelismo:** Research simultáneo reduce tiempo total
3. **Escalabilidad:** Fácil añadir más agentes especializados
4. **Coste optimizado:** Solo pagas por los agentes que necesitas
5. **Calidad:** Claude Opus recibe contexto enriquecido, escribe mejor

## Futuras Expansiones

Posibles agentes adicionales:
- **Quote Master:** Especialista en encontrar citas exactas
- **Counter-Argument:** Busca argumentos contrarios para enriquecer
- **Style Matcher:** Adapta el tono a referencias específicas
- **SEO Optimizer:** Optimiza títulos y estructura para web

## Documentación Relacionada

- `PIPELINE.md` - Flujo completo y costes
- `scripts/orquestador.py` - Lógica de decisión
- `MEMORY.md` - Configuración y lecciones aprendidas
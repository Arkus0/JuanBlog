# PIPELINE JUANBLOG v3 - Agentes Híbridos

## Configuración Actual

### Agentes Base (Siempre)
- **Orquestador**: Kimi Claw (yo)
- **Escritor**: Claude Opus 4.5 (~3¢)
- **Revisor**: Kimi K2.5 (~0.5¢)

### Agentes Research (Bajo demanda)
- **Researcher**: Kimi K2.5 + web_search (~1¢)
- **News Scout**: Kimi K2.5 + web_search (~1¢)
- **Fact Checker**: Kimi K2.5 + web_search (~1¢)

## Lógica de Decisión

```python
def decidir_research(tema):
    """Decide qué agentes de research activar"""
    
    tema_lower = tema.lower()
    agentes = []
    
    # Researcher: Temas que necesitan fundamentación
    palabras_researcher = [
        'filosofía', 'nietzsche', 'foucault', 'schmitt', 'evola', 'deleuze',
        'historia', 'científico', 'estudio', 'investigación', 'teoría',
        'política', 'económico', 'social', 'cultural'
    ]
    if any(p in tema_lower for p in palabras_researcher):
        agentes.append('researcher')
    
    # News Scout: Temas con componente actual
    palabras_news = [
        'actualidad', 'hoy', '2024', '2025', '2026', 'crisis', 'guerra',
        'elecciones', 'gobierno', 'tendencia', 'moderno', 'contemporáneo'
    ]
    if any(p in tema_lower for p in palabras_news):
        agentes.append('news_scout')
    
    # Fact Checker: Temas con datos/estadísticas
    palabras_facts = [
        'porcentaje', 'estadística', 'dato', 'cifra', 'millones', 'por ciento',
        'aumento', 'disminución', 'tasa', 'índice'
    ]
    if any(p in tema_lower for p in palabras_facts):
        agentes.append('fact_checker')
    
    return agentes
```

## Comandos

| Comando | Descripción | Research |
|---------|-------------|----------|
| `/new [tema]` | Artículo estándar | Auto-detect |
| `/new research [tema]` | Forzar research completo | Sí |
| `/new fast [tema]` | Modo rápido | No |

## Ejemplos de Decisión

| Tema | Researcher | News Scout | Fact Checker |
|------|------------|------------|--------------|
| "Nietzsche y el gimnasio" | ✅ | ❌ | ❌ |
| "Crisis política actual" | ✅ | ✅ | ❌ |
| "Por qué el 70% abandona" | ❌ | ❌ | ✅ |
| "El futuro del trabajo 2025" | ✅ | ✅ | ❌ |
| "Dejar de fumar" (personal) | ❌ | ❌ | ❌ |

## Flujo con Research

```
Usuario: /new [tema]
    ↓
Orquestador analiza tema → decide agentes
    ↓
[Si Researcher] → Busca citas, filosofía, contexto histórico
[Si News Scout] → Busca noticias recientes, tendencias
[Si Fact Checker] → Verifica datos, estadísticas
    ↓
Compila contexto en formato:
    ---
    CONTEXTO PARA ESCRITOR:
    - Fuentes filosóficas: [citas]
    - Contexto actual: [noticias]
    - Datos verificados: [cifras]
    ---
    ↓
Envía a Claude Opus con contexto
    ↓
Revisa con Kimi K2.5
    ↓
Publica
```

## Costes Estimados

| Modo | Coste | Tiempo |
|------|-------|--------|
| Fast (solo base) | ~3.5¢ | ~2 min |
| Standard (auto) | ~3.5-5.5¢ | ~3 min |
| Research completo | ~6.5¢ | ~4 min |

## Notas

- Researcher usa `kimi_search` para fuentes académicas
- News Scout usa `kimi_search` con freshness=pw (última semana)
- Fact Checker verifica cifras específicas mencionadas
- Todo el research se incluye en el system prompt de Claude
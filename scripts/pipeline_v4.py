#!/usr/bin/env python3
"""
Pipeline JuanBlog v4 - Implementación Robusta

PRINCIPIOS:
1. OpenRouter = SOLO TEXTO (nunca tools)
2. Kimi Local = TOOLS (write, git, message)
3. Retry con fallback automático
4. Timeouts generosos para modelos lentos

Uso:
    python pipeline_v4.py "Tema del artículo" [fast|standard|research]
"""

import sys
import json
import re
from dataclasses import dataclass, field
from typing import Optional, Dict, List, Any
from enum import Enum

# === CONFIGURACIÓN ===

class Modo(Enum):
    FAST = "fast"           # Solo escritor + revisor
    STANDARD = "standard"   # Auto-detect research
    RESEARCH = "research"   # Forzar todos los agentes

@dataclass
class ModelConfig:
    """Configuración de un modelo para OpenClaw"""
    id: str
    timeout_ms: int
    max_tokens: int
    fallback: Optional[str] = None
    
    @property
    def openclaw_id(self) -> str:
        """ID completo para sessions_spawn"""
        if '/' in self.id:
            return f"openrouter/{self.id}"
        return self.id

# Configuración de modelos por rol
MODELS = {
    'researcher': ModelConfig(
        id='perplexity/sonar-pro',
        timeout_ms=60_000,
        max_tokens=4096,
        fallback='fallback_kimi_search'
    ),
    'news_scout': ModelConfig(
        id='openai/gpt-4o-mini',
        timeout_ms=30_000,
        max_tokens=2048,
        fallback='fallback_web_search'
    ),
    'fact_checker': ModelConfig(
        id='openai/gpt-4o-mini',
        timeout_ms=30_000,
        max_tokens=2048,
        fallback=None  # Skip si falla
    ),
    'escritor': ModelConfig(
        id='anthropic/claude-opus-4.5',
        timeout_ms=300_000,  # 5 minutos
        max_tokens=16384,
        fallback='anthropic/claude-opus-4'
    ),
    'escritor_fallback': ModelConfig(
        id='anthropic/claude-opus-4',
        timeout_ms=240_000,  # 4 minutos
        max_tokens=8192,
        fallback='kimi-coding/k2p5'
    ),
    'revisor': ModelConfig(
        id='kimi-coding/k2p5',
        timeout_ms=120_000,
        max_tokens=8192,
        fallback=None  # Local, muy confiable
    )
}

# === DETECCIÓN DE TEMA ===

KEYWORDS = {
    'researcher': [
        'filosofía', 'filosófico', 'nietzsche', 'foucault', 'kant', 'hegel',
        'schmitt', 'evola', 'deleuze', 'heidegger', 'platón', 'aristóteles',
        'historia', 'teoría', 'concepto', 'metafísica', 'ontología',
        'política', 'económico', 'social', 'antropología', 'psicología'
    ],
    'news_scout': [
        'actualidad', 'actual', 'hoy', '2024', '2025', '2026', 'crisis',
        'guerra', 'elecciones', 'tendencia', 'moderno', 'contemporáneo',
        'mercado', 'industria', 'tecnología', 'digital', 'ia'
    ],
    'fact_checker': [
        'porcentaje', 'estadística', 'dato', 'cifra', 'millones',
        'por ciento', '%', 'estudio', 'investigación', 'número'
    ]
}

def detectar_agentes(tema: str) -> Dict[str, bool]:
    """Detecta qué agentes de research necesita el tema."""
    tema_lower = tema.lower()
    
    result = {
        'researcher': False,
        'news_scout': False,
        'fact_checker': False
    }
    
    for agente, keywords in KEYWORDS.items():
        if any(kw in tema_lower for kw in keywords):
            result[agente] = True
    
    # Reglas adicionales
    if re.search(r'20(2[4-9]|3\d)', tema):  # Años 2024-2039
        result['news_scout'] = True
    
    if re.search(r'\d+\s*%', tema):  # Porcentajes
        result['fact_checker'] = True
    
    return result

# === PROMPTS ===

PROMPT_RESEARCHER = """Busca fuentes académicas y filosóficas sobre: {tema}

INSTRUCCIONES:
- Citas EXACTAS con referencia (autor, obra, página/sección si disponible)
- Conceptos clave con definiciones breves
- Contexto histórico-filosófico relevante

FORMATO DE RESPUESTA:

## CITAS
- "[CITA TEXTUAL]" — AUTOR, *Obra* (referencia)

## CONCEPTOS CLAVE
- **CONCEPTO**: Definición breve

## CONTEXTO
- Breve contexto histórico o intelectual

Solo información verificable. Sin introducciones ni conclusiones."""

PROMPT_NEWS_SCOUT = """Busca información de actualidad sobre: {tema}

INSTRUCCIONES:
- Tendencias recientes (2024-2026)
- Datos y estadísticas actuales
- Contexto contemporáneo relevante

FORMATO DE RESPUESTA:

## TENDENCIAS ACTUALES
- [TENDENCIA]: Descripción breve

## DATOS RECIENTES
- [ESTADÍSTICA]: Fuente

## CONTEXTO CONTEMPORÁNEO
- Breve descripción del panorama actual

Solo hechos verificables. Sin opiniones."""

PROMPT_FACT_CHECKER = """Verifica datos sobre: {tema}

INSTRUCCIONES:
- Estadísticas con fuentes
- Cifras verificables
- Correcciones de mitos comunes

FORMATO DE RESPUESTA:

## DATOS VERIFICADOS
- [DATO]: Fuente confiable

## MITOS A EVITAR
- [AFIRMACIÓN COMÚN]: Por qué es incorrecta/matizable

Solo datos contrastados."""

PROMPT_ESCRITOR = """Eres un ensayista político-filosófico con estilo beligerante y sofisticado.
Tu referencia es el corpus de JuanBlog.

ESTILO OBLIGATORIO:
- Apertura impactante: "Contemplamos el espectáculo..." o similar
- Tono: Denso, intelectual, MAYÚSCULAS para énfasis conceptual
- Citas filosóficas: Asume que el lector conoce a los autores
- Segunda persona directa: "Tú que lees esto..."
- Referencias precisas cuando las tengas

ESTRUCTURA:
I. El diagnóstico (problema central)
II. La genealogía (contexto, cómo llegamos aquí)
III. [Concepto] como categoría metapolítica
IV. La ley de hierro (consecuencias)
V. Éxtasis (momento donde el argumento se disuelve en experiencia pura)
VI. Conclusión (propulsiva, no resumen)

MOMENTO DE ÉXTASIS:
En algún punto, el texto debe tener un momento de visión donde lo filosófico 
se disuelva brevemente en experiencia pura: transmutación, gesto puro, voluntad desnuda.

PROHIBIDO:
- Explicar quién es el filósofo citado
- "Según estudios..."
- Conclusión que resume lo anterior
- Lenguaje de coach motivacional
- Clichés de autoayuda

---

CONTEXTO ENRIQUECIDO (de research):
{contexto}

---

TEMA: {tema}

Escribe el artículo completo. Retorna SOLO el HTML del contenido (h1, h2, p, blockquote, etc).
Sin etiquetas html, head, body. Sin explicaciones antes o después."""

PROMPT_REVISOR = """Eres el editor senior de JuanBlog. Revisa este artículo:

CHECKLIST:
1. ✓ Estructura I-VI presente
2. ✓ MAYÚSCULAS en conceptos clave (no excesivas)
3. ✓ Momento de éxtasis identificable
4. ✓ Apertura impactante
5. ✓ Sin clichés de autoayuda
6. ✓ Transiciones fluidas
7. ✓ HTML limpio y semántico

ARTÍCULO A REVISAR:
{draft}

INSTRUCCIONES:
- Corrige errores de estilo
- Ajusta mayúsculas si faltan o sobran
- Mejora transiciones flojas
- Verifica que el éxtasis esté presente

Retorna SOLO el HTML corregido. Sin explicaciones."""

# === PLANTILLA HTML ===

HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{titulo} | JuanBlog</title>
    <style>
        :root {{
            --bg: #0f172a;
            --text: #f8fafc;
            --accent: #ef4444;
            --muted: #94a3b8;
        }}
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: var(--bg);
            color: var(--text);
            line-height: 1.8;
            padding: 2rem;
        }}
        article {{
            max-width: 720px;
            margin: 0 auto;
            padding: 2rem 0;
        }}
        h1 {{
            font-family: 'Space Grotesk', sans-serif;
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
            background: linear-gradient(135deg, var(--text), var(--accent));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }}
        .subtitle {{
            font-size: 1.2rem;
            color: var(--muted);
            margin-bottom: 2rem;
            font-style: italic;
        }}
        .meta {{
            display: flex;
            gap: 1rem;
            margin-bottom: 3rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid rgba(148, 163, 184, 0.2);
            color: var(--muted);
            font-size: 0.9rem;
        }}
        .status {{
            position: fixed;
            top: 1rem;
            right: 1rem;
            background: var(--accent);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            font-weight: 600;
            font-size: 0.85rem;
        }}
        h2 {{
            font-family: 'Space Grotesk', sans-serif;
            font-size: 1.5rem;
            margin: 2.5rem 0 1rem;
            color: var(--accent);
        }}
        p {{
            margin-bottom: 1.5rem;
        }}
        blockquote {{
            border-left: 3px solid var(--accent);
            padding-left: 1.5rem;
            margin: 2rem 0;
            color: var(--muted);
            font-style: italic;
        }}
        .actions {{
            position: fixed;
            bottom: 1.5rem;
            right: 1.5rem;
            display: flex;
            gap: 0.5rem;
        }}
        .btn {{
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
            font-size: 0.9rem;
            transition: transform 0.2s;
        }}
        .btn:hover {{ transform: translateY(-2px); }}
        .btn-approve {{ background: #22c55e; color: white; }}
        .btn-revise {{ background: #f59e0b; color: white; }}
    </style>
</head>
<body>
    <div class="status">BORRADOR v{version}</div>
    <article>
        {contenido}
    </article>
    <div class="actions">
        <button class="btn btn-revise" onclick="alert('Responde en Telegram: /revise [instrucciones]')">📝 Cambios</button>
        <button class="btn btn-approve" onclick="alert('Responde en Telegram: /approve')">✅ Aprobar</button>
    </div>
</body>
</html>"""

# === GENERACIÓN DE COMANDOS ===

def generar_spawn_command(rol: str, prompt: str, label: str) -> dict:
    """
    Genera el comando para sessions_spawn.
    CLAVE: tools=[] para modelos OpenRouter.
    """
    config = MODELS[rol]
    
    return {
        'model': config.openclaw_id,
        'prompt': prompt,
        'label': label,
        'timeout_ms': config.timeout_ms,
        'tools': [],  # CRÍTICO: sin tools para OpenRouter
        'cleanup': 'immediate'
    }

def generar_plan_ejecucion(tema: str, modo: str) -> dict:
    """
    Genera el plan completo de ejecución del pipeline.
    Retorna estructura que el orquestador puede seguir.
    """
    # Detectar agentes según modo
    if modo == 'fast':
        agentes = {'researcher': False, 'news_scout': False, 'fact_checker': False}
    elif modo == 'research':
        agentes = {'researcher': True, 'news_scout': True, 'fact_checker': True}
    else:  # standard/auto
        agentes = detectar_agentes(tema)
    
    plan = {
        'tema': tema,
        'modo': modo,
        'agentes_research': agentes,
        'pasos': []
    }
    
    # Paso 1: Research paralelo (si aplica)
    research_spawns = []
    if agentes['researcher']:
        research_spawns.append(generar_spawn_command(
            'researcher',
            PROMPT_RESEARCHER.format(tema=tema),
            f'research-{_slugify(tema)[:20]}'
        ))
    
    if agentes['news_scout']:
        research_spawns.append(generar_spawn_command(
            'news_scout', 
            PROMPT_NEWS_SCOUT.format(tema=tema),
            f'news-{_slugify(tema)[:20]}'
        ))
    
    if agentes['fact_checker']:
        research_spawns.append(generar_spawn_command(
            'fact_checker',
            PROMPT_FACT_CHECKER.format(tema=tema),
            f'facts-{_slugify(tema)[:20]}'
        ))
    
    if research_spawns:
        plan['pasos'].append({
            'nombre': 'research_paralelo',
            'tipo': 'parallel',
            'spawns': research_spawns,
            'descripcion': f'Ejecutar {len(research_spawns)} agentes de research en paralelo'
        })
    
    # Paso 2: Escritor (después de research)
    plan['pasos'].append({
        'nombre': 'escritor',
        'tipo': 'sequential',
        'spawn': generar_spawn_command(
            'escritor',
            'PLACEHOLDER_CONTEXTO',  # Se reemplaza con contexto compilado
            f'writer-{_slugify(tema)[:20]}'
        ),
        'descripcion': 'Claude Opus 4.5 escribe el artículo (5 min timeout)',
        'fallback': {
            'model': 'openrouter/anthropic/claude-opus-4',
            'timeout_ms': 240_000
        }
    })
    
    # Paso 3: Revisor
    plan['pasos'].append({
        'nombre': 'revisor',
        'tipo': 'sequential',
        'spawn': generar_spawn_command(
            'revisor',
            'PLACEHOLDER_DRAFT',  # Se reemplaza con draft del escritor
            f'revisor-{_slugify(tema)[:20]}'
        ),
        'descripcion': 'Kimi K2.5 revisa y pule (local, confiable)'
    })
    
    # Paso 4: Publicación (SOLO AQUÍ se usan tools)
    plan['pasos'].append({
        'nombre': 'publicacion',
        'tipo': 'local_tools',
        'acciones': [
            'write: docs/drafts/{slug}.html',
            'exec: git add . && git commit && git push',
            'message: Notificar usuario en Telegram'
        ],
        'descripcion': 'Orquestador (Kimi local) ejecuta tools'
    })
    
    return plan

def _slugify(text: str) -> str:
    """Convierte texto a slug."""
    return re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-')

# === MAIN ===

def main():
    if len(sys.argv) < 2:
        print("Uso: python pipeline_v4.py 'tema' [fast|standard|research]")
        print("\nModos:")
        print("  fast     - Solo escritor + revisor (~3.5¢)")
        print("  standard - Auto-detect research (~4-5¢)")
        print("  research - Todos los agentes (~5-6¢)")
        sys.exit(1)
    
    tema = sys.argv[1]
    modo = sys.argv[2] if len(sys.argv) > 2 else 'standard'
    
    print(f"🎯 Pipeline JuanBlog v4")
    print(f"📝 Tema: {tema}")
    print(f"⚙️  Modo: {modo}")
    print()
    
    # Generar plan
    plan = generar_plan_ejecucion(tema, modo)
    
    # Mostrar agentes de research
    agentes = plan['agentes_research']
    print("🔍 Agentes de Research:")
    for agente, activo in agentes.items():
        status = "✓ ACTIVO" if activo else "✗ Inactivo"
        print(f"   {agente}: {status}")
    print()
    
    # Mostrar pasos
    print("📋 Plan de Ejecución:")
    for i, paso in enumerate(plan['pasos'], 1):
        print(f"   {i}. {paso['nombre']}: {paso['descripcion']}")
    print()
    
    # Exportar plan como JSON
    print("📄 Plan exportado:")
    print(json.dumps(plan, indent=2, ensure_ascii=False))
    
    return plan

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Agente Orquestador - JuanBlog Pipeline v3
Decide qué agentes de research activar según el tema.
"""

import re
import sys

def analizar_tema(tema):
    """
    Analiza el tema y decide qué agentes de research activar.
    Retorna: {'researcher': bool, 'news_scout': bool, 'fact_checker': bool}
    """
    tema_lower = tema.lower()
    
    # Palabras clave para Researcher (fuentes académicas, filosofía, historia)
    palabras_researcher = [
        'filosofía', 'filosofico', 'filosófico', 'nietzsche', 'foucault', 'schmitt', 
        'evola', 'deleuze', 'heidegger', 'sartre', 'camus', 'platon', 'aristoteles',
        'historia', 'histórico', 'científico', 'ciencia', 'estudio', 'investigación', 
        'teoría', 'teoria', 'concepto', 'escuela', 'pensador', 'filósofo',
        'política', 'politica', 'político', 'económico', 'economico', 'social', 
        'cultural', 'antropología', 'psicología', 'sociología'
    ]
    
    # Palabras clave para News Scout (actualidad, tendencias)
    palabras_news = [
        'actualidad', 'actual', 'hoy', '2024', '2025', '2026', 'crisis', 'guerra',
        'elecciones', 'gobierno', 'tendencia', 'moderno', 'contemporáneo', 'reciente',
        'último', 'ultimo', 'nuevo', 'actualmente', 'hoy en día', 'presente',
        'mercado', 'industria', 'tecnología', 'tech', 'digital', 'ia', 'inteligencia artificial'
    ]
    
    # Palabras clave para Fact Checker (datos, estadísticas)
    palabras_facts = [
        'porcentaje', 'estadística', 'estadistica', 'dato', 'cifra', 'millones', 
        'miles', 'por ciento', '%', 'aumento', 'disminución', 'disminucion', 
        'tasa', 'índice', 'indice', 'número', 'numero', 'cantidad', 'proporción',
        'proporcion', 'estudio dice', 'investigación muestra', 'según datos',
        'reporta', 'indica', 'demuestra'
    ]
    
    # Detectar
    necesita_researcher = any(p in tema_lower for p in palabras_researcher)
    necesita_news = any(p in tema_lower for p in palabras_news)
    necesita_facts = any(p in tema_lower for p in palabras_facts)
    
    # Reglas adicionales
    
    # Si menciona filósofos específicos → Researcher
    filosofos = ['nietzsche', 'foucault', 'heidegger', 'sartre', 'camus', 'platon', 'aristoteles']
    if any(f in tema_lower for f in filosofos):
        necesita_researcher = True
    
    # Si menciona años recientes → News Scout
    if re.search(r'20(24|25|26)', tema):
        necesita_news = True
    
    # Si tiene números → Fact Checker
    if re.search(r'\d+%|\d+\s*(millones|por ciento)', tema_lower):
        necesita_facts = True
    
    return {
        'researcher': necesita_researcher,
        'news_scout': necesita_news,
        'fact_checker': necesita_facts
    }

def generar_prompt_research(tema, agentes):
    """Genera el prompt de research para los agentes activos."""
    
    prompts = []
    
    if agentes['researcher']:
        prompts.append(f"""RESEARCHER - Busca fuentes académicas y contexto:
Tema: {tema}
Busca:
- Citas relevantes de filósofos o pensadores
- Contexto histórico o teórico
- Conceptos clave relacionados
- Referencias que enriquezcan el artículo

Retorna en formato:
FUENTES:
- [Cita relevante] - [Autor]
- [Concepto clave]: [Breve explicación]
""")
    
    if agentes['news_scout']:
        prompts.append(f"""NEWS SCOUT - Busca contexto de actualidad:
Tema: {tema}
Busca:
- Noticias recientes relacionadas (últimos 6 meses)
- Tendencias actuales sobre el tema
- Eventos relevantes en el mundo
- Datos contextuales recientes

Retorna en formato:
ACTUALIDAD:
- [Hecho reciente]: [Breve descripción]
- [Tendencia]: [Contexto]
""")
    
    if agentes['fact_checker']:
        prompts.append(f"""FACT CHECKER - Verifica datos mencionados:
Tema: {tema}
Busca:
- Estadísticas verificables sobre el tema
- Datos concretos de fuentes confiables
- Cifras actualizadas

Retorna en formato:
DATOS VERIFICADOS:
- [Dato]: [Fuente o contexto]
""")
    
    return "\n\n---\n\n".join(prompts)

def main():
    if len(sys.argv) < 2:
        print("Uso: python orquestador.py 'tema del artículo'")
        sys.exit(1)
    
    tema = sys.argv[1]
    agentes = analizar_tema(tema)
    
    print(f"Tema: {tema}")
    print(f"\nAgentes a activar:")
    for agente, activo in agentes.items():
        estado = "✓ ACTIVO" if activo else "✗ No necesario"
        print(f"  - {agente}: {estado}")
    
    if any(agentes.values()):
        print(f"\n--- PROMPTS DE RESEARCH ---\n")
        print(generar_prompt_research(tema, agentes))
    else:
        print(f"\n→ Modo FAST: Solo base (Claude + Kimi)")

if __name__ == "__main__":
    main()
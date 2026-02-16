# AGENTES ESPECIALIZADOS - JuanBlog Pipeline

## Arquitectura Híbrida (Aprobada)

### Agentes Base (Siempre activos)
| Agente | Modelo | Rol |
|--------|--------|-----|
| Orquestador | Kimi Claw (yo) | Coordinación, decisión de usar research, ensamblaje final |
| Escritor Creativo | Claude Opus 4.5 | Genera borrador literario con estilo JuanBlog |
| Revisor | Kimi K2.5 | Pulido, formato, consistencia de voz |

### Agentes de Research (Bajo demanda)
| Agente | Modelo | Rol | Trigger |
|--------|--------|-----|---------|
| Researcher | Kimi K2.5 | Busca fuentes académicas, citas, datos históricos | Tema filosófico/científico/histórico |
| News Scout | Kimi K2.5 | Hechos de actualidad, tendencias, contexto temporal | Tema con componente actual |
| Fact Checker | Kimi K2.5 | Verifica datos, evita alucinaciones | Cuando hay cifras/estadísticas |

## Flujo de Decisión

```
Usuario: /new [tema]
    ↓
Orquestador analiza tema:
    ¿Necesita fuentes académicas? → SÍ → Activar Researcher
    ¿Necesita contexto actual? → SÍ → Activar News Scout  
    ¿Tiene datos/estadísticas? → SÍ → Activar Fact Checker
    ↓
Recolectar contexto (0-3 agentes)
    ↓
Enviar a Claude Opus: [tema] + [contexto opcional]
    ↓
Revisar con Kimi K2.5
    ↓
Publicar
```

## Criterios de Activación

### Researcher (ON si):
- Tema filosófico → buscar citas de Nietzsche, Foucault, etc.
- Tema histórico → buscar fechas, eventos, contexto
- Tema científico → buscar estudios, datos, teorías
- Referencias específicas solicitadas

### News Scout (ON si):
- Tema político/social → contexto actual
- Tecnología → últimos avances
- Economía → datos recientes
- "¿Qué está pasando ahora con X?"

### Fact Checker (ON si):
- Artículo menciona estadísticas
- Artículo menciona cifras económicas
- Artículo menciona datos de salud
- Cualquier número que parezca específico

## Coste Estimado

| Configuración | Coste aprox. |
|---------------|--------------|
| Base (Claude + Kimi) | ~3.5¢ |
| + Researcher | ~4.5¢ |
| + News Scout | ~4.5¢ |
| + Fact Checker | ~4.5¢ |
| Full stack (todos) | ~6¢ |

## Comandos Telegram

- `/new [tema]` → Orquestador decide research automáticamente
- `/new research [tema]` → Forzar research activo
- `/new fast [tema]` → Forzar modo base (sin research)

## Notas

- Researcher usa búsqueda web (kimi_search) para fuentes
- News Scout usa búsqueda web con freshness=pw (última semana)
- Fact Checker usa búsqueda web para verificar cifras específicas
- Todo el research se pasa a Claude como contexto en el system prompt
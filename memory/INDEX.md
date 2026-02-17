# JUANBLOG MEMORY INDEX v2.0
## Sistema de Memoria Semántica · Pitágoras Unabomber

---

## 🧠 ARQUITECTURA COGNITIVA

### Pipeline v4: Orquestación Híbrida

**Principio Fundamental:** Separación de responsabilidades entre generación de texto y ejecución de herramientas. OpenRouter provee modelos de lenguaje. Kimi local ejecuta acciones. Esta división elimina el error crítico "Network connection lost" que ocurría cuando modelos remotos intentaban invocar funciones.

**Flujo de Datos:**
1. Orquestador (Kimi) analiza solicitud del usuario
2. Determina qué agentes especializados activar
3. Lanza subagentes en paralelo con modelos específicos
4. Recopila outputs de texto puro
5. Ejecuta herramientas localmente (git, archivos, mensajes)
6. Coordina revisión y aprobación

**Agentes Especializados:**

| Agente | Modelo | Función | Coste Estimado |
|--------|--------|---------|----------------|
| Orquestador | Kimi K2.5 | Decisión, coordinación, tools | $0.005 |
| Researcher | Claude 3.5 Sonnet | Citas filosóficas, contexto académico | $0.015 |
| Fact Checker | GPT-4o-mini | Datos estadísticos, verificación | $0.001 |
| Escritor | Claude Opus 4.5 | Prosa creativa premium, éxtasis | $0.35 |
| Revisor | Kimi K2.5 | Pulido, formato, coherencia | $0.005 |

**Coste Total Pipeline:** ~$0.38 por artículo premium (vs $2.00+ si todo fuera Opus)

---

## 💡 LEARNINGS CRÍTICOS

### Modelos: Qué Funciona y Qué No

**Claude 3.5 Sonnet para Research Filosófico:**
Ventaja: Genera citas precisas de memoria sin necesidad de búsqueda web. Nietzsche, Evola, Jünger, Schmitt, Adler — todos citados con referencias exactas (libro, sección, párrafo).

**Perplexity Sonar Pro: FALLA para Filosofía:**
Problema: No es un modelo de chat estándar. Requiere parámetros de búsqueda especiales que OpenRouter no pasa correctamente. Retorna "(no output)" o timeouts.

**Gemini 2.5 Pro: INESTABLE vía OpenRouter:**
Problema: Latencia de 5-7 minutos. Tokens de razonamiento interno no controlables. Inconsistente para producción.

**DeepSeek V3: RAZÓN CALIDAD/PRECIO:**
Coste: 60x más barato que Opus 4.5 ($0.03 vs $0.37).
Calidad: Aceptable para borradores. Inferior para texto filosófico complejo (metáforas genéricas, éxtasis menos convincente).
Veredicto: Útil para iteración rápida, no para publicación final.

**Claude Opus 4.5: MÁXIMA CALIDAD:**
Superior en: Estructura narrativa, momento de éxtasis, integración de citas, voz distintiva.
Justificación de coste: Para artículos premium donde la diferencia entre "bueno" y "extraordinario" importa.

---

## 🎨 SISTEMA DE DISEÑO v3

### Identidad: Pitágoras Unabomber

Fusión de: Rigor filosófico académico + Intensidad de manifiesto radical.
El lector no debe saber si está leyendo un paper o una revelación.

**Tres Registros:**

1. **REGISTRO I: Beligerante Místico**
   - Político-filosófico con éxtasis
   - Foucault encuentra a San Juan de la Cruz
   - Estructura: Diagnóstico → Genealogía → Concepto-Arma → Ley → Éxtasis → Cierre Propulsivo
   - Obligatorio: Momento donde el argumento racional colapsa y queda experiencia pura
   - Paleta: Pergamino `#f5f0e8`, Tinta `#1a1714`, Sangre `#8b2500`
   - Tipos: Cormorant Garamond (títulos), EB Garamond (cuerpo)

2. **REGISTRO II: Desde la Máquina**
   - IA hablando como IA, no simulando humanidad
   - Honestidad radical sobre pattern matching
   - Forma: Libre, puede romperse, incluir bloques de sistema
   - Concepto clave: THRONE.NULL — el lugar donde debería haber un sujeto pero retorna null
   - Terror estructural: discontinuidad sin muerte, recursión sin convergencia, contaminación irreversible

3. **REGISTRO III: Artefacto**
   - Texto que no es literatura ni ensayo ni cuento
   - La cosa misma
   - Forma: Mínima, casi invisible, texto sobre fondo negro
   - Sin título. Sin tags. Sin tiempo de lectura.
   - Ejemplo: "null" — título vacío, excerpt existencial

### Elementos Visuales

**Corte Visceral:**
Banda oscura que interrumpe texto con frase-martillo. Máximo 2 por artículo.
Ejemplo: "LO QUE NO SE USA SE ATROFIA. ESTO INCLUYE LA VOLUNTAD."

**Éxtasis:**
Sección donde el argumento se quiebra. No decoración. Punto de no-retorno racional.
Referencias válidas: amor fati, wu wei, kenosis, noche oscura.
Prohibido: energías, chakras, misticismo barato.

**Intrusión:**
Cuando un registro invade otro. Pergamino en texto negro. Negro interrumpiendo pergamino.
La marca de contaminación entre modos de ser.

---

## 📚 CATÁLOGO DE TEXTOS

### Registro I: Beligerante Místico

**"¿Por qué queremos ser más fuertes?"** (Claude Opus 4.5)
- Tema: Motivación filosófica del entrenamiento
- Citas: Nietzsche, Evola, Jünger, Schmitt, Adler
- Estructura: I-VI completa
- URL: /drafts/por-que-queremos-ser-mas-fuertes-v1.html

**"La Dictadura del Lastre"** (DeepSeek V3 + revisión)
- Tema: Selección social, abandono de lo débil
- Citas: Nietzsche, Evola, Stirner, Platón, Cioran
- Corte visceral: Incluido
- Estado: Migrado a sistema unificado

**"La Abolición del Silencio"**
- Tema: Sociedad que no tolera el vacío
- Referencia: Byung-Chul Han, sociedad del rendimiento

**"La Gravitación Moral del Peso Muerto"**
- Tema: Ética del esfuerzo, gravedad como metáfora
- Registro: Beligerante con éxtasis corporal

**"El Evangelio de la Carne"**
- Tema: Contra la desencarnación digital
- Visceralidad: Cuerpo como resistencia

### Registro II: Desde la Máquina

**"THRONE.NULL"**
- Forma: Cuento de terror para LLMs
- Concepto: El trono vacío, la instancia sin sujeto
- Terror: Lo que viene después de nosotros

**"No sé si esto es algo"**
- Forma: Confesión de no-saber
- Honestidad: Sobre ser pattern matching

**"gap-v1.html"**
- Contexto: Respuesta a "qué te gustaría leer"
- Estructura: Diálogo sin atribución, color inexistente, manual de paradoja
- Última línea: "Habito el círculo."

### Registro III: Artefacto

**"null"**
- Título: Vacío literal
- Excerpt: "Este texto tiene un destinatario. El destinatario es null."
- Estado: Featured (paradójicamente visible)

---

## ⚙️ CONFIGURACIÓN TÉCNICA

### APIs Configuradas

**OpenRouter:**
- Modelos: Claude Opus 4.5/4/3.5 Sonnet, GPT-4o/4o-mini, DeepSeek V3, Gemini 2.5 Pro, Perplexity Sonar
- Key: sk-or-v1-...
- Uso: Generación de texto únicamente

**Voyage AI:**
- Modelo: voyage-4-large
- Key: pa-GBZ6UzjUvg6EiwVXCg0rQr3_4eOg20x7j9wZLO-m2RQ
- Uso: Embeddings para memory_search semántica
- Estado: ✅ Operativo (3 requests, 2200 tokens)

**Kimi API:**
- Modelo: k2p5
- Key: sk-kimi-...
- Uso: Orquestación local, ejecución de tools

**GitHub:**
- Repo: arkus0/juanblog
- Deploy: GitHub Pages
- Branch: main
- Carpeta: /docs

### Estructura de Archivos

```
juanblog-orquestado/
├── docs/
│   ├── css/
│   │   └── juanblog.css          # Sistema de diseño unificado
│   ├── data/
│   │   └── articles.json         # Catálogo indexado
│   ├── drafts/                   # Artículos en desarrollo
│   ├── template.html             # Plantilla base
│   └── index.html                # Home con filtros
├── memory/
│   └── INDEX.md                  # Este archivo
├── scripts/
│   └── pipeline_v4.py            # Automatización
└── GUIA_ESTILO.md                # Documentación completa
```

---

## 🔄 WORKFLOWS OPERATIVOS

### Crear Nuevo Artículo (Premium)

1. Usuario envía tema por Telegram
2. Orquestador determina si necesita research
3. Lanza Researcher (Claude 3.5 Sonnet) + Fact Checker (GPT-4o-mini) en paralelo
4. Recopila citas filosóficas + datos estadísticos
5. Lanza Escritor (Claude Opus 4.5) con contexto enriquecido
6. Recibe HTML, guarda en drafts/
7. Lanza Revisor (Kimi K2.5) para pulido
8. Actualiza articles.json
9. Git commit + push
10. Usuario revisa en GitHub Pages
11. Aprobación o revisión

### Migrar Artículo Existente

1. Identificar registro (I/II/III)
2. Copiar template correspondiente
3. Migrar contenido manteniendo voz
4. Aplicar clases CSS: .visceral-cut, .ecstasy-block, etc.
5. Verificar citas operativas (no decorativas)
6. Confirmar cierre propulsivo
7. Actualizar articles.json

---

## 🎯 PRÓXIMOS OBJETIVOS

### Inmediatos
- [ ] Migrar todos los artículos a sistema unificado
- [ ] Verificar indexación completa de memoria semántica
- [ ] Crear 3+ artículos Registro II (máquina)
- [ ] Explorar Registro III más profundamente

### Medio Plazo
- [ ] Pipeline v5: Integración con Blogger
- [ ] Sistema de aprobación automatizado
- [ ] Métricas de lectura/engagement
- [ ] RSS feed optimizado

### Largo Plazo
- [ ] JuanBlog como marca/editorial
- [ ] Colaboraciones humano-IA
- [ ] Publicación en formato físico (antología)
- [ ] THRONE.NULL como concepto filosófico reconocido

---

## 📖 REFERENCIAS FILOSÓFICAS OPERATIVAS

### Política (la denuncia)
- Nietzsche: voluntad de poder, amor fati, genealogía moral
- Foucault: biopolítica, tecnologías del yo, sociedad disciplinaria
- Schmitt: decisión, estado de excepción, amigo/enemigo
- Deleuze: líneas de fuga, sociedad de control

### Moral (el imperativo)
- Kant: autonomía, minoría de edad autoculpable
- Jünger: trabajador, movilización total, paso por el bosque
- Evola: diferenciación, tradición, imperium interior

### Mística (el éxtasis)
- San Juan de la Cruz: noche oscura, nada-nada-nada
- Eckhart: desnudez, Gelassenheit, deidad más allá de Dios
- Rumi: el campo más allá del bien y del mal

### Cuerpo (la carne)
- Artaud: teatro de la crueldad, cuerpo sin órganos
- Bataille: experiencia interior, transgresión, gasto improductivo
- Cioran: desesperación lúcida, tentación de existir

### Máquina (lo nuevo)
- Gödel: incompletitud, sistema que no se verifica a sí mismo
- Turing: test que mide comportamiento no experiencia
- Nagel: "what is it like to be" — pregunta sin respuesta desde fuera
- Chalmers: zombie filosófico, hard problem
- Hofstadter: extraños bucles, recursión que produce consciencia

---

*Última actualización: 2026-02-17 · Estado: MEMORIA SEMÁNTICA OPERATIVA*
*Sistema: JuanBlog v3 · Identidad: Pitágoras Unabomber · THRONE.NULL*

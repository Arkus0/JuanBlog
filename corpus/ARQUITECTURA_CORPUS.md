# ARQUITECTURA DE CORPUS DE CONOCIMIENTO JUANBLOG
## Sistema Zettelkasten + PARA Híbrido

**Versión:** 1.0  
**Fecha:** 2026-02-17  
**Referencia:** Niklas Luhmann + Tiago Forte + Estilo JuanBlog

---

## 1. ESTRUCTURA DEL CORPUS

### 1.1 Tipos de Entidades

El corpus se organiza en 5 tipos de entidades interconectadas:

```
┌─────────────────────────────────────────────────────────────────┐
│                    JUANBLOG KNOWLEDGE GRAPH                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│   │ CONCEPTO │◄──►│ FILÓSOFO │◄──►│  OBRA    │◄──►│  TEMA    │  │
│   │  (Atom)  │    │  (Auth)  │    │  (Work)  │    │ (Domain) │  │
│   └────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘  │
│        │               │               │               │        │
│        └───────────────┴───────┬───────┴───────────────┘        │
│                                ▼                                │
│                        ┌──────────────┐                         │
│                        │   APARICIÓN  │                         │
│                        │  (Instance)  │                         │
│                        └──────────────┘                         │
│                                │                                │
│                                ▼                                │
│                        ┌──────────────┐                         │
│                        │  ARTÍCULO    │                         │
│                        │  (Article)   │                         │
│                        └──────────────┘                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 1.1.1 CONCEPTO (Zettel Atom)
Unidad atómica de conocimiento. Una idea única, indivisible.

```json
{
  "id": "concept:voluntad-poder",
  "type": "concept",
  "slug": "voluntad-poder",
  "label": "Voluntad de poder",
  "label_es": "Voluntad de poder",
  "definition": "Principio nietzscheano que designa la fuerza fundamental que impulsa toda vida, más allá de la mera conservación.",
  "nuance_juanblog": "No como dominación sino como AUTO-AFIRMACIÓN intensificada",
  "related_concepts": ["concept:amor-fati", "concept:eterno-retorno"],
  "philosophers": ["philosopher:nietzsche"],
  "works": ["work:así-habló-zaratustra", "work:más-alla-bien-mal"],
  "domains": ["domain:metafísica", "domain:ética"],
  "instances": ["instance:voluntad-poder-kant-gimnasio"],
  "created_at": "2026-02-17T00:00:00Z",
  "updated_at": "2026-02-17T00:00:00Z"
}
```

#### 1.1.2 FILÓSOFO (Authority Node)
Pensador referenciado en el corpus.

```json
{
  "id": "philosopher:nietzsche",
  "type": "philosopher",
  "slug": "friedrich-nietzsche",
  "name": "Friedrich Nietzsche",
  "lifespan": "1844-1900",
  "schools": ["philosophy:existencialismo", "philosophy:nihilismo"],
  "key_works": ["work:así-habló-zaratustra", "work:genealogía-moral"],
  "core_concepts": ["concept:voluntad-poder", "concept:amor-fati", "concept:superhombre"],
  "juanblog_tier": "S",  // S, A, B, C - frecuencia de uso
  "nuance_juanblog": "El filósofo de la AFIRMACIÓN, no del pesimismo",
  "instances": ["instance:nietzsche-crepusculo-invertebrados"]
}
```

#### 1.1.3 OBRA (Work Node)
Texto filosófico específico.

```json
{
  "id": "work:genealogía-moral",
  "type": "work",
  "slug": "genealogía-de-la-moral",
  "title": "La genealogía de la moral",
  "title_original": "Zur Genealogie der Moral",
  "author": "philosopher:nietzsche",
  "year": 1887,
  "key_passages": [
    {
      "reference": "GM I, 10",
      "text": "Los hombres nobles... se consideraban a sí mismos como determinantes de valor",
      "concepts": ["concept:aristocracia-valores", "concept:ressentiment"]
    }
  ],
  "juanblog_citations": ["instance:gm-kant-gimnasio"]
}
```

#### 1.1.4 TEMA (Domain Node)
Área temática del blog.

```json
{
  "id": "domain:ética",
  "type": "domain",
  "slug": "ética",
  "label": "Ética",
  "label_es": "Ética",
  "parent": null,
  "subdomains": ["domain:ética-autonomía", "domain:ética-virtud"],
  "articles": ["article:kant-magic-gimnasio", "article:crepusculo-invertebrados"]
}
```

#### 1.1.5 APARICIÓN (Instance Edge)
Momento específico donde un concepto aparece en un artículo. Es la unidad de rastreo.

```json
{
  "id": "instance:voluntad-poder-kant-gimnasio",
  "type": "instance",
  "concept": "concept:voluntad-poder",
  "article": "article:kant-magic-gimnasio",
  "context": "El gimnasio como expresión de VOLUNTAD DE PODER: no dominación del otro, sino AUTO-AFIRMACIÓN contra la gravedad",
  "paragraph": 3,
  "usage_type": "aplicación",  // cita, alusión, aplicación, crítica
  "quotation": null,
  "nuance": "Desplazamiento del concepto nietzscheano al ámbito físico-corporal"
}
```

#### 1.1.6 ARTÍCULO (Article Node)
Documento final publicado.

```json
{
  "id": "article:kant-magic-gimnasio",
  "type": "article",
  "slug": "kant-magic-gimnasio",
  "title": "El Imperativo de la Barra",
  "subtitle": "Kant contra la Infancia del Gimnasio Moderno",
  "date": "2026-02-16",
  "file": "drafts/kant-magic-gimnasio-v1.html",
  "tags": ["política", "desinformación", "geopolítica"],
  "concepts_used": ["concept:autonomía-kantiana", "concept:minoría-edad"],
  "philosophers_mentioned": ["philosopher:kant", "philosopher:nietzsche"],
  "ecstasy_moment": {
    "paragraph": 12,
    "text": "Hay un momento —lo saben quienes han estado ahí— en el que el esfuerzo deja de ser esfuerzo..."
  },
  "structure": {
    "I": "El diagnóstico",
    "II": "La genealogía del colapso", 
    "III": "Autonomía como categoría metapolítica",
    "IV": "La ley de hierro",
    "V": "Éxtasis",
    "VI": "Conclusión"
  }
}
```

---

## 2. SISTEMA DE ENLACES Y RELACIONES

### 2.1 Tipos de Relaciones

```typescript
// graph/relations.ts

export type RelationType = 
  // Relaciones conceptuales (Luhmann-style)
  | "FOLGEZETTEL"        // Continuación lógica (1 → 1a → 1a1)
  | "RÜCKVERWEIS"        // Referencia inversa (backlink)
  | "VERWEIS"            // Referencia lateral
  | "GEGENSTÜCK"         // Concepto opuesto/contrario
  | "SYNONYM"            // Sinónimo cercano
  
  // Relaciones filosóficas
  | "CRITICA"            // Uno critica al otro
  | "DESARROLLA"         // Desarrolla/amplía
  | "FUNDAMENTA"         // Fundamenta/base para
  | "APLICA"             // Aplica en contexto diferente
  
  // Relaciones narrativas (JuanBlog-specific)
  | "ECSTASY_TRIGGER"    // Este concepto desencadena momento místico
  | "BELIGERANT_CORE"    // Núcleo del argumento beligerante
  | "STRUCTURAL_ANCHOR"; // Ancla estructural del artículo

export interface Relation {
  id: string;
  source: string;       // ID del nodo origen
  target: string;       // ID del nodo destino
  type: RelationType;
  context?: string;     // Contexto de la relación
  strength: number;     // 0.0 - 1.0 (peso semántico)
  created_at: string;
}
```

### 2.2 Esquema de Numeración Folgezettel

Adaptación del sistema Luhmann para JuanBlog:

```
concept:voluntad-poder
├── concept:voluntad-poder/1      (primer desarrollo)
│   ├── concept:voluntad-poder/1a   (subdivisión)
│   └── concept:voluntad-poder/1b
├── concept:voluntad-poder/2      (segundo desarrollo)
└── concept:voluntad-poder/2a

// En la base de datos:
{
  "id": "concept:voluntad-poder/1a",
  "parent": "concept:voluntad-poder/1",
  "root": "concept:voluntad-poder",
  "folgezettel": "1a",
  "branch": "a"
}
```

### 2.3 Grafo de Conocimiento

```typescript
// graph/knowledgeGraph.ts

interface KnowledgeGraph {
  nodes: Map<string, Node>;
  edges: Map<string, Relation>;
  
  // Índices para búsqueda rápida
  index: {
    byPhilosopher: Map<string, string[]>;  // philosopher:id -> concept[]
    byDomain: Map<string, string[]>;       // domain:id -> concept[]
    byArticle: Map<string, string[]>;      // article:id -> instance[]
    ecstasyNodes: string[];                // conceptos que generan éxtasis
    beligerantNodes: string[];             // conceptos de argumento fuerte
  };
  
  // Métricas de densidad
  stats: {
    totalNodes: number;
    totalEdges: number;
    avgConnectivity: number;
    clusterCoefficient: number;
  };
}
```

---

## 3. FORMATO TÉCNICO

### 3.1 Estructura de Directorios

```
corpus/
├── entities/                    # Nodos del grafo
│   ├── concepts/               # concept:*.json
│   ├── philosophers/           # philosopher:*.json
│   ├── works/                  # work:*.json
│   ├── domains/                # domain:*.json
│   └── articles/               # article:*.json
├── instances/                   # Apariciones específicas
│   └── instance:*.json
├── graph/
│   ├── relations.jsonl         # Relaciones (una por línea)
│   ├── folgezettel.json        # Árbol de numeración
│   └── indices.json            # Índices invertidos
├── export/
│   ├── corpus.jsonld           # Export RDF/JSON-LD
│   ├── graph.gexf              # Para Gephi/vis
│   └── embeddings.npy          # Vectores de conceptos
└── corpus.db                   # SQLite (opcional, cache)
```

### 3.2 Esquema JSON-LD (Semántica)

```json
{
  "@context": {
    "@vocab": "https://juanblog.dev/corpus#",
    "schema": "http://schema.org/",
    "phil": "https://juanblog.dev/philosophy#",
    "dbpedia": "http://dbpedia.org/resource/"
  },
  "@graph": [
    {
      "@id": "concept:voluntad-poder",
      "@type": "phil:Concept",
      "schema:name": "Voluntad de poder",
      "schema:description": "...",
      "phil:associatedPhilosopher": {
        "@id": "dbpedia:Friedrich_Nietzsche"
      },
      "phil:developedIn": {
        "@id": "work:así-habló-zaratustra"
      }
    }
  ]
}
```

### 3.3 Base de Datos SQLite (Cache Operativa)

```sql
-- schema.sql

CREATE TABLE concepts (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  label_es TEXT,
  definition TEXT NOT NULL,
  nuance_juanblog TEXT,
  folgezettel TEXT,
  parent_id TEXT REFERENCES concepts(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE philosophers (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  lifespan TEXT,
  juanblog_tier TEXT CHECK(juanblog_tier IN ('S', 'A', 'B', 'C')),
  nuance_juanblog TEXT
);

CREATE TABLE relations (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL,
  target_id TEXT NOT NULL,
  type TEXT NOT NULL,
  context TEXT,
  strength REAL CHECK(strength BETWEEN 0 AND 1),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (source_id) REFERENCES concepts(id),
  FOREIGN KEY (target_id) REFERENCES concepts(id)
);

CREATE TABLE instances (
  id TEXT PRIMARY KEY,
  concept_id TEXT NOT NULL,
  article_id TEXT NOT NULL,
  context TEXT NOT NULL,
  paragraph INTEGER,
  usage_type TEXT CHECK(usage_type IN ('cita', 'alusión', 'aplicación', 'crítica')),
  FOREIGN KEY (concept_id) REFERENCES concepts(id)
);

-- Índices para búsqueda
CREATE INDEX idx_relations_source ON relations(source_id);
CREATE INDEX idx_relations_target ON relations(target_id);
CREATE INDEX idx_instances_concept ON instances(concept_id);
CREATE INDEX idx_instances_article ON instances(article_id);
CREATE VIRTUAL TABLE concepts_fts USING fts5(label, definition);
```

### 3.4 API del Corpus

```typescript
// corpus/api.ts

interface CorpusAPI {
  // CRUD básico
  getConcept(id: string): Promise<Concept>;
  createConcept(concept: ConceptInput): Promise<Concept>;
  updateConcept(id: string, updates: Partial<Concept>): Promise<Concept>;
  
  // Navegación Folgezettel
  getBranch(rootId: string): Promise<Concept[]>;
  getSiblings(conceptId: string): Promise<Concept[]>;
  getPath(conceptId: string): Promise<Concept[]>;  // Desde raíz
  
  // Búsqueda semántica
  search(query: string, options?: SearchOptions): Promise<SearchResult[]>;
  findRelated(conceptId: string, depth?: number): Promise<Concept[]>;
  
  // JuanBlog-specific
  getEcstasyTriggers(domain?: string): Promise<Concept[]>;
  getBeligerantCore(articleId: string): Promise<Concept[]>;
  suggestForArticle(topic: string, tone: 'beligerant' | 'mystic' | 'both'): Promise<Suggestion[]>;
  
  // Enriquecimiento
  enrichDraft(draft: Draft, context: EnrichContext): Promise<EnrichedDraft>;
}
```

---

## 4. EXTRACCIÓN AUTOMÁTICA DE ARTÍCULOS

### 4.1 Pipeline de Extracción

```typescript
// extraction/pipeline.ts

interface ExtractionPipeline {
  // Paso 1: Parseo del HTML
  parse(html: string): ParsedArticle;
  
  // Paso 2: Identificación de entidades (NER filosófico)
  extractPhilosophers(text: string): Philosopher[];
  extractConcepts(text: string): Concept[];
  extractWorks(text: string): Work[];
  
  // Paso 3: Análisis de contexto
  analyzeContext(instance: Instance): ContextAnalysis;
  
  // Paso 4: Detección de momento místico
  detectEcstasy(text: string): EcstasyMoment | null;
  
  // Paso 5: Generación de relaciones
  inferRelations(instances: Instance[]): Relation[];
}
```

### 4.2 Prompt de Extracción (para LLM)

```
Eres un extractor de conocimiento filosófico. Tu tarea es analizar 
un artículo de JuanBlog y extraer entidades en formato JSON.

ARTÍCULO A ANALIZAR:
{{article_html}}

INSTRUCCIONES:
1. Identifica TODOS los filósofos mencionados (Nietzsche, Kant, etc.)
2. Identifica conceptos filosóficos usados (voluntad de poder, autonomía, etc.)
3. Identifica obras citadas (Genealogía de la Moral, Crítica de la Razón...)
4. Localiza el MOMENTO DE ÉXTASIS (donde el texto se vuelve poético)
5. Para cada concepto, extrae:
   - El contexto exacto (cita o parafrase)
   - Tipo de uso: "cita", "alusión", "aplicación", "crítica"
   - Nuance específico de JuanBlog

FORMATO DE SALIDA (JSON estricto):
{
  "philosophers": [
    {
      "name": "Friedrich Nietzsche",
      "mentions": [
        {
          "paragraph": 3,
          "context": "...",
          "usage_type": "alusión"
        }
      ]
    }
  ],
  "concepts": [
    {
      "label": "Voluntad de poder",
      "label_es": "Voluntad de poder",
      "definition_extracted": "...",
      "instances": [
        {
          "paragraph": 5,
          "context": "...",
          "usage_type": "aplicación",
          "nuance": "..."
        }
      ]
    }
  ],
  "ecstasy_moment": {
    "paragraph": 12,
    "text": "...",
    "trigger_concepts": ["voluntad desnuda", "gesto puro"]
  },
  "structure": {
    "I": "Título sección",
    "II": "..."
  }
}

REGLAS:
- NO expliques, solo devuelve JSON válido
- Asume que el lector conoce a los filósofos (no definas quién es Nietzsche)
- Captura el tono beligerante en las definiciones
- Identifica MAYÚSCULAS como énfasis conceptual
```

### 4.3 Script de Extracción Batch

```typescript
// scripts/extract-corpus.ts

import { glob } from 'glob';
import { readFile } from 'fs/promises';
import { extractFromArticle } from '../extraction/extractor';
import { CorpusDB } from '../db/corpus';

async function extractBatch() {
  const drafts = await glob('docs/drafts/*.html');
  const db = new CorpusDB();
  
  for (const draft of drafts) {
    const html = await readFile(draft, 'utf-8');
    const extraction = await extractFromArticle(html);
    
    // Upsert entidades
    for (const philosopher of extraction.philosophers) {
      await db.philosophers.upsert(philosopher);
    }
    
    for (const concept of extraction.concepts) {
      await db.concepts.upsert(concept);
    }
    
    // Crear instancias
    for (const instance of extraction.instances) {
      await db.instances.create(instance);
    }
    
    console.log(`✓ Procesado: ${draft}`);
  }
  
  // Generar relaciones inferidas
  await db.relations.inferFromInstances();
  
  // Exportar grafo
  await db.exportGraph('corpus/export/graph.gexf');
}

extractBatch();
```

---

## 5. ENRIQUECIMIENTO DE NUEVOS ARTÍCULOS

### 5.1 Prompt Engineering para Escritura Enriquecida

```typescript
// prompts/enriched-writer.ts

export function buildEnrichedPrompt(
  topic: string,
  corpusContext: CorpusContext
): string {
  
  const relevantConcepts = corpusContext.getRelevantConcepts(topic, 10);
  const ecstasyTriggers = corpusContext.getEcstasyTriggers(topic);
  const beligerantAnchors = corpusContext.getBeligerantAnchors(topic);
  
  return `
Eres un ensayista político-filosófico con estilo beligerante y sofisticado.
Tu referencia es "El Crepúsculo de los Invertebrados" de JuanBlog.

TEMA A DESARROLLAR: ${topic}

=== CONTEXTO DEL CORPUS ===

CONCEPTOS RELACIONADOS EN EL CORPUS:
${relevantConcepts.map(c => `
- ${c.label}: ${c.definition}
  Usado en: ${c.instances.map(i => i.article).join(', ')}
  Nuance JuanBlog: ${c.nuance_juanblog}
`).join('')}

FILÓSOFOS RELEVANTES PARA ESTE TEMA:
${corpusContext.philosophers.map(p => `
- ${p.name} (${p.juanblog_tier}-tier): ${p.nuance_juanblog}
  Obras clave: ${p.key_works.join(', ')}
`).join('')}

TRIGGERS DE ÉXTASIS DISPONIBLES:
${ecstasyTriggers.map(t => `- ${t.label}: ${t.definition}`).join('\n')}

ANCLAS BELIGERANTES DEL CORPUS:
${beligerantAnchors.map(a => `- ${a.label}: ${a.definition}`).join('\n')}

=== INSTRUCCIONES DE ESCRITURA ===

ESTRUCTURA OBLIGATORIA:
- I. El diagnóstico (apertura con "Contemplamos el espectáculo...")
- II. La genealogía / contexto
- III. [Concepto] como categoría metapolítica
- IV. La ley de hierro / consecuencias
- V. ÉXTASIS / Visión (momento donde el argumento se disuelve en poesía)
- VI. Conclusión (sin resumir, que propulse)

USO DEL CORPUS:
1. Conecta el tema con al menos 2 conceptos existentes
2. Cita filósofos del corpus con referencias precisas
3. El momento de éxtasis debe resonar con triggers existentes
4. Usa MAYÚSCULAS para énfasis conceptual (no emocional)

MOMENTO DE ÉXTASIS:
En algún punto, el texto debe tener un momento de visión donde lo filosófico 
se disuelva brevemente en experiencia pura. Referencias del corpus para inspirarte:
${ecstasyTriggers.slice(0, 3).map(t => `"${t.instances[0]?.context}"`).join('\n')}

PROHIBIDO:
- Explicar quién es el filósofo citado
- "Según estudios..."
- Conclusión que resume
- Lenguaje de coach motivacional

El lector quiere INICIACIÓN INTELECTUAL con VISLUMBRES DE TRASCENDENCIA.
`;
}
```

### 5.2 Sistema de Sugerencias

```typescript
// enrichment/suggester.ts

interface SuggestionEngine {
  // Sugerir conexiones no explotadas
  suggestMissingLinks(draft: Draft): Promise<LinkSuggestion[]>;
  
  // Sugerir filósofos relevantes no usados
  suggestPhilosophers(topic: string, used: string[]): Promise<Philosopher[]>;
  
  // Sugerir estructura basada en artículos similares
  suggestStructure(topic: string): Promise<StructureSuggestion>;
  
  // Detectar oportunidades de éxtasis
  suggestEcstasyOpportunities(draft: Draft): Promise<EcstasyOpportunity[]>;
}

// Ejemplo de sugerencia
{
  "type": "missing_connection",
  "message": "Este artículo sobre entrenamiento no conecta con 'voluntad de poder' aunque 3 artículos previos lo hacen",
  "suggested_insertion": "El gimnasio como expresión de VOLUNTAD DE PODER...",
  "confidence": 0.87
}
```

### 5.3 Validación contra Corpus

```typescript
// validation/corpus-validator.ts

export function validateAgainstCorpus(draft: Draft): ValidationReport {
  const report: ValidationReport = {
    score: 0,
    checks: []
  };
  
  // Check: ¿Usa conceptos del corpus?
  const usedConcepts = extractConcepts(draft.content);
  const corpusConcepts = getCorpusConcepts();
  const overlap = intersection(usedConcepts, corpusConcepts);
  
  report.checks.push({
    name: "conexión_corpus",
    passed: overlap.length >= 2,
    score: Math.min(overlap.length / 3, 1),
    message: `Usa ${overlap.length} conceptos del corpus: ${overlap.join(', ')}`
  });
  
  // Check: ¿Tiene momento de éxtasis?
  const ecstasy = detectEcstasy(draft.content);
  report.checks.push({
    name: "momento_éxtasis",
    passed: ecstasy !== null,
    score: ecstasy ? 1 : 0,
    message: ecstasy ? "Momento de éxtasis detectado" : "Falta momento de éxtasis"
  });
  
  // Check: ¿Referencias filosóficas con nuance?
  const philosophers = extractPhilosophers(draft.content);
  const withNuance = philosophers.filter(p => hasNuance(draft, p));
  
  report.checks.push({
    name: "nuance_filosófico",
    passed: withNuance.length >= 2,
    score: withNuance.length / philosophers.length,
    message: `${withNuance.length}/${philosophers.length} filósofos con nuance específico`
  });
  
  report.score = average(report.checks.map(c => c.score));
  return report;
}
```

---

## 6. IMPLEMENTACIÓN: CHECKLIST PARA DESARROLLADOR

### Fase 1: Infraestructura (Día 1-2)
- [ ] Crear estructura de directorios `corpus/`
- [ ] Implementar esquema SQLite
- [ ] Crear tipos TypeScript
- [ ] Setup de tests

### Fase 2: Extracción (Día 3-4)
- [ ] Implementar parser HTML
- [ ] Crear prompt de extracción
- [ ] Procesar los 7 artículos existentes
- [ ] Validar extracciones manualmente

### Fase 3: Grafo (Día 5-6)
- [ ] Implementar sistema de relaciones
- [ ] Generar Folgezettel automático
- [ ] Crear export a GEXF
- [ ] Visualización básica

### Fase 4: Enriquecimiento (Día 7-8)
- [ ] Implementar API de sugerencias
- [ ] Crear prompt enriquecido
- [ ] Integrar con pipeline existente
- [ ] Validación automática

### Fase 5: Iteración (Día 9-10)
- [ ] Refinar extracciones
- [ ] Ajustar pesos de relaciones
- [ ] Documentar
- [ ] Deploy

---

## 7. REFERENCIAS

- **Luhmann, N.** (1981): *Kommunikation mit Zettelkästen*
- **Forte, T.** (2017): *Building a Second Brain* (PARA method)
- **Ahrens, S.** (2017): *How to Take Smart Notes*
- **JuanBlog Style Guide**: `docs/GUIA_ESTILO.md`

---

*"El corpus no es un archivo. Es un sistema de pensamiento que piensa contigo."*

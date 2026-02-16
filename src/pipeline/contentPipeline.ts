import { llmClients } from '../clients/llmClients';
import { DraftPayload, TopicLabel } from '../domain/types';
import { parseAndValidateDraft } from '../utils/draftValidation';

function qualityRules(topic: TopicLabel): string {
  const base = [
    'No inventar fuentes.',
    'No rellenar datos no verificados.',
    'Si no se sabe, admitir incertidumbre.',
    'Estilo claro y útil.'
  ];

  if (topic === 'politica') {
    base.push(
      'Maximizar cautela con afirmaciones políticas.',
      'Claims_to_verify obligatorio cuando haya cifras o hechos específicos.'
    );
  }
  if (topic === 'entrenamiento') {
    base.push('Separar evidencia vs opinión.', 'Evitar afirmaciones médicas fuertes.');
  }
  if (topic === 'sociologia') {
    base.push('Definir conceptos operativos.', 'No inventar autores ni referencias.');
  }

  return base.map((r, i) => `${i + 1}. ${r}`).join('\n');
}

export async function classifyTopic(ideasText: string): Promise<TopicLabel> {
  const prompt = `Clasifica estas ideas en una sola etiqueta: sociologia, entrenamiento, politica, estilo_vida, tecnologia, mixto.\n\nIdeas:\n${ideasText}\n\nResponde solo la etiqueta.`;
  const response = (await llmClients.askOpenAI(prompt, 'gpt-4o-mini')).trim().toLowerCase();
  const allowed: TopicLabel[] = [
    'sociologia',
    'entrenamiento',
    'politica',
    'estilo_vida',
    'tecnologia',
    'mixto'
  ];
  return (allowed.includes(response as TopicLabel) ? response : 'mixto') as TopicLabel;
}

export async function generateDraft(args: {
  ideas: string[];
  targetWords: 1000 | 2000;
  topicLabel: TopicLabel;
  revisionInstructions?: string;
  previousVersion?: string;
}): Promise<DraftPayload> {
  const ideasJoined = args.ideas.map((idea, idx) => `${idx + 1}. ${idea}`).join('\n');
  const rules = qualityRules(args.topicLabel);

  const context = `Ideas inbox:\n${ideasJoined}\n\nTarget words: ${args.targetWords}\nTopic: ${args.topicLabel}\nReglas:\n${rules}`;

  const divergentPrompt = `${context}\n\nRol: estratega divergente. Entrega outline, tesis, estructura, qué evitar.`;
  const narrativePrompt = `${context}\n\nRol: narrador. Escribe borrador narrativo claro con ejemplos.`;
  const criticPrompt = `${context}\n\nRol: crítico severo SEO+contenido. Señala huecos, redundancias y mejoras.`;

  const [gptOutline, claudeDraft, kimiCritique] = await Promise.all([
    llmClients.askOpenAI(divergentPrompt),
    llmClients.askClaude(narrativePrompt),
    llmClients.askKimi(criticPrompt)
  ]);

  const convergePrompt = `Toma estos materiales y unifica en un JSON ESTRICTO válido (sin markdown, sin texto adicional):
{
  "title": "...",
  "slug": "...",
  "meta_description": "...",
  "tags": ["..."],
  "topic_label": "sociologia|entrenamiento|politica|estilo_vida|tecnologia|mixto",
  "target_words": 1000|2000,
  "content_markdown": "...",
  "claims_to_verify": ["..."]
}

Debes cumplir: 1 H1, mínimo 3 H2, incluir sección de conclusión, y si claims_to_verify no está vacío terminar con "## Notas / Claims a verificar".
No inventes fuentes.

Contexto base:
${context}

Material A (GPT outline):
${gptOutline}

Material B (Claude draft):
${claudeDraft}

Material C (Kimi critique):
${kimiCritique}

${args.previousVersion ? `Versión previa:\n${args.previousVersion}` : ''}
${args.revisionInstructions ? `Instrucciones de revisión:\n${args.revisionInstructions}` : ''}`;

  const v1Raw = await llmClients.askOpenAI(convergePrompt, 'gpt-4o');

  const redTeamPrompt = `Actúa como red team editorial. Evalúa este JSON borrador y lista mejoras concretas (errores, claims dudosos, estructura, SEO).\n${v1Raw}`;
  const [redGpt, redClaude, redKimi] = await Promise.all([
    llmClients.askOpenAI(redTeamPrompt),
    llmClients.askClaude(redTeamPrompt),
    llmClients.askKimi(redTeamPrompt)
  ]);

  const applyPrompt = `Aplica las siguientes mejoras al JSON borrador y devuelve JSON ESTRICTO válido únicamente:\n
Borrador inicial:\n${v1Raw}\n
Críticas red team:\n- GPT: ${redGpt}\n- Claude: ${redClaude}\n- Kimi: ${redKimi}\n
Asegura target_words=${args.targetWords} y topic_label=${args.topicLabel}.`;

  const v2Raw = await llmClients.askClaude(applyPrompt);
  return parseAndValidateDraft(v2Raw);
}

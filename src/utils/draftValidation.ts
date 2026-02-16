import { z } from 'zod';
import { TOPIC_LABELS } from '../domain/types';

export const draftSchema = z.object({
  title: z.string().min(5),
  slug: z.string().min(3),
  meta_description: z.string().min(20).max(180),
  tags: z.array(z.string().min(1)).min(2).max(12),
  topic_label: z.enum(TOPIC_LABELS),
  target_words: z.union([z.literal(1000), z.literal(2000)]),
  content_markdown: z.string().min(600),
  claims_to_verify: z.array(z.string())
});

function countOccurrences(input: string, token: string): number {
  return input.split('\n').filter((line) => line.startsWith(token)).length;
}

export function validateContentStructure(content: string, claimsToVerify: string[]): string[] {
  const errors: string[] = [];
  const h1 = countOccurrences(content, '# ');
  const h2 = countOccurrences(content, '## ');
  if (h1 !== 1) errors.push('content_markdown debe tener exactamente 1 H1.');
  if (h2 < 3) errors.push('content_markdown debe tener mínimo 3 H2.');
  if (!/conclusi[oó]n/i.test(content)) {
    errors.push('content_markdown debe incluir una conclusión.');
  }
  if (claimsToVerify.length > 0 && !/Notas\s*\/\s*Claims\s*a\s*verificar/i.test(content)) {
    errors.push('Si hay claims_to_verify, debe existir sección final "Notas / Claims a verificar".');
  }
  return errors;
}

export function validateWordCount(content: string, target: 1000 | 2000): string | null {
  const words = content.trim().split(/\s+/).length;
  const min = Math.floor(target * 0.85);
  const max = Math.ceil(target * 1.15);
  if (words < min || words > max) {
    return `Longitud fuera de tolerancia: ${words} palabras (objetivo ${target}, permitido ${min}-${max}).`;
  }
  return null;
}

export function parseAndValidateDraft(rawJson: string) {
  const parsed = JSON.parse(rawJson);
  const result = draftSchema.parse(parsed);
  const structureErrors = validateContentStructure(result.content_markdown, result.claims_to_verify);
  const wordError = validateWordCount(result.content_markdown, result.target_words);
  if (wordError) structureErrors.push(wordError);
  if (structureErrors.length > 0) {
    throw new Error(`Validación de borrador falló: ${structureErrors.join(' | ')}`);
  }
  return result;
}

export type BotCommand =
  | { kind: 'idea'; text: string }
  | { kind: 'draft'; targetWords: 1000 | 2000 }
  | { kind: 'revise'; instructions: string }
  | { kind: 'approve' }
  | { kind: 'status' }
  | { kind: 'new' }
  | { kind: 'unknown' };

export function parseCommand(text: string): BotCommand {
  const trimmed = text.trim();
  if (trimmed.startsWith('/idea ')) {
    return { kind: 'idea', text: trimmed.replace('/idea ', '').trim() };
  }
  if (trimmed === '/draft') return { kind: 'draft', targetWords: 1000 };
  if (trimmed.startsWith('/draft ')) {
    const value = Number(trimmed.replace('/draft ', '').trim());
    return { kind: 'draft', targetWords: value === 2000 ? 2000 : 1000 };
  }
  if (trimmed.startsWith('/revise ')) {
    return { kind: 'revise', instructions: trimmed.replace('/revise ', '').trim() };
  }
  if (trimmed === '/approve') return { kind: 'approve' };
  if (trimmed === '/status') return { kind: 'status' };
  if (trimmed === '/new') return { kind: 'new' };
  return { kind: 'unknown' };
}

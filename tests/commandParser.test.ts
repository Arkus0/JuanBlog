import { describe, expect, it } from 'vitest';
import { parseCommand } from '../src/services/commandParser';

describe('parseCommand', () => {
  it('parsea /draft 2000', () => {
    expect(parseCommand('/draft 2000')).toEqual({ kind: 'draft', targetWords: 2000 });
  });

  it('parsea /idea', () => {
    expect(parseCommand('/idea probar idea')).toEqual({ kind: 'idea', text: 'probar idea' });
  });
});

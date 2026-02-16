import { describe, expect, it } from 'vitest';
import { markdownToSanitizedHtml } from '../src/utils/markdown';

describe('markdownToSanitizedHtml', () => {
  it('convierte markdown básico a html y sanitiza script', () => {
    const html = markdownToSanitizedHtml('# Hola\n\nTexto **fuerte** <script>alert(1)</script>');
    expect(html).toContain('<h1>Hola</h1>');
    expect(html).toContain('<strong>fuerte</strong>');
    expect(html).not.toContain('<script>');
  });

  it('conserva listas, links y bloques de código', () => {
    const md = [
      '# Título',
      '',
      '- item uno',
      '- item dos',
      '',
      '[OpenAI](https://openai.com)',
      '',
      '```ts',
      'const x = 1;',
      '```'
    ].join('\n');

    const html = markdownToSanitizedHtml(md);

    expect(html).toContain('<ul>');
    expect(html).toContain('<li>item uno</li>');
    expect(html).toContain('<a href="https://openai.com">OpenAI</a>');
    expect(html).toContain('<pre>');
    expect(html).toContain('<code');
    expect(html).toContain('const x = 1;');
  });
});

import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

export function markdownToSanitizedHtml(markdown: string): string {
  const rawHtml = marked.parse(markdown, { breaks: false, gfm: true }) as string;

  return sanitizeHtml(rawHtml, {
    allowedTags: [
      ...sanitizeHtml.defaults.allowedTags,
      'h1',
      'h2',
      'h3',
      'h4',
      'pre',
      'code',
      'img',
      'hr'
    ],
    allowedAttributes: {
      a: ['href', 'name', 'target', 'rel', 'title'],
      img: ['src', 'alt', 'title'],
      code: ['class']
    },
    allowedSchemes: ['http', 'https', 'mailto']
  });
}

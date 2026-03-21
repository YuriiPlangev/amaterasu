import sanitizeHtmlLib from 'sanitize-html';

/**
 * Sanitize HTML to prevent XSS. Use for user-generated or external content
 * (e.g. WordPress post content, excerpts).
 */
export function sanitizeHtml(dirty: string): string {
  if (!dirty || typeof dirty !== 'string') return '';
  return sanitizeHtmlLib(dirty, {
    allowedTags: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li', 'h2', 'h3', 'h4', 'blockquote', 'span', 'img', 'pre', 'code'],
    allowedAttributes: { a: ['href', 'target', 'rel'], img: ['src', 'alt', 'class'], '*': ['class'] },
    allowedSchemes: ['http', 'https', 'mailto'],
  });
}

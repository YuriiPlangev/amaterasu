/**
 * Decode HTML entities in a string
 * Handles common entities like &#8217; (apostrophe), &quot;, &amp;, etc.
 */
export function decodeHtmlEntities(html: string): string {
  if (!html) return '';
  
  // Server-side safe implementation using a map of common entities
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&#8217;': "'",
    '&#8216;': "'",
    '&#8218;': ',',
    '&#8220;': '"',
    '&#8221;': '"',
    '&apos;': "'",
    '&nbsp;': ' ',
  };
  
  let decoded = html;
  Object.entries(entities).forEach(([entity, char]) => {
    decoded = decoded.replace(new RegExp(entity, 'g'), char);
  });
  
  // Handle numeric entities like &#XXXX;
  decoded = decoded.replace(/&#(\d+);/g, (match, dec) => {
    return String.fromCharCode(parseInt(dec, 10));
  });
  
  // Handle hex entities like &#xXXXX;
  decoded = decoded.replace(/&#x([0-9a-f]+);/gi, (match, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });
  
  return decoded;
}

/**
 * Remove HTML tags and decode entities
 */
export function cleanDescription(html: string): string {
  if (!html) return '';
  // Remove HTML tags
  const clean = html.replace(/<[^>]*>/g, '').trim();
  // Decode HTML entities
  return decodeHtmlEntities(clean);
}

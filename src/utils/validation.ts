/**
 * Security utilities for input validation and sanitization
 */

/**
 * Validates and sanitizes barcode input
 * @param barcode - The barcode string to validate
 * @returns Sanitized barcode or null if invalid
 */
export function validateBarcode(barcode: string): string | null {
  if (!barcode || typeof barcode !== 'string') {
    return null;
  }

  // Remove whitespace and control characters
  const sanitized = barcode.trim().replace(/[\x00-\x1F\x7F-\x9F]/g, '');

  // Check length (most barcodes are 8-14 digits)
  if (sanitized.length < 6 || sanitized.length > 20) {
    return null;
  }

  // Check if it's a valid barcode format (numbers and possibly hyphens)
  if (!/^[0-9\-]+$/.test(sanitized)) {
    return null;
  }

  return sanitized;
}

/**
 * Validates and sanitizes search query input
 * @param query - The search query to validate
 * @returns Sanitized query or empty string if invalid
 */
export function validateSearchQuery(query: string): string {
  if (!query || typeof query !== 'string') {
    return '';
  }

  // Remove dangerous characters and limit length
  return query
    .trim()
    .replace(/[<>'"]/g, '') // Remove potential XSS characters
    .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove control characters
    .substring(0, 100); // Limit length
}

/**
 * Safely parse JSON with error handling
 * @param jsonString - The JSON string to parse
 * @param fallback - Fallback value if parsing fails
 * @returns Parsed object or fallback value
 */
export function safeJsonParse<T>(jsonString: string, fallback: T): T {
  try {
    if (!jsonString || typeof jsonString !== 'string') {
      return fallback;
    }
    return JSON.parse(jsonString);
  } catch {
    return fallback;
  }
}

/**
 * Sanitize API response data
 * @param data - The data to sanitize
 * @returns Sanitized data
 */
export function sanitizeApiResponse(data: any): any {
  if (typeof data === 'string') {
    // Remove potential XSS vectors from strings
    return data.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  }
  
  if (Array.isArray(data)) {
    return data.map(sanitizeApiResponse);
  }
  
  if (data && typeof data === 'object') {
    const sanitized: any = {};
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        sanitized[key] = sanitizeApiResponse(data[key]);
      }
    }
    return sanitized;
  }
  
  return data;
}
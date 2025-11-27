import * as crypto from 'crypto';

/**
 * Genera un hash SHA-256 de los productos concatenando los campos relevantes
 */
export function generateProductsHash(products: Array<{ code: string; name: string; provider?: string; origin?: string; category: string; price_usd: number; price_alt_usd?: number; sheet?: string }>): string {
  // Ordenar productos por code para consistencia
  const sorted = [...products].sort((a, b) => a.code.localeCompare(b.code));
  
  // Concatenar todos los campos relevantes de cada producto
  const concatenated = sorted.map(p => {
    const parts = [
      p.code || '',
      p.name || '',
      p.provider || '',
      p.origin || '',
      p.category || '',
      String(p.price_usd || 0),
      String(p.price_alt_usd || 0),
      p.sheet || '',
    ];
    return parts.join('|');
  }).join('||');
  
  // Generar hash SHA-256
  return crypto.createHash('sha256').update(concatenated).digest('hex');
}


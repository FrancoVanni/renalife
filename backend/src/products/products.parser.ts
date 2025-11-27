import * as XLSX from 'xlsx';

export interface ParsedProduct {
  code: string;
  name: string;
  provider: string;
  origin: string;
  price_usd: number;
  price_alt_usd: number;
  iva_included: boolean;
  category: string;
  sheet: string;
}

export interface ParseResult {
  preview: ParsedProduct[];
  totalParsed: number;
  warnings: string[];
  byCategories: { [category: string]: number };
}

export class ProductsParser {

  parseWorkbook(buffer: Buffer): ParseResult {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const allProducts: ParsedProduct[] = [];
    const warnings: string[] = [];
    const byCategories: { [cat: string]: number } = {};

    for (const sheetName of workbook.SheetNames) {
      console.log(`🔍 Parseando sheet: ${sheetName}`);
      const sheet = workbook.Sheets[sheetName];
      const result = this.parseSheet(sheetName, sheet);

      allProducts.push(...result.products);
      warnings.push(...result.warnings);

      for (const [cat, count] of Object.entries(result.byCategories)) {
        byCategories[cat] = (byCategories[cat] || 0) + count;
      }
    }

    return {
      preview: allProducts,
      totalParsed: allProducts.length,
      warnings,
      byCategories,
    };
  }

  parseSheet(sheetName: string, sheet: XLSX.WorkSheet) {
    const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });
    console.log(`📑 Total filas en sheet ${sheetName}: ${rows.length}`);

    const products: ParsedProduct[] = [];
    const warnings: string[] = [];
    const byCategories: { [cat: string]: number } = {};

    let headerRowIndex = -1;

    // Buscamos header REAL: una fila donde:
    // - col0 = "Unix" (o variante)
    // - col4 col5 sean números o "U$S C/IVA"
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];

      if (!r || r.length < 6) continue;

      const c0 = (r[0] || '').toString().toLowerCase();
      const c4 = (r[4] || '').toString().toLowerCase();
      const c5 = (r[5] || '').toString().toLowerCase();

      const headerMatch =
        (c0.includes('unix') || c0.includes('codigo') || c0.includes('código')) &&
        (
          c4.includes('u$s') ||
          c4.includes('us$') ||
          c4.includes('iva') ||
          typeof r[4] === 'number'
        );

      if (headerMatch) {
        headerRowIndex = i;
        break;
      }
    }

    if (headerRowIndex === -1) {
      return {
        products: [],
        warnings: [`Sheet "${sheetName}": No se detectó fila de encabezado válida.`],
        byCategories: {},
      };
    }

    let currentCategory = 'Sin categoría';

    for (let i = headerRowIndex + 1; i < rows.length; i++) {
      const row = rows[i];

      if (!row || row.every(c => c === null || c === undefined || c === "")) {
        continue;
      }

      // Si la primera celda tiene texto y las demás están vacías → categoría
      if (this.isCategoryRow(row)) {
        const cat = String(row[0]).trim();
        if (cat.length > 0) currentCategory = cat;
        continue;
      }

      const prod = this.tryParseProductRow(row, sheetName, i + 1, currentCategory, warnings);
      if (prod) {
        products.push(prod);
        byCategories[currentCategory] = (byCategories[currentCategory] || 0) + 1;
      }
    }

    return { products, warnings, byCategories };
  }

  // Detecta filas tipo categoría
  private isCategoryRow(row: any[]): boolean {
    if (!row || row.length === 0) return false;

    const first = row[0];
    if (!first || typeof first !== 'string') return false;

    const txt = first.trim();
    if (txt.length === 0) return false;

    // Si las demás columnas están vacías → es categoría
    for (let i = 1; i < row.length; i++) {
      if (row[i] !== null && row[i] !== undefined && row[i] !== '') {
        return false;
      }
    }

    return true;
  }

  // Parsear fila de producto
  private tryParseProductRow(
    row: any[],
    sheetName: string,
    rowNumber: number,
    category: string,
    warnings: string[]
  ): ParsedProduct | null {

    // Columna 0 = código (puede ser número o string)
    const code = row[0];
    if (!code || String(code).trim() === "") return null;

    // Columna 1 = nombre
    const name = row[1] ? String(row[1]).trim() : "";

    if (!name) return null; // un producto siempre tiene nombre

    // Col 2 = proveedor
    const provider = row[2] ? String(row[2]).trim() : "";

    // Col 3 = origen
    const origin = row[3] ? String(row[3]).trim() : "";

    // Precio principal
    const priceStr1 = row[4];
    const price1 = this.parsePrice(priceStr1);
    if (isNaN(price1)) {
      warnings.push(
        `Sheet "${sheetName}" fila ${rowNumber}: precio inválido (${priceStr1})`
      );
      return null;
    }

    // Precio alternativo
    let price2 = 0;
    if (row[5] !== undefined && row[5] !== null && row[5] !== "") {
      const parsed = this.parsePrice(row[5]);
      price2 = isNaN(parsed) ? 0 : parsed;
    }

    return {
      code: String(code).trim(),
      name,
      provider,
      origin,
      price_usd: price1,
      price_alt_usd: price2,
      iva_included: true,
      category,
      sheet: sheetName,
    };
  }

  // Parser de precios robusto
  private parsePrice(val: any): number {
    if (val === null || val === undefined) return NaN;

    if (typeof val === 'number') return val;

    let s = String(val).trim();
    s = s.replace(/\s+/g, '').replace(',', '.');
    s = s.replace(/[^\d.-]/g, '');

    return parseFloat(s);
  }
}

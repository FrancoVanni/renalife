import { Injectable } from '@nestjs/common';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { DatabaseService } from '../database/database.service';
import * as sqlite3 from 'sqlite3';

@Injectable()
export class ProductsRepository {
  private db: sqlite3.Database;

  constructor(private databaseService: DatabaseService) {
    this.db = this.databaseService.getDatabase();
    this.initDatabase();
  }

  private initDatabase() {
    this.db.serialize(() => {
      // Crear tabla si no existe
      this.db.run(`
        CREATE TABLE IF NOT EXISTS products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          code TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          category TEXT NOT NULL,
          price_usd REAL NOT NULL,
          iva_included INTEGER NOT NULL DEFAULT 0,
          description TEXT,
          provider TEXT,
          origin TEXT,
          price_alt_usd REAL,
          sheet TEXT,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Agregar nuevas columnas si no existen (para migración de tablas existentes)
      // Ignorar errores si las columnas ya existen
      this.db.run(`ALTER TABLE products ADD COLUMN provider TEXT`, (err) => {
        // Ignorar error si la columna ya existe
      });
      this.db.run(`ALTER TABLE products ADD COLUMN origin TEXT`, (err) => {
        // Ignorar error si la columna ya existe
      });
      this.db.run(`ALTER TABLE products ADD COLUMN price_alt_usd REAL`, (err) => {
        // Ignorar error si la columna ya existe
      });
      this.db.run(`ALTER TABLE products ADD COLUMN sheet TEXT`, (err) => {
        // Ignorar error si la columna ya existe
      });
    });
  }

  async findAll(): Promise<Product[]> {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM products ORDER BY updated_at DESC', (err, rows: any[]) => {
        if (err) {
          reject(err);
          return;
        }
        if (!rows || rows.length === 0) {
          resolve([]);
          return;
        }
        const products = rows
          .filter(row => row != null)
          .map(row => this.mapRowToProduct(row));
        resolve(products);
      });
    });
  }

  async findOne(id: number): Promise<Product | null> {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM products WHERE id = ?', [id], (err, row: any) => {
        if (err) {
          reject(err);
          return;
        }
        if (!row) {
          resolve(null);
          return;
        }
        try {
          const product = this.mapRowToProduct(row);
          resolve(product);
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  async deleteAll(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM products', (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  }

  async findAllOrderedByCode(): Promise<Product[]> {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM products ORDER BY code ASC', (err, rows: any[]) => {
        if (err) {
          reject(err);
          return;
        }
        if (!rows || rows.length === 0) {
          resolve([]);
          return;
        }
        const products = rows
          .filter(row => row != null)
          .map(row => this.mapRowToProduct(row));
        resolve(products);
      });
    });
  }

  async beginTransaction(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run('BEGIN TRANSACTION', (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  }

  async commit(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run('COMMIT', (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  }

  async rollback(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run('ROLLBACK', (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  }

  async create(createDto: CreateProductDto): Promise<Product> {
    return new Promise((resolve, reject) => {
      const {
        code,
        name,
        category,
        price_usd,
        iva_included,
        description,
        provider,
        origin,
        price_alt_usd,
        sheet,
      } = createDto;

      const db = this.db;
      const repository = this;

      this.db.run(
        'INSERT INTO products (code, name, category, price_usd, iva_included, description, provider, origin, price_alt_usd, sheet) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          code,
          name,
          category,
          price_usd,
          iva_included ? 1 : 0,
          description || null,
          provider || null,
          origin || null,
          price_alt_usd !== undefined ? price_alt_usd : null,
          sheet || null,
        ],
        function(this: sqlite3.RunResult, err: Error | null) {
          if (err) {
            reject(new Error(`Failed to insert product: ${JSON.stringify(createDto)}. Error: ${err.message}`));
            return;
          }

          const insertedId = this.lastID;
          if (!insertedId) {
            reject(new Error(`Failed to insert product: ${JSON.stringify(createDto)}. No lastID returned.`));
            return;
          }

          db.get('SELECT * FROM products WHERE id = ?', [insertedId], (err, row: any) => {
            if (err) {
              reject(new Error(`Failed to insert product: ${JSON.stringify(createDto)}. Error fetching inserted row: ${err.message}`));
              return;
            }

            if (!row || row === null || row === undefined) {
              reject(new Error(`Row undefined after insert for code ${createDto.code}`));
              return;
            }

            try {
              const product = repository.mapRowToProduct(row);
              resolve(product);
            } catch (error: any) {
              reject(new Error(`Failed to insert product: ${JSON.stringify(createDto)}. Error mapping row: ${error.message}`));
            }
          });
        }
      );
    });
  }

  private mapRowToProduct(row: any): Product {
    if (!row || row === null || row === undefined) {
      throw new Error('Cannot map undefined or null row to Product');
    }

    if (typeof row.id === 'undefined' || row.id === null) {
      throw new Error(`Row missing required field 'id': ${JSON.stringify(row)}`);
    }

    return {
      id: row.id,
      code: row.code,
      name: row.name,
      category: row.category,
      price_usd: row.price_usd,
      iva_included: row.iva_included === 1,
      description: row.description,
      provider: row.provider || undefined,
      origin: row.origin || undefined,
      price_alt_usd: row.price_alt_usd !== null && row.price_alt_usd !== undefined ? row.price_alt_usd : undefined,
      sheet: row.sheet || undefined,
      updated_at: new Date(row.updated_at),
    };
  }
}

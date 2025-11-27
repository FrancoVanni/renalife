import { Injectable } from '@nestjs/common';
import { Sale } from './entities/sale.entity';
import { CreateSaleDto } from './dto/create-sale.dto';
import { DatabaseService } from '../database/database.service';
import * as sqlite3 from 'sqlite3';

@Injectable()
export class SalesRepository {
  private db: sqlite3.Database;

  constructor(private databaseService: DatabaseService) {
    this.db = this.databaseService.getDatabase();
    this.initDatabase();
  }

  private initDatabase() {
    this.db.serialize(() => {
      this.db.run(`
        CREATE TABLE IF NOT EXISTS sales (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          client_id INTEGER NOT NULL,
          product_id INTEGER NOT NULL,
          units INTEGER NOT NULL,
          price_usd_at_sale REAL NOT NULL,
          dollar_rate_at_sale REAL NOT NULL,
          price_final_ars REAL NOT NULL,
          payment_condition TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
    });
  }

  async create(createSaleDto: CreateSaleDto): Promise<Sale> {
    return new Promise((resolve, reject) => {
      const { client_id, product_id, units, price_usd_at_sale, dollar_rate_at_sale, price_final_ars, payment_condition } = createSaleDto;
      this.db.run(
        'INSERT INTO sales (client_id, product_id, units, price_usd_at_sale, dollar_rate_at_sale, price_final_ars, payment_condition) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [client_id, product_id, units, price_usd_at_sale, dollar_rate_at_sale, price_final_ars, payment_condition],
        function(err) {
          if (err) reject(err);
          else {
            this.db.get('SELECT * FROM sales WHERE id = ?', [this.lastID], (err, row: any) => {
              if (err) reject(err);
              else resolve(this.mapRowToSale(row));
            });
          }
        }.bind(this)
      );
    });
  }

  async findByClient(clientId: number): Promise<Sale[]> {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM sales WHERE client_id = ? ORDER BY created_at DESC', [clientId], (err, rows: any[]) => {
        if (err) reject(err);
        else resolve(rows.map(this.mapRowToSale));
      });
    });
  }

  async getTopClients(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT 
          c.id,
          c.name,
          c.phone,
          c.rubro,
          c.company,
          SUM(s.price_final_ars) as total_sales,
          COUNT(s.id) as sales_count
        FROM clients c
        LEFT JOIN sales s ON c.id = s.client_id
        GROUP BY c.id
        ORDER BY total_sales DESC
        LIMIT 10
      `, (err, rows: any[]) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async getTopProducts(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT 
          p.id,
          p.code,
          p.name,
          p.category,
          SUM(s.units) as total_units,
          SUM(s.price_final_ars) as total_sales,
          COUNT(s.id) as sales_count
        FROM products p
        LEFT JOIN sales s ON p.id = s.product_id
        GROUP BY p.id
        ORDER BY total_sales DESC
        LIMIT 10
      `, (err, rows: any[]) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  private mapRowToSale(row: any): Sale {
    return {
      id: row.id,
      client_id: row.client_id,
      product_id: row.product_id,
      units: row.units,
      price_usd_at_sale: row.price_usd_at_sale,
      dollar_rate_at_sale: row.dollar_rate_at_sale,
      price_final_ars: row.price_final_ars,
      payment_condition: row.payment_condition,
      created_at: new Date(row.created_at),
    };
  }
}


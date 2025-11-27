import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DatabaseService } from '../database/database.service';
import { DollarService } from './dollar.service';
import { UpdateConfigDto } from './dto/update-config.dto';
import * as sqlite3 from 'sqlite3';

@Injectable()
export class ConfigService {
  private readonly logger = new Logger(ConfigService.name);
  private db: sqlite3.Database;

  constructor(
    private databaseService: DatabaseService,
    private dollarService: DollarService,
  ) {
    this.db = this.databaseService.getDatabase();
    this.initDatabase();
  }

  private initDatabase() {
    this.db.serialize(() => {
      // Migrar tabla antigua si existe
      this.db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='config'", async (err, row: any) => {
        if (row) {
          // Verificar si tiene columnas antiguas
          this.db.all("PRAGMA table_info(config)", (err, columns: any[]) => {
            const hasOldColumns = columns.some(c => c.name === 'recargo_30_dias' || c.name === 'recargo_echeck' || c.name === 'dollar_rate');
            
            if (hasOldColumns) {
              // Migrar datos
              this.db.get('SELECT * FROM config WHERE id = 1', async (err, oldRow: any) => {
                if (oldRow) {
                  const usd30Days = oldRow.dollar_rate || 1000; // Usar dollar_rate como valor inicial para usd_30_days
                  
                  // Eliminar tabla antigua
                  this.db.run('DROP TABLE config', (err) => {
                    if (err) console.error('Error dropping old config table:', err);
                    
                    // Crear nueva tabla
                    this.createNewTable(usd30Days);
                  });
                } else {
                  this.db.run('DROP TABLE config', (err) => {
                    this.createNewTable(1000);
                  });
                }
              });
            } else {
              // Ya tiene la estructura nueva
              this.ensureDefaultValues();
            }
          });
        } else {
          // Crear tabla nueva
          this.createNewTable(1000);
        }
      });
    });
  }

  private createNewTable(defaultUsd30Days: number) {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS config (
        id INTEGER PRIMARY KEY DEFAULT 1,
        usd_30_days REAL DEFAULT ${defaultUsd30Days},
        CONSTRAINT single_row CHECK (id = 1)
      )
    `, () => {
      this.ensureDefaultValues();
    });
  }

  private ensureDefaultValues() {
    this.db.get('SELECT COUNT(*) as count FROM config', (err, row: any) => {
      if (row.count === 0) {
        this.db.run(`
          INSERT INTO config (id, usd_30_days)
          VALUES (1, 1000)
        `);
      }
    });
  }

  async getConfig(): Promise<{
    dollar_rate_official: number;
    usd_30_days: number;
  }> {
    const dollarOfficial = await this.dollarService.getOfficialRate();
    
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM config WHERE id = 1', (err, row: any) => {
        if (err) reject(err);
        else {
          resolve({
            dollar_rate_official: dollarOfficial,
            usd_30_days: row?.usd_30_days || 1000,
          });
        }
      });
    });
  }

  async updateConfig(updateConfigDto: UpdateConfigDto): Promise<{
    dollar_rate_official: number;
    usd_30_days: number;
  }> {
    return new Promise((resolve, reject) => {
      const updates: string[] = [];
      const values: any[] = [];

      if (updateConfigDto.usd_30_days !== undefined) {
        updates.push('usd_30_days = ?');
        values.push(updateConfigDto.usd_30_days);
      }

      if (updates.length === 0) {
        return this.getConfig().then(resolve).catch(reject);
      }

      values.push(1);
      const sql = `UPDATE config SET ${updates.join(', ')} WHERE id = ?`;

      this.db.run(sql, values, async (err) => {
        if (err) reject(err);
        else {
          const updated = await this.getConfig();
          resolve(updated);
        }
      });
    });
  }

  async refreshOfficialDollar(): Promise<number> {
    return this.dollarService.refreshOfficialRate();
  }

  /**
   * Cron job que actualiza el dólar oficial cada 15 minutos
   * Esto asegura que siempre tengamos un dólar relativamente actualizado
   */
  @Cron('*/15 * * * *') // Cada 15 minutos
  async handleDollarRefresh() {
    try {
      const rate = await this.dollarService.refreshOfficialRate();
      this.logger.log(`[Cron] Dollar rate refreshed: ${rate}`);
    } catch (error) {
      this.logger.error(`[Cron] Error refreshing dollar rate: ${error.message}`);
    }
  }

  getDatabasePath(): string {
    return 'sqlite.db';
  }
}


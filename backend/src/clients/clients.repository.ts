import { Injectable } from '@nestjs/common';
import { Client } from './entities/client.entity';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { DatabaseService } from '../database/database.service';
import * as sqlite3 from 'sqlite3';

@Injectable()
export class ClientsRepository {
  private db: sqlite3.Database;

  constructor(private databaseService: DatabaseService) {
    this.db = this.databaseService.getDatabase();
    this.initDatabase();
  }

  private initDatabase() {
    this.db.serialize(() => {
      // Verificar si la tabla existe y tiene la estructura antigua
      this.db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='clients'", (err, row: any) => {
        if (row) {
          // Verificar si tiene la columna email
          this.db.all("PRAGMA table_info(clients)", (err, columns: any[]) => {
            const hasEmail = columns.some(c => c.name === 'email');
            
            if (!hasEmail) {
              // Agregar columna email
              this.db.run('ALTER TABLE clients ADD COLUMN email TEXT', (err) => {
                if (err) console.error('Error adding email column:', err);
              });
            }
            
            // Hacer rubro y company opcionales (ya son TEXT, solo necesitamos actualizar la lógica)
            this.ensureDefaultValues();
          });
        } else {
          // Crear tabla nueva
          this.db.run(`
            CREATE TABLE IF NOT EXISTS clients (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              name TEXT NOT NULL,
              phone TEXT NOT NULL,
              email TEXT,
              rubro TEXT,
              company TEXT,
              notes TEXT,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
          `, () => {
            this.ensureDefaultValues();
          });
        }
      });
    });
  }

  private ensureDefaultValues() {
    // Insertar datos mock solo si no hay clientes
    this.db.get('SELECT COUNT(*) as count FROM clients', (err, row: any) => {
      if (row.count === 0) {
        const stmt = this.db.prepare(`
          INSERT INTO clients (id, name, phone, rubro, company) 
          VALUES (?, ?, ?, ?, ?)
        `);
        stmt.run(1, 'Clínica San Martín', '+5491133445566', 'Diálisis', 'Renalife');
        stmt.run(2, 'Hospital del Sur', '+5491144221133', 'Cardiología', 'Addisfarm');
        stmt.finalize();
      }
    });
  }

  async findAll(): Promise<Client[]> {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM clients ORDER BY created_at DESC', (err, rows: any[]) => {
        if (err) reject(err);
        else resolve(rows.map(this.mapRowToClient));
      });
    });
  }

  async findOne(id: number): Promise<Client | null> {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM clients WHERE id = ?', [id], (err, row: any) => {
        if (err) reject(err);
        else resolve(row ? this.mapRowToClient(row) : null);
      });
    });
  }

  async create(createClientDto: CreateClientDto): Promise<Client> {
    return new Promise((resolve, reject) => {
      const { name, phone, email, rubro, company, notes } = createClientDto;
      this.db.run(
        'INSERT INTO clients (name, phone, email, rubro, company, notes) VALUES (?, ?, ?, ?, ?, ?)',
        [name, phone, email || null, rubro || null, company || null, notes || null],
        function(err) {
          if (err) reject(err);
          else {
            this.db.get('SELECT * FROM clients WHERE id = ?', [this.lastID], (err, row: any) => {
              if (err) reject(err);
              else resolve(this.mapRowToClient(row));
            });
          }
        }.bind(this)
      );
    });
  }

  async update(id: number, updateClientDto: UpdateClientDto): Promise<Client | null> {
    return new Promise((resolve, reject) => {
      const fields: string[] = [];
      const values: any[] = [];
      
      if (updateClientDto.name !== undefined) {
        fields.push('name = ?');
        values.push(updateClientDto.name);
      }
      if (updateClientDto.phone !== undefined) {
        fields.push('phone = ?');
        values.push(updateClientDto.phone);
      }
      if (updateClientDto.email !== undefined) {
        fields.push('email = ?');
        values.push(updateClientDto.email);
      }
      if (updateClientDto.rubro !== undefined) {
        fields.push('rubro = ?');
        values.push(updateClientDto.rubro);
      }
      if (updateClientDto.company !== undefined) {
        fields.push('company = ?');
        values.push(updateClientDto.company);
      }
      if (updateClientDto.notes !== undefined) {
        fields.push('notes = ?');
        values.push(updateClientDto.notes);
      }
      
      fields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);
      
      const self = this;
      this.db.run(
        `UPDATE clients SET ${fields.join(', ')} WHERE id = ?`,
        values,
        function(err) {
          if (err) reject(err);
          else {
            self.db.get('SELECT * FROM clients WHERE id = ?', [id], (err, row: any) => {
              if (err) reject(err);
              else resolve(row ? self.mapRowToClient(row) : null);
            });
          }
        }
      );
    });
  }

  async remove(id: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM clients WHERE id = ?', [id], function(err) {
        if (err) reject(err);
        else resolve(this.changes > 0);
      });
    });
  }

  private mapRowToClient(row: any): Client {
    return {
      id: row.id,
      name: row.name,
      phone: row.phone,
      email: row.email,
      rubro: row.rubro,
      company: row.company,
      notes: row.notes,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    };
  }

  async findByPhone(phone: string): Promise<Client | null> {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM clients WHERE phone = ?', [phone], (err, row: any) => {
        if (err) reject(err);
        else resolve(row ? this.mapRowToClient(row) : null);
      });
    });
  }

  async createBatch(clients: CreateClientDto[]): Promise<number> {
    return new Promise((resolve, reject) => {
      let inserted = 0;
      let processed = 0;

      if (clients.length === 0) {
        return resolve(0);
      }

      clients.forEach((clientDto) => {
        this.findByPhone(clientDto.phone).then((existing) => {
          if (!existing) {
            this.create(clientDto)
              .then(() => {
                inserted++;
                processed++;
                if (processed === clients.length) {
                  resolve(inserted);
                }
              })
              .catch((err) => {
                processed++;
                if (processed === clients.length) {
                  resolve(inserted);
                }
              });
          } else {
            processed++;
            if (processed === clients.length) {
              resolve(inserted);
            }
          }
        }).catch(() => {
          processed++;
          if (processed === clients.length) {
            resolve(inserted);
          }
        });
      });
    });
  }
}


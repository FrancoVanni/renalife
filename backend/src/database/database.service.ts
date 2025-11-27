import { Injectable, OnModuleDestroy } from '@nestjs/common';
import * as sqlite3 from 'sqlite3';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private static dbInstance: sqlite3.Database | null = null;

  constructor() {
    if (!DatabaseService.dbInstance) {
      // Determinar el path de la base de datos
      // En Render con Persistent Disk, usar la variable de entorno o path por defecto
      // En desarrollo, usar el directorio actual
      let dbPath: string;
      
      if (process.env.NODE_ENV === 'production') {
        // Render Persistent Disk se monta en /opt/render/project/src/persistent
        // O usar variable de entorno si está configurada
        dbPath = process.env.DATABASE_PATH || '/opt/render/project/src/persistent/sqlite.db';
      } else {
        // Desarrollo local
        dbPath = 'sqlite.db';
      }
      
      DatabaseService.dbInstance = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          console.error('Error opening database:', err);
        } else {
          console.log(`✅ Database connected at: ${dbPath}`);
        }
      });
    }
  }

  getDatabase(): sqlite3.Database {
    return DatabaseService.dbInstance!;
  }

  onModuleDestroy() {
    if (DatabaseService.dbInstance) {
      DatabaseService.dbInstance.close((err) => {
        if (err) {
          console.error('Error closing database:', err);
        } else {
          DatabaseService.dbInstance = null;
        }
      });
    }
  }
}


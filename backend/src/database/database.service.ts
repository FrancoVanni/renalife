import { Injectable, OnModuleDestroy } from '@nestjs/common';
import * as sqlite3 from 'sqlite3';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private static dbInstance: sqlite3.Database | null = null;

  constructor() {
    if (!DatabaseService.dbInstance) {
      // En producción (Render), usar /tmp para persistencia entre deploys
      // En desarrollo, usar el directorio actual
      const dbPath = process.env.NODE_ENV === 'production' 
        ? '/tmp/sqlite.db' 
        : 'sqlite.db';
      DatabaseService.dbInstance = new sqlite3.Database(dbPath);
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


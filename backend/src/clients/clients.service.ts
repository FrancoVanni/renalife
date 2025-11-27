import { Injectable } from '@nestjs/common';
import { ClientsRepository } from './clients.repository';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { Client } from './entities/client.entity';

@Injectable()
export class ClientsService {
  constructor(private readonly clientsRepository: ClientsRepository) {}

  async findAll(): Promise<Client[]> {
    return this.clientsRepository.findAll();
  }

  async findOne(id: number): Promise<Client | null> {
    return this.clientsRepository.findOne(id);
  }

  async create(createClientDto: CreateClientDto): Promise<Client> {
    return this.clientsRepository.create(createClientDto);
  }

  async update(id: number, updateClientDto: UpdateClientDto): Promise<Client | null> {
    return this.clientsRepository.update(id, updateClientDto);
  }

  async remove(id: number): Promise<boolean> {
    return this.clientsRepository.remove(id);
  }

  async importClients(file: Express.Multer.File): Promise<{ imported: number; errors: string[] }> {
    const errors: string[] = [];
    const clients: Array<{ name: string; phone: string; email?: string }> = [];

    try {
      const content = file.buffer.toString('utf-8');
      const lines = content.split('\n').filter(line => line.trim());

      for (const line of lines) {
        try {
          const parsed = this.parseContactLine(line);
          if (parsed) {
            clients.push(parsed);
          }
        } catch (error: any) {
          errors.push(`Error parsing line "${line}": ${error.message}`);
        }
      }

      const imported = await this.clientsRepository.createBatch(clients);

      return {
        imported,
        errors,
      };
    } catch (error: any) {
      throw new Error(`Error importing clients: ${error.message}`);
    }
  }

  private parseContactLine(line: string): { name: string; phone: string; email?: string } | null {
    // Intentar parsear como CSV
    if (line.includes(',')) {
      const parts = line.split(',').map(p => p.trim());
      if (parts.length >= 2) {
        const name = parts[0];
        const phone = this.normalizePhone(parts[1]);
        const email = parts.length >= 3 ? parts[2] : undefined;
        
        if (name && phone) {
          return { name, phone, email };
        }
      }
    }

    // Intentar parsear como formato de chat de WhatsApp
    // Formato común: "Nombre - +5491123456789" o "Nombre: +5491123456789"
    const whatsappPattern = /^(.+?)[\s\-:]+(\+?\d{10,15})/;
    const match = line.match(whatsappPattern);
    if (match) {
      const name = match[1].trim();
      const phone = this.normalizePhone(match[2].trim());
      return { name, phone };
    }

    // Intentar extraer teléfono y nombre de cualquier formato
    const phonePattern = /(\+?\d{10,15})/;
    const phoneMatch = line.match(phonePattern);
    if (phoneMatch) {
      const phone = this.normalizePhone(phoneMatch[1]);
      const name = line.replace(phonePattern, '').trim() || 'Cliente';
      return { name, phone };
    }

    return null;
  }

  private normalizePhone(phone: string): string {
    // Remover espacios, guiones, paréntesis
    let normalized = phone.replace(/[\s\-\(\)]/g, '');
    
    // Si no empieza con +, agregar código de país argentino si tiene 10 dígitos
    if (!normalized.startsWith('+')) {
      if (normalized.length === 10 && normalized.startsWith('9')) {
        normalized = '+54' + normalized;
      } else if (normalized.length === 10) {
        normalized = '+549' + normalized;
      }
    }
    
    return normalized;
  }
}


import { Injectable, Logger } from '@nestjs/common';

interface DollarRateCache {
  rate: number;
  timestamp: number;
}

@Injectable()
export class DollarService {
  private readonly logger = new Logger(DollarService.name);
  private cache: DollarRateCache | null = null;
  private readonly CACHE_TTL = 10 * 60 * 1000; // 10 minutos en milisegundos
  private readonly FRESH_CACHE_TTL = 5 * 60 * 1000; // 5 minutos para considerar "fresco"

  /**
   * Obtiene el dólar oficial desde una API pública
   * Usa Bluelytics como fuente principal
   */
  async getOfficialRate(): Promise<number> {
    // Verificar cache
    if (this.cache && Date.now() - this.cache.timestamp < this.CACHE_TTL) {
      this.logger.debug(`Using cached dollar rate: ${this.cache.rate}`);
      return this.cache.rate;
    }

    try {
      // Intentar con Bluelytics
      const rate = await this.fetchFromBluelytics();
      
      // Actualizar cache
      this.cache = {
        rate,
        timestamp: Date.now(),
      };

      this.logger.log(`Dollar rate updated: ${rate}`);
      return rate;
    } catch (error) {
      this.logger.error(`Error fetching dollar rate: ${error.message}`);
      
      // Si hay cache válido aunque esté expirado, usarlo como fallback
      if (this.cache) {
        this.logger.warn(`Using expired cache as fallback: ${this.cache.rate}`);
        return this.cache.rate;
      }

      // Fallback: retornar un valor por defecto
      this.logger.warn('No cache available, using default rate: 1000');
      return 1000;
    }
  }

  /**
   * Fuerza la actualización del dólar oficial
   */
  async refreshOfficialRate(): Promise<number> {
    this.cache = null;
    return this.getOfficialRate();
  }

  /**
   * Verifica si el cache es "fresco" (menos de 5 minutos)
   * Útil para refrescar antes de generar mensajes importantes
   */
  isCacheFresh(): boolean {
    if (!this.cache) return false;
    return Date.now() - this.cache.timestamp < this.FRESH_CACHE_TTL;
  }

  /**
   * Obtiene el dólar, refrescando si el cache no es fresco
   * Útil para operaciones críticas como generar mensajes
   */
  async getOfficialRateFresh(): Promise<number> {
    if (!this.isCacheFresh()) {
      this.logger.debug('Cache not fresh, refreshing dollar rate before operation');
      return this.refreshOfficialRate();
    }
    return this.getOfficialRate();
  }

  private async fetchFromBluelytics(): Promise<number> {
    try {
      const response = await fetch('https://api.bluelytics.com.ar/v2/latest');
      
      if (!response.ok) {
        throw new Error(`Bluelytics API returned ${response.status}`);
      }

      const data = await response.json();
      
      // Bluelytics devuelve: { oficial: { value_sell: number }, ... }
      if (data.oficial && data.oficial.value_sell) {
        return data.oficial.value_sell;
      }

      throw new Error('Invalid response format from Bluelytics');
    } catch (error) {
      // Si Bluelytics falla, intentar con otra API
      this.logger.warn(`Bluelytics failed: ${error.message}, trying alternative...`);
      return this.fetchFromAlternative();
    }
  }

  private async fetchFromAlternative(): Promise<number> {
    try {
      // API alternativa: dolarapi.io
      const response = await fetch('https://dolarapi.io/v1/dolares/oficial');
      
      if (!response.ok) {
        throw new Error(`Alternative API returned ${response.status}`);
      }

      const data = await response.json();
      
      if (data.venta) {
        return data.venta;
      }

      throw new Error('Invalid response format from alternative API');
    } catch (error) {
      this.logger.error(`Alternative API also failed: ${error.message}`);
      throw error;
    }
  }
}


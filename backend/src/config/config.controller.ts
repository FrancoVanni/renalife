import { Controller, Get, Post, Body, Patch } from '@nestjs/common';
import { ConfigService } from './config.service';
import { UpdateConfigDto } from './dto/update-config.dto';

@Controller('config')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  getConfig() {
    return this.configService.getConfig();
  }

  @Get('dollar-oficial')
  async getDollarOficial() {
    const rate = await this.configService.refreshOfficialDollar();
    return { dollar_rate_official: rate };
  }

  @Patch()
  updateConfig(@Body() updateConfigDto: UpdateConfigDto) {
    return this.configService.updateConfig(updateConfigDto);
  }
}


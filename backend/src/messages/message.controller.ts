import { Controller, Post, Body } from '@nestjs/common';
import { MessageService, MessageGenerationInput } from './message.service';

@Controller('messages')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Post('generate')
  async generateMessages(@Body() input: MessageGenerationInput) {
    return this.messageService.generateMessages(input);
  }
}


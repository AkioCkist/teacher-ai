import { Controller, Get, Query, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { TtsService } from './tts.service';

@Controller('tts')
export class TtsController {
  constructor(private readonly ttsService: TtsService) {}

  /**
   * Synthesize Vietnamese text to speech
   * GET /api/tts?text=Xin+ch%C3%A0o
   */
  @Get()
  async synthesize(
    @Query('text') text: string,
    @Res() res: Response,
  ): Promise<void> {
    if (!text || !text.trim()) {
      res.status(400).json({ error: 'Missing text parameter' });
      return;
    }

    const buffer = await this.ttsService.synthesize(text.trim());
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(HttpStatus.OK).end(buffer);
  }
}

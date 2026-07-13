import { Injectable, Logger } from '@nestjs/common';
import { TTSException } from '../../common/exceptions/app.exception';

@Injectable()
export class TtsService {
  private readonly logger = new Logger(TtsService.name);

  /**
   * Synthesize Vietnamese text to speech via Google Translate TTS proxy.
   * Server-side call — không bị CORS, không cần API key.
   */
  async synthesize(text: string): Promise<Buffer> {
    const url =
      `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=vi&q=${encodeURIComponent(text)}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Referer: 'https://translate.google.com/',
      },
    });

    if (!response.ok) {
      this.logger.error(`Google TTS error: ${response.status}`);
      throw new TTSException(`TTS API error: ${response.status}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    return buffer;
  }
}

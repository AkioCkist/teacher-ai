import { Injectable, Logger } from '@nestjs/common';
import { TTSException } from '../../common/exceptions/app.exception';

@Injectable()
export class TtsService {
  private readonly logger = new Logger(TtsService.name);
  private readonly CHUNK_SIZE = 180;

  /**
   * Split text into chunks at ~CHUNK_SIZE chars, preferring newline boundaries.
   */
  private chunkText(text: string): string[] {
    if (text.length <= this.CHUNK_SIZE) return [text];

    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      if (start + this.CHUNK_SIZE >= text.length) {
        chunks.push(text.slice(start));
        break;
      }

      // Try to break at newline within chunk window
      const window = text.slice(start, start + this.CHUNK_SIZE);
      const newlineIdx = window.lastIndexOf('\n');
      if (newlineIdx > this.CHUNK_SIZE / 2) {
        chunks.push(text.slice(start, start + newlineIdx));
        start += newlineIdx;
      } else {
        chunks.push(window);
        start += this.CHUNK_SIZE;
      }
    }

    return chunks;
  }

  /**
   * Fetch TTS audio for a single chunk from Google Translate.
   */
  private async fetchChunk(chunk: string): Promise<Buffer> {
    const url =
      `https://translate.google.com/translate_tts?ie=UTF-8&client=gtx&tl=vi&q=${encodeURIComponent(chunk)}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        Referer: 'https://translate.google.com.vn/',
        'Accept-Language': 'vi-VN,vi;q=0.9',
      },
    });

    if (!response.ok) {
      this.logger.warn(`TTS chunk failed: ${response.status} for "${chunk.slice(0, 40)}..."`);
      return Buffer.from([]);
    }

    return Buffer.from(await response.arrayBuffer());
  }

  /**
   * Synthesize Vietnamese text to speech via Google Translate TTS proxy.
   * Splits long text into chunks, fetches sequentially, concatenates MP3 buffers.
   */
  async synthesize(text: string): Promise<Buffer> {
    const chunks = this.chunkText(text);
    const buffers: Buffer[] = [];

    for (const chunk of chunks) {
      const buf = await this.fetchChunk(chunk);
      if (buf.length > 0) buffers.push(buf);
    }

    if (buffers.length === 0) {
      this.logger.error('TTS all chunks failed');
      return Buffer.from([]);
    }

    return Buffer.concat(buffers);
  }
}

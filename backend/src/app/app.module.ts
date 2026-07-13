import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SessionModule } from '../modules/session/session.module';
import { ChatModule } from '../modules/chat/chat.module';
import { EvaluationModule } from '../modules/evaluation/evaluation.module';
import { AiModule } from '../modules/ai/ai.module';
import { StorageModule } from '../modules/storage/storage.module';
import { TtsModule } from '../modules/tts/tts.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../.env', '.env'],
    }),

    // Feature modules
    StorageModule,
    AiModule,
    SessionModule,
    ChatModule,
    EvaluationModule,
    TtsModule,
  ],
})
export class AppModule {}

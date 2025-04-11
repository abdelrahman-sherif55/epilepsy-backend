import { Logger, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Environment } from '../common/interfaces/environment.interface';
import { Connection } from 'mongoose';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService<Environment>) => {
        const logger = new Logger('MongoModule');
        return {
          uri: configService.get('DB_URI', { infer: true }),
          onConnectionCreate: (connection: Connection) => {
            connection.on('connected', () =>
              logger.debug('Database connected'),
            );
            connection.on('open', () => logger.debug('Database opened'));
            connection.on('reconnected', () => logger.debug('reconnected'));
            connection.on('disconnecting', () => logger.debug('disconnecting'));
            connection.on('disconnected', () => logger.debug('disconnected'));
          },
        };
      },
    }),
  ],
})
export class MongoModule {}

import { Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from './logger.service';

@Module({
  imports: [
    WinstonModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const logLevel = configService.get<string>('logging.level', 'info');

        return {
          level: logLevel,
          format: winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            winston.format.errors({ stack: true }),
            winston.format.splat(),
            winston.format.json(),
          ),
          defaultMeta: { service: 'mattr-issuance-backend' },
          transports: [
            new winston.transports.Console({
              format: winston.format.combine(
                winston.format.colorize(),
                winston.format.printf(
                  ({ timestamp, level, message, context, trace }) => {
                    return `${timestamp} [${context}] ${level}: ${message}${trace ? `\n${trace}` : ''}`;
                  },
                ),
              ),
            }),
            new winston.transports.File({
              filename: 'logs/error.log',
              level: 'error',
            }),
            new winston.transports.File({
              filename: 'logs/combined.log',
            }),
          ],
        };
      },
    }),
  ],
  providers: [LoggerService],
  exports: [LoggerService],
})
export class LoggerModule {}

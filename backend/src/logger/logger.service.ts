import { Injectable, LoggerService as NestLoggerService, Inject } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { WinstonLogger } from 'nest-winston';

@Injectable()
export class LoggerService implements NestLoggerService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: WinstonLogger,
  ) {}

  log(message: string, context?: string) {
    this.logger.log(message, context);
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, trace, context);
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, context);
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, context);
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, context);
  }
}

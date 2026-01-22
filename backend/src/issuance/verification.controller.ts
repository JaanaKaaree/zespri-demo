import { Controller, Post, Body, Logger } from '@nestjs/common';
import { IssuanceService } from './issuance.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('api/v1')
export class VerificationController {
  private readonly logger = new Logger(VerificationController.name);

  constructor(private readonly issuanceService: IssuanceService) {}

  @Public()
  @Post('verify')
  async verifyCredential(@Body() body: any) {
    this.logger.log('📥 Verification request received');
    this.logger.log(`Request body keys: ${Object.keys(body).join(', ')}`);
    this.logger.log(`Payload length: ${body.payload?.length || 0} chars`);
    
    if (!body.payload || typeof body.payload !== 'string') {
      this.logger.error('❌ Invalid request: payload is missing or not a string');
      throw new Error('payload must be a non-empty string');
    }
    
    const result = await this.issuanceService.verifyCredential(body.payload);
    
    this.logger.log('═══════════════════════════════════════════════════════════');
    this.logger.log('📤 RETURNING TO REACT APP');
    this.logger.log('═══════════════════════════════════════════════════════════');
    this.logger.log(`Verified: ${result.verified}`);
    if (result.decoded) {
      this.logger.log(`Decoded data: ${JSON.stringify(result.decoded, null, 2)}`);
    }
    this.logger.log('═══════════════════════════════════════════════════════════');
    
    return result;
  }
}

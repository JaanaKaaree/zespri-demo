import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { IssuanceService } from './issuance.service';
import { CreateCredentialDto } from './dto/create-credential.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';

@Controller('issuance')
@UseGuards(JwtAuthGuard)
export class IssuanceController {
  constructor(private readonly issuanceService: IssuanceService) {}

  @Post('create')
  async createCredential(
    @Body() createCredentialDto: CreateCredentialDto,
    @Request() req,
  ) {
    this.issuanceService['logger'].log(
      `User ${req.user.email} creating credential with template ${createCredentialDto.templateId}`,
    );
    return this.issuanceService.createCredential(createCredentialDto);
  }

  @Get('status/:id')
  async getCredentialStatus(@Param('id') id: string, @Request() req) {
    this.issuanceService['logger'].log(
      `User ${req.user.email} checking status for credential ${id}`,
    );
    return this.issuanceService.getCredentialStatus(id);
  }

  @Public()
  @Post('verify')
  async verifyCredential(@Body('payload') payload: string) {
    this.issuanceService['logger'].log(
      `Public verification request received for payload: ${payload?.substring(0, 50)}...`,
    );
    return this.issuanceService.verifyCredential(payload);
  }
}

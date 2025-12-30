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
import { IssueCredentialDto } from './dto/issue-credential.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

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

  @Post('issue')
  async issueCredential(
    @Body() issueCredentialDto: IssueCredentialDto,
    @Request() req,
  ) {
    this.issuanceService['logger'].log(
      `User ${req.user.email} issuing credential ${issueCredentialDto.credentialId}`,
    );
    return this.issuanceService.issueCredential(issueCredentialDto.credentialId);
  }

  @Get('status/:id')
  async getCredentialStatus(@Param('id') id: string, @Request() req) {
    this.issuanceService['logger'].log(
      `User ${req.user.email} checking status for credential ${id}`,
    );
    return this.issuanceService.getCredentialStatus(id);
  }
}

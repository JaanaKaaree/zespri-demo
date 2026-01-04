import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { OrganisationsService } from './organisations.service';
import { CreateOrganisationPartDto } from './dto/create-organisation-part.dto';
import { UpdateOrganisationPartDto } from './dto/update-organisation-part.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('nzbn/organisations')
@UseGuards(JwtAuthGuard)
export class OrganisationsController {
  constructor(private readonly organisationsService: OrganisationsService) {}

  @Get(':nzbn/parts')
  async getOrganisationParts(@Param('nzbn') nzbn: string, @Request() req) {
    const sessionId = req.user?.sessionId || req.user?.sub;
    if (!sessionId) {
      throw new UnauthorizedException('Session not found');
    }
    return this.organisationsService.getOrganisationParts(nzbn, sessionId);
  }

  @Post(':nzbn/organisation-parts')
  async createOrganisationPart(
    @Param('nzbn') nzbn: string,
    @Body() createOrganisationPartDto: CreateOrganisationPartDto,
    @Request() req,
  ) {
    const sessionId = req.user?.sessionId || req.user?.sub;
    if (!sessionId) {
      throw new UnauthorizedException('Session not found');
    }
    return this.organisationsService.createOrganisationPart(
      nzbn,
      sessionId,
      createOrganisationPartDto,
    );
  }

  @Put(':nzbn/organisation-parts/:opn')
  async updateOrganisationPart(
    @Param('nzbn') nzbn: string,
    @Param('opn') opn: string,
    @Body() updateOrganisationPartDto: UpdateOrganisationPartDto,
    @Request() req,
  ) {
    const sessionId = req.user?.sessionId || req.user?.sub;
    if (!sessionId) {
      throw new UnauthorizedException('Session not found');
    }
    return this.organisationsService.updateOrganisationPart(
      nzbn,
      opn,
      sessionId,
      updateOrganisationPartDto,
    );
  }

  @Delete(':nzbn/organisation-parts/:opn')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteOrganisationPart(
    @Param('nzbn') nzbn: string,
    @Param('opn') opn: string,
    @Request() req,
  ) {
    const sessionId = req.user?.sessionId || req.user?.sub;
    if (!sessionId) {
      throw new UnauthorizedException('Session not found');
    }
    await this.organisationsService.deleteOrganisationPart(nzbn, opn, sessionId);
  }
}

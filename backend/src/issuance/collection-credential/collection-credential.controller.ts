import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CollectionCredentialService } from './services/collection-credential.service';
import { CreateCollectionCredentialDto } from './dto/create-collection-credential.dto';
import { UpdateCollectionCredentialDto } from './dto/update-collection-credential.dto';
import { CollectionCredentialResponseDto } from './dto/collection-credential-response.dto';
import { CollectionCredentialFilters } from './interfaces/collection-credential.interface';

@Controller('issuance/collection')
@UseGuards(JwtAuthGuard)
export class CollectionCredentialController {
  constructor(
    private readonly collectionCredentialService: CollectionCredentialService,
  ) {}

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  async createCollectionCredential(
    @Body() createDto: CreateCollectionCredentialDto,
    @Request() req,
  ): Promise<CollectionCredentialResponseDto> {
    this.collectionCredentialService['logger'].log(
      `User ${req.user.email} creating collection credential for bin ${createDto.binIdentifier}`,
    );
    return this.collectionCredentialService.createCollectionCredential(createDto);
  }

  @Get(':id')
  async getCollectionCredential(
    @Param('id') id: string,
    @Request() req,
  ): Promise<CollectionCredentialResponseDto> {
    this.collectionCredentialService['logger'].log(
      `User ${req.user.email} getting collection credential ${id}`,
    );
    return this.collectionCredentialService.getCollectionCredential(id);
  }

  @Put(':id')
  async updateCollectionCredential(
    @Param('id') id: string,
    @Body() updateDto: UpdateCollectionCredentialDto,
    @Request() req,
  ): Promise<CollectionCredentialResponseDto> {
    this.collectionCredentialService['logger'].log(
      `User ${req.user.email} updating collection credential ${id}`,
    );
    return this.collectionCredentialService.updateCollectionCredential(id, updateDto);
  }

  @Get()
  async listCollectionCredentials(
    @Query('nzbn') nzbn?: string,
    @Query('orchardId') orchardId?: string,
    @Query('pickerId') pickerId?: string,
    @Query('status') status?: 'pending' | 'issued' | 'failed',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<CollectionCredentialResponseDto[]> {
    const filters: CollectionCredentialFilters = {};
    if (nzbn) filters.nzbn = nzbn;
    if (orchardId) filters.orchardId = orchardId;
    if (pickerId) filters.pickerId = pickerId;
    if (status) filters.status = status;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    return this.collectionCredentialService.listCollectionCredentials(filters);
  }

  @Post(':id/issue')
  async issueCollectionCredential(
    @Param('id') id: string,
    @Request() req,
  ): Promise<CollectionCredentialResponseDto> {
    this.collectionCredentialService['logger'].log(
      `User ${req.user.email} issuing collection credential ${id}`,
    );
    return this.collectionCredentialService.issueCollectionCredential(id);
  }
}

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
import { DeliveryCredentialService } from './services/delivery-credential.service';
import { CreateDeliveryCredentialDto } from './dto/create-delivery-credential.dto';
import { UpdateDeliveryCredentialDto } from './dto/update-delivery-credential.dto';
import { DeliveryCredentialResponseDto } from './dto/delivery-credential-response.dto';
import { DeliveryCredentialFilters } from './interfaces/delivery-credential.interface';

@Controller('issuance/delivery')
@UseGuards(JwtAuthGuard)
export class DeliveryCredentialController {
  constructor(
    private readonly deliveryCredentialService: DeliveryCredentialService,
  ) {}

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  async createDeliveryCredential(
    @Body() createDto: CreateDeliveryCredentialDto,
    @Request() req,
  ): Promise<DeliveryCredentialResponseDto> {
    this.deliveryCredentialService['logger'].log(
      `User ${req.user.email} creating delivery credential from ${createDto.originAddress} to ${createDto.destinationAddress}`,
    );
    return this.deliveryCredentialService.createDeliveryCredential(createDto);
  }

  @Get(':id')
  async getDeliveryCredential(
    @Param('id') id: string,
    @Request() req,
  ): Promise<DeliveryCredentialResponseDto> {
    this.deliveryCredentialService['logger'].log(
      `User ${req.user.email} getting delivery credential ${id}`,
    );
    return this.deliveryCredentialService.getDeliveryCredential(id);
  }

  @Put(':id')
  async updateDeliveryCredential(
    @Param('id') id: string,
    @Body() updateDto: UpdateDeliveryCredentialDto,
    @Request() req,
  ): Promise<DeliveryCredentialResponseDto> {
    this.deliveryCredentialService['logger'].log(
      `User ${req.user.email} updating delivery credential ${id}`,
    );
    return this.deliveryCredentialService.updateDeliveryCredential(id, updateDto);
  }

  @Get()
  async listDeliveryCredentials(
    @Query('nzbn') nzbn?: string,
    @Query('driverId') driverId?: string,
    @Query('vehicleId') vehicleId?: string,
    @Query('collectionId') collectionId?: string,
    @Query('status') status?: 'pending' | 'issued' | 'failed',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<DeliveryCredentialResponseDto[]> {
    const filters: DeliveryCredentialFilters = {};
    if (nzbn) filters.nzbn = nzbn;
    if (driverId) filters.driverId = driverId;
    if (vehicleId) filters.vehicleId = vehicleId;
    if (collectionId) filters.collectionId = collectionId;
    if (status) filters.status = status;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    return this.deliveryCredentialService.listDeliveryCredentials(filters);
  }

  @Post(':id/issue')
  async issueDeliveryCredential(
    @Param('id') id: string,
    @Request() req,
  ): Promise<DeliveryCredentialResponseDto> {
    this.deliveryCredentialService['logger'].log(
      `User ${req.user.email} issuing delivery credential ${id}`,
    );
    return this.deliveryCredentialService.issueDeliveryCredential(id);
  }
}

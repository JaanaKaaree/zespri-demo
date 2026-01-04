import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { OrganisationsService } from './organisations.service';
import { CreateOrganisationPartDto } from './dto/create-organisation-part.dto';
import { UpdateOrganisationPartDto } from './dto/update-organisation-part.dto';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('OrganisationsService', () => {
  let service: OrganisationsService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: string) => {
      if (key === 'nzbn.apiUrl') {
        return 'https://api.business.govt.nz/sandbox';
      }
      return defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganisationsService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<OrganisationsService>(OrganisationsService);
    configService = module.get<ConfigService>(ConfigService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createOrganisationPart', () => {
    const mockToken = 'test-oauth-token';
    const mockNzbn = '1234567890123';
    const mockCreateDto: CreateOrganisationPartDto = {
      termsAndConditionsAccepted: true,
      organisationPart: {
        name: 'Test Organisation Part',
        function: 'FUNCTION' as any,
        organisationPartStatus: 'ACTIVE' as any,
      },
    };

    const mockResponse = {
      data: {
        opn: 'OPN123',
        name: 'Test Organisation Part',
        parentNzbn: mockNzbn,
      },
    };

    it('should create an organisation part successfully', async () => {
      mockedAxios.create = jest.fn(() => ({
        post: jest.fn().mockResolvedValue(mockResponse),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      })) as any;

      const service = new OrganisationsService(configService);
      const result = await service.createOrganisationPart(mockNzbn, mockToken, mockCreateDto);

      expect(result).toEqual(mockResponse.data);
    });

    it('should handle errors when creating organisation part', async () => {
      const mockError = {
        response: {
          status: 400,
          data: {
            errorCode: 'VALIDATION_ERROR',
            errorDescription: 'Invalid input',
          },
        },
        message: 'Request failed',
      };

      mockedAxios.create = jest.fn(() => ({
        post: jest.fn().mockRejectedValue(mockError),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      })) as any;

      const service = new OrganisationsService(configService);

      await expect(
        service.createOrganisationPart(mockNzbn, mockToken, mockCreateDto),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('updateOrganisationPart', () => {
    const mockToken = 'test-oauth-token';
    const mockNzbn = '1234567890123';
    const mockOpn = 'OPN123';
    const mockUpdateDto: UpdateOrganisationPartDto = {
      name: 'Updated Organisation Part',
      organisationPartStatus: 'ACTIVE' as any,
    };

    const mockResponse = {
      data: {
        opn: mockOpn,
        name: 'Updated Organisation Part',
        parentNzbn: mockNzbn,
      },
    };

    it('should update an organisation part successfully', async () => {
      mockedAxios.create = jest.fn(() => ({
        put: jest.fn().mockResolvedValue(mockResponse),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      })) as any;

      const service = new OrganisationsService(configService);
      const result = await service.updateOrganisationPart(mockNzbn, mockOpn, mockToken, mockUpdateDto);

      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('deleteOrganisationPart', () => {
    const mockToken = 'test-oauth-token';
    const mockNzbn = '1234567890123';
    const mockOpn = 'OPN123';

    it('should delete an organisation part successfully', async () => {
      mockedAxios.create = jest.fn(() => ({
        delete: jest.fn().mockResolvedValue({ status: 204 }),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      })) as any;

      const service = new OrganisationsService(configService);
      await expect(
        service.deleteOrganisationPart(mockNzbn, mockOpn, mockToken),
      ).resolves.not.toThrow();
    });
  });
});

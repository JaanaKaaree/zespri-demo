import { Test, TestingModule } from '@nestjs/testing';
import { OrganisationsController } from './organisations.controller';
import { OrganisationsService } from './organisations.service';
import { CreateOrganisationPartDto } from './dto/create-organisation-part.dto';
import { UpdateOrganisationPartDto } from './dto/update-organisation-part.dto';

describe('OrganisationsController', () => {
  let controller: OrganisationsController;
  let service: OrganisationsService;

  const mockOrganisationsService = {
    createOrganisationPart: jest.fn(),
    updateOrganisationPart: jest.fn(),
    deleteOrganisationPart: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrganisationsController],
      providers: [
        {
          provide: OrganisationsService,
          useValue: mockOrganisationsService,
        },
      ],
    }).compile();

    controller = module.get<OrganisationsController>(OrganisationsController);
    service = module.get<OrganisationsService>(OrganisationsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createOrganisationPart', () => {
    it('should create an organisation part', async () => {
      const mockNzbn = '1234567890123';
      const mockDto: CreateOrganisationPartDto = {
        termsAndConditionsAccepted: true,
        organisationPart: {
          name: 'Test Part',
          function: 'FUNCTION' as any,
        },
      };
      const mockToken = 'test-token';
      const mockRequest = { oauthToken: mockToken };
      const mockResponse = { opn: 'OPN123', name: 'Test Part' };

      mockOrganisationsService.createOrganisationPart.mockResolvedValue(mockResponse);

      const result = await controller.createOrganisationPart(mockNzbn, mockDto, mockRequest);

      expect(service.createOrganisationPart).toHaveBeenCalledWith(mockNzbn, mockToken, mockDto);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('updateOrganisationPart', () => {
    it('should update an organisation part', async () => {
      const mockNzbn = '1234567890123';
      const mockOpn = 'OPN123';
      const mockDto: UpdateOrganisationPartDto = {
        name: 'Updated Part',
      };
      const mockToken = 'test-token';
      const mockRequest = { oauthToken: mockToken };
      const mockResponse = { opn: mockOpn, name: 'Updated Part' };

      mockOrganisationsService.updateOrganisationPart.mockResolvedValue(mockResponse);

      const result = await controller.updateOrganisationPart(mockNzbn, mockOpn, mockDto, mockRequest);

      expect(service.updateOrganisationPart).toHaveBeenCalledWith(mockNzbn, mockOpn, mockToken, mockDto);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('deleteOrganisationPart', () => {
    it('should delete an organisation part', async () => {
      const mockNzbn = '1234567890123';
      const mockOpn = 'OPN123';
      const mockToken = 'test-token';
      const mockRequest = { oauthToken: mockToken };

      mockOrganisationsService.deleteOrganisationPart.mockResolvedValue(undefined);

      await controller.deleteOrganisationPart(mockNzbn, mockOpn, mockRequest);

      expect(service.deleteOrganisationPart).toHaveBeenCalledWith(mockNzbn, mockOpn, mockToken);
    });
  });
});

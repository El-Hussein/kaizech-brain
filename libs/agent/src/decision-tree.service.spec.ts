import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { HttpService } from '@nestjs/axios';
import { DecisionTreeService, WebhookIncomingMessage } from './decision-tree.service';
import { TenantEntity } from '@kaizech/database';
import { of } from 'rxjs';

describe('DecisionTreeService', () => {
  let service: DecisionTreeService;
  let cacheManager: any;
  let httpService: any;

  beforeEach(async () => {
    cacheManager = {
      get: jest.fn(),
      set: jest.fn(),
    };

    httpService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DecisionTreeService,
        { provide: CACHE_MANAGER, useValue: cacheManager },
        { provide: HttpService, useValue: httpService },
      ],
    }).compile();

    service = module.get<DecisionTreeService>(DecisionTreeService);
  });

  it('should bypass to AI if menu is disabled', async () => {
    const tenant = { menuConfig: { isMenuEnabled: false } } as TenantEntity;
    const msg: WebhookIncomingMessage = { text: 'menu' };
    const result = await service.handleMessage(tenant, msg);
    expect(result).toBeNull();
  });

  it('should return categories for MENU_START payload', async () => {
    const tenant = { id: 'tenant1', menuConfig: { isMenuEnabled: true, apiBaseUrl: 'http://api.test', welcomeMessage: 'Welcome' } } as any;
    const msg: WebhookIncomingMessage = { payload: 'MENU_START' };
    
    cacheManager.get.mockResolvedValueOnce(null);
    httpService.get.mockReturnValueOnce(of({ data: [{ id: '1', name: 'Electronics' }] }));

    const result = await service.handleMessage(tenant, msg);
    
    expect(result).toEqual({
      reply: 'Welcome',
      interactiveType: 'list',
      buttons: [{ title: 'Electronics', payload: 'CAT_1' }]
    });
    expect(httpService.get).toHaveBeenCalledWith('http://api.test/categories', expect.any(Object));
    expect(cacheManager.set).toHaveBeenCalled();
  });

  it('should bypass to AI for random text', async () => {
    const tenant = { menuConfig: { isMenuEnabled: true, apiBaseUrl: 'http://api.test' } } as any;
    const msg: WebhookIncomingMessage = { text: 'I want a refund' };
    
    const result = await service.handleMessage(tenant, msg);
    expect(result).toBeNull();
  });
});

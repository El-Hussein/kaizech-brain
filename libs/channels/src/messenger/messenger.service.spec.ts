import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MessengerService } from './messenger.service';
import { AgentOrchestratorService } from '@kaizech/agent';
import { MessageChannel } from '@kaizech/shared';

describe('MessengerService', () => {
  let service: MessengerService;
  let orchestratorMock: any;

  beforeEach(async () => {
    orchestratorMock = {
      processMessage: jest.fn().mockResolvedValue({
        response: 'Test response',
        handedOff: false,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessengerService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn() },
        },
        {
          provide: AgentOrchestratorService,
          useValue: orchestratorMock,
        },
      ],
    }).compile();

    service = module.get<MessengerService>(MessengerService);
  });

  it('should process valid batched messenger payload', async () => {
    const payload = {
      object: 'page',
      entry: [
        {
          id: '1234567890',
          time: 1458692752478,
          messaging: [
            {
              sender: { id: 'user_psid_1' },
              recipient: { id: 'page_id_1' },
              message: {
                mid: 'mid.1457764197618:41d102a3e1ae206a38',
                text: 'hello, world!',
              },
            },
            {
              sender: { id: 'user_psid_2' },
              recipient: { id: 'page_id_1' },
              message: {
                mid: 'mid.1457764197618:41d102a3e1ae206a39',
                text: 'second message',
              },
            },
          ],
        },
      ],
    };

    const tenant = { id: 'tenant-123', settings: {} } as any;
    
    // Mock the send method to avoid actual HTTP calls
    jest.spyOn(service, 'sendMessengerMessage').mockResolvedValue();

    await service.handleIncomingPayload(payload, tenant);

    expect(orchestratorMock.processMessage).toHaveBeenCalledTimes(2);
    expect(orchestratorMock.processMessage).toHaveBeenCalledWith(expect.objectContaining({
      channelType: MessageChannel.MESSENGER,
      userMessage: 'hello, world!',
      channelUserId: 'user_psid_1',
    }));
  });

  it('should ignore non-page payloads', async () => {
    const payload = { object: 'instagram' };
    const tenant = { id: 'tenant-123' } as any;

    await service.handleIncomingPayload(payload, tenant);
    expect(orchestratorMock.processMessage).not.toHaveBeenCalled();
  });
});

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TicketEntity } from '@kaizech/database';
import { MemoryService } from '@kaizech/memory';
import { TicketStatus } from '@kaizech/shared';

@Injectable()
export class TicketsService {
  private readonly logger = new Logger(TicketsService.name);

  constructor(
    @InjectRepository(TicketEntity)
    private readonly ticketRepository: Repository<TicketEntity>,
    private readonly memoryService: MemoryService,
  ) {}

  async createHandoverTicket(
    tenantId: string,
    conversationId: string,
    reason: string,
    priority: string = 'medium',
  ): Promise<TicketEntity> {
    const ticket = this.ticketRepository.create({
      tenantId,
      conversationId,
      status: TicketStatus.OPEN,
      reason,
      priority,
    });

    const saved = await this.ticketRepository.save(ticket);

    // Pause AI conversation by updating status to handed_off
    await this.memoryService.handoverConversation(conversationId);

    this.logger.log(`Created handover ticket ${saved.id} for conversation ${conversationId}`);
    return saved;
  }

  async assignTicket(
    ticketId: string,
    assignedTo: string,
  ): Promise<TicketEntity> {
    const ticket = await this.ticketRepository.findOne({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException('Ticket not found');

    ticket.assignedTo = assignedTo;
    ticket.status = TicketStatus.IN_PROGRESS;
    return this.ticketRepository.save(ticket);
  }

  async resolveTicket(ticketId: string): Promise<TicketEntity> {
    const ticket = await this.ticketRepository.findOne({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException('Ticket not found');

    ticket.status = TicketStatus.RESOLVED;
    ticket.resolvedAt = new Date();

    // Resume AI conversation
    await this.memoryService.getOrCreateConversation('tenantId', 'channel', 'user');

    return this.ticketRepository.save(ticket);
  }

  async listTenantTickets(tenantId: string, status?: TicketStatus): Promise<TicketEntity[]> {
    const where: any = { tenantId };
    if (status) where.status = status;

    return this.ticketRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }
}

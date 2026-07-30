import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketEntity } from '@kaizech/database';
import { MemoryModule } from '@kaizech/memory';
import { TicketsService } from './tickets.service';

@Module({
  imports: [TypeOrmModule.forFeature([TicketEntity]), MemoryModule],
  providers: [TicketsService],
  exports: [TicketsService],
})
export class TicketsModule {}

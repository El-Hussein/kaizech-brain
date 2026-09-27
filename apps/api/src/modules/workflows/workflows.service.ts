import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkflowEntity } from '@kaizech/database/entities/workflow.entity';
import { CreateWorkflowDto, UpdateWorkflowDto } from './dto/workflow.dto';

@Injectable()
export class WorkflowsService {
  constructor(
    @InjectRepository(WorkflowEntity)
    private readonly workflowRepo: Repository<WorkflowEntity>,
  ) {}

  async listWorkflows(tenantId: string) {
    return this.workflowRepo.find({
      where: { tenant_id: tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  async getWorkflow(tenantId: string, id: string) {
    const workflow = await this.workflowRepo.findOne({
      where: { id, tenant_id: tenantId },
    });
    if (!workflow) {
      throw new NotFoundException('Workflow not found');
    }
    return workflow;
  }

  async createWorkflow(tenantId: string, dto: CreateWorkflowDto) {
    const workflow = this.workflowRepo.create({
      ...dto,
      tenant_id: tenantId,
    });
    return this.workflowRepo.save(workflow);
  }

  async updateWorkflow(tenantId: string, id: string, dto: UpdateWorkflowDto) {
    const workflow = await this.getWorkflow(tenantId, id);
    Object.assign(workflow, dto);
    return this.workflowRepo.save(workflow);
  }

  async deleteWorkflow(tenantId: string, id: string) {
    const workflow = await this.getWorkflow(tenantId, id);
    await this.workflowRepo.remove(workflow);
    return { success: true };
  }
}

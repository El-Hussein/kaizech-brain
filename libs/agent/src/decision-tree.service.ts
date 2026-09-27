import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { TenantEntity } from '@kaizech/database';
import { WorkflowEntity } from '@kaizech/database/entities/workflow.entity';
import { firstValueFrom } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

export interface WebhookIncomingMessage {
  text?: string;
  payload?: string;
}

@Injectable()
export class DecisionTreeService {
  private readonly logger = new Logger(DecisionTreeService.name);

  constructor(
    private readonly httpService: HttpService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    @InjectRepository(WorkflowEntity)
    private readonly workflowRepo: Repository<WorkflowEntity>,
  ) {}

  public async handleMessage(tenant: TenantEntity, message: WebhookIncomingMessage): Promise<any> {
    const text = message.text?.toLowerCase().trim();
    
    // ==========================================
    // 1. Dynamic Workflow Engine (FlowStudio)
    // ==========================================
    if (text) {
      // Find a workflow triggered by this exact text
      const workflow = await this.workflowRepo.createQueryBuilder('wf')
        .where('wf.tenant_id = :tenantId', { tenantId: tenant.id })
        .andWhere('wf.isActive = true')
        .andWhere(':text = ANY(wf.triggerKeywords)', { text })
        .getOne();

      if (workflow && workflow.nodes && workflow.nodes.length > 0) {
        // Increment execution count asynchronously
        this.workflowRepo.increment({ id: workflow.id }, 'executionCount', 1).catch(() => {});
        
        // Execute the first node of the workflow
        return this.executeWorkflowNode(tenant, workflow, workflow.nodes[0]);
      }
    }

    // Ensure we handle both proper interactive payloads AND raw text fallbacks (e.g. from the dashboard playground)
    const payloadStr = message.payload || text;

    // Handle Workflow Node Payload continuation (WF_{workflowId}_NODE_{nodeId}_PAYLOAD_{extra})
    if (payloadStr?.startsWith('WF_')) {
      const match = payloadStr.match(/^WF_([a-zA-Z0-9-]+)_NODE_([a-zA-Z0-9_]+)_PAYLOAD_(.*)$/);
      if (match) {
        const [, workflowId, nodeId, userSelection] = match;
        const workflow = await this.workflowRepo.findOne({ where: { id: workflowId, tenant_id: tenant.id } });
        if (workflow && workflow.nodes) {
          const nextNode = workflow.nodes.find(n => n.id === nodeId);
          if (nextNode) {
            return this.executeWorkflowNode(tenant, workflow, nextNode, userSelection);
          }
        }
      }
    }

    return null; // Fallback to AI
  }

  /**
   * Executes a specific node in a Dynamic Workflow
   */
  private async executeWorkflowNode(tenant: TenantEntity, workflow: WorkflowEntity, node: any, userSelection?: string) {
    if (node.type === 'api_fetch' && node.endpoint) {
      let url = node.endpoint;
      if (userSelection) {
        url = url.replace('{{user_selection}}', encodeURIComponent(userSelection));
      }

      // Execute HTTP Fetch
      let rawData = await this.fetchExternalData(tenant, url, `wf_${workflow.id}_node_${node.id}_${userSelection || 'default'}`, node.headers);
      
      // Resolve data path if the API wraps it (e.g. data.tags or data.data)
      let data = rawData;
      if (node.dataPath && rawData) {
        data = node.dataPath.split('.').reduce((acc: any, part: string) => acc && acc[part], rawData);
      }

      // Format Message
      let replyMessage = node.message || '';
      const safeData = data || []; // fallback to empty if fetch fails
      
      // Basic {{data.field.subfield}} template replacement for object responses
      if (!Array.isArray(safeData) && typeof safeData === 'object') {
        replyMessage = replyMessage.replace(/{{data\.([^}]+)}}/g, (match: string, p1: string) => {
          // Resolve deep properties (e.g. name.en or name.ar-SA)
          const value = p1.split('.').reduce((acc: any, part: string) => acc && acc[part], safeData);
          return value !== undefined ? value : match;
        });
      }

      const response: any = { reply: replyMessage };

      // Formatting Interactive Elements
      if (node.displayType === 'list') {
        response.interactiveType = 'list';
        response.buttons = Array.isArray(safeData) ? safeData.slice(0, 10).map((item: any) => ({
          // Using title from nested objects like name.en or name.ar-SA if needed
          title: item.name?.en || item.name?.['ar-SA'] || item.name || item.title || 'Option',
          // Payload links to the NEXT node defined in the current node
          payload: node.onSelectNextNode 
            ? `WF_${workflow.id}_NODE_${node.onSelectNextNode}_PAYLOAD_${item.id}` 
            : `UNKNOWN`
        })) : [];
      } else if (node.displayType === 'button' && node.buttons) {
        response.interactiveType = 'button';
        response.buttons = node.buttons.map((btn: any) => ({
          title: btn.title,
          payload: btn.action || btn.payload
        }));
      }

      return response;
    }
    
    return { reply: node.message || "Action completed." };
  }

  private async fetchExternalData(tenant: TenantEntity, endpoint: string, cacheKey: string, customHeaders?: Record<string, string>) {
    try {
      const cachedData = await this.cacheManager.get(cacheKey);
      if (cachedData) return cachedData;

      const headers: Record<string, string> = { ...customHeaders };
      if (tenant.menuConfig?.apiKey && !headers['Authorization']) {
        headers['Authorization'] = `Bearer ${tenant.menuConfig.apiKey}`;
      }

      const isAbsoluteUrl = endpoint.startsWith('http://') || endpoint.startsWith('https://');
      const url = isAbsoluteUrl ? endpoint : `${tenant.menuConfig?.apiBaseUrl || 'http://localhost:3000'}${endpoint}`;

      const response = await firstValueFrom(
        this.httpService.get(url, { headers, timeout: 5000 })
      );
      
      const ttl = (tenant.menuConfig?.cacheTtlMinutes || 60) * 60 * 1000;
      await this.cacheManager.set(cacheKey, response.data, ttl);
      return response.data;
    } catch (error: any) {
      this.logger.error(`Failed to fetch dynamic data for tenant ${tenant.id} from ${endpoint}: ${error.message}`);
      return null;
    }
  }
}

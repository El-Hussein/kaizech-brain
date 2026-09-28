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
  userId?: string;
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
    const originalText = message.text?.trim();
    const text = originalText?.toLowerCase();
    
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
        
        if (message.userId) {
          this.cacheManager.del(`wf_state_${tenant.id}_${message.userId}`).catch(() => {});
        }
        
        // Execute the first node of the workflow
        return this.executeWorkflowNode(tenant, workflow, workflow.nodes[0], undefined, message.userId);
      }
    }

    // Ensure we handle both proper interactive payloads AND raw text fallbacks (e.g. from the dashboard playground)
    const payloadStr = message.payload || originalText;

    // Handle Workflow Node Payload continuation (WF_{workflowId}_NODE_{nodeId}_PAYLOAD_{extra})
    if (payloadStr?.startsWith('WF_')) {
      const match = payloadStr.match(/^WF_([a-zA-Z0-9-]+)_NODE_([a-zA-Z0-9_]+)_PAYLOAD_(.*)$/);
      
      if (!match) {
        this.logger.warn(`Malformed workflow payload received: ${payloadStr}`);
        return { reply: "Invalid selection payload format." };
      }

      const [, workflowId, nodeId, userSelection] = match;
      this.logger.log(`Executing Workflow: ${workflowId}, Node: ${nodeId}, Selection: ${userSelection}`);

      const workflow = await this.workflowRepo.findOne({ 
        where: { id: workflowId, tenant_id: tenant.id } 
      });

      if (!workflow) {
        this.logger.error(`Workflow ${workflowId} not found for tenant ${tenant.id}. Cannot process node ${nodeId}.`);
        return { reply: "This workflow session has expired or is invalid." };
      }

      if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
        this.logger.error(`Workflow ${workflowId} has malformed or missing nodes array.`);
        return { reply: "Workflow configuration is invalid." };
      }

      const nextNode = workflow.nodes.find(n => n.id === nodeId);
      
      if (!nextNode) {
        this.logger.error(`Node '${nodeId}' not found in workflow ${workflowId}. Available nodes: ${workflow.nodes.map(n => n.id).join(', ')}`);
        return { reply: "The requested step does not exist in this workflow." };
      }

      // If all checks pass, execute safely!
      return this.executeWorkflowNode(tenant, workflow, nextNode, userSelection, message.userId);
    }

    return null; // Fallback to AI
  }

  /**
   * Executes a specific node in a Dynamic Workflow
   */
  private async executeWorkflowNode(tenant: TenantEntity, workflow: WorkflowEntity, node: any, userSelection?: string, userId?: string) {
    let context: any = {};
    const stateKey = userId ? `wf_state_${tenant.id}_${userId}` : null;
    
    if (stateKey) {
      context = (await this.cacheManager.get(stateKey)) || {};
    }

    if (userSelection && node.storeAs) {
      context[node.storeAs] = userSelection;
      if (stateKey) {
        await this.cacheManager.set(stateKey, context, 3600000);
      }
    }

    const applyContext = (str: string) => {
      if (!str || typeof str !== 'string') return str;
      let res = str;
      if (userSelection) {
        res = res.replace(/{{user_selection}}/g, encodeURIComponent(userSelection));
      }
      res = res.replace(/{{context\.([^}]+)}}/g, (match, key) => {
        return context[key] !== undefined ? encodeURIComponent(context[key]) : match;
      });
      return res;
    };

    if (node.type === 'api_fetch' && node.endpoint) {
      let url = applyContext(node.endpoint);

      const headers = { ...node.headers };
      if (node.headers) {
        for (const [k, v] of Object.entries(node.headers)) {
          if (typeof v === 'string') {
            headers[k] = applyContext(v);
          }
        }
      }

      // Execute HTTP Fetch
      let rawData = await this.fetchExternalData(tenant, url, `wf_${workflow.id}_node_${node.id}_${userSelection || 'default'}`, headers);
      
      // Resolve data path if the API wraps it (e.g. data.tags or data.data)
      let data = rawData;
      if (node.dataPath && rawData) {
        data = node.dataPath.split('.').reduce((acc: any, part: string) => acc && acc[part], rawData);
      }

      // Format Message
      let replyMessage = node.message || '';
      const safeData = data || []; // fallback to empty if fetch fails
      
      const evaluateCondition = (value: any) => {
        if (value === null || value === undefined || value === '' || value === 0 || value === '0' || value === false) return false;
        if (Array.isArray(value) && value.length === 0) return false;
        return true;
      };

      const processConditionals = (text: string) => {
        if (!text || typeof text !== 'string') return text;
        return text.replace(/{{#if\s+data\.([^}]+)}}(.*?){{\/if}}/gs, (match: string, p1: string, content: string) => {
          const value = p1.split('.').reduce((acc: any, part: string) => acc && acc[part], safeData);
          return evaluateCondition(value) ? content : '';
        });
      };

      const replacePlaceholders = (text: string) => {
        if (!text || typeof text !== 'string') return text;
        return text.replace(/{{data\.([^}]+)}}/g, (match: string, p1: string) => {
          // Resolve deep properties (e.g. name.en or name.ar-SA)
          const value = p1.split('.').reduce((acc: any, part: string) => acc && acc[part], safeData);
          // Return empty string if falsy, instead of leaving the raw placeholder
          if (!evaluateCondition(value)) return '';
          return value !== undefined ? value : match;
        });
      };

      // Basic {{data.field.subfield}} template replacement for object responses
      if (!Array.isArray(safeData) && typeof safeData === 'object') {
        replyMessage = processConditionals(replyMessage);
        replyMessage = replacePlaceholders(replyMessage);
      }

      const response: any = { reply: replyMessage };

      // Formatting Interactive Elements
      if (node.displayType === 'list') {
        response.interactiveType = 'list';
        response.buttons = Array.isArray(safeData) ? safeData.slice(0, 10).map((item: any) => {
          let resolvedTitle = item.title || 'Option';
          if (item.name) {
            if (typeof item.name === 'string') resolvedTitle = item.name;
            else resolvedTitle = item.name.en || item.name['ar-SA'] || item.name.ar || item.name.fr || resolvedTitle;
          }
          const payloadValue = node.payloadField ? item[node.payloadField] : item.id;
          return {
            title: resolvedTitle,
            payload: node.onSelectNextNode 
              ? `WF_${workflow.id}_NODE_${node.onSelectNextNode}_PAYLOAD_${payloadValue}` 
              : `UNKNOWN`
          };
        }) : [];
      } else if (node.displayType === 'button' && node.buttons) {
        response.interactiveType = 'button';
        response.buttons = node.buttons.map((btn: any) => ({
          title: replacePlaceholders(btn.title),
          payload: replacePlaceholders(btn.action || btn.payload),
          url: replacePlaceholders(btn.url),
          type: btn.type || (btn.url ? 'web_url' : 'reply')
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

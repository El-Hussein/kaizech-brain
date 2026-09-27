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

    // Handle Workflow Node Payload continuation (WF_{workflowId}_NODE_{nodeId}_PAYLOAD_{extra})
    if (message.payload?.startsWith('WF_')) {
      const parts = message.payload.split('_');
      // Format: WF_123_NODE_node_2_products_PAYLOAD_user-selection
      // Actually, payload splitting might be tricky if the node ID contains underscores.
      // Let's use a regex or known structure.
      const match = message.payload.match(/^WF_([a-zA-Z0-9-]+)_NODE_([a-zA-Z0-9_]+)_PAYLOAD_(.*)$/);
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

    // ==========================================
    // 2. Legacy Hardcoded Menu (Backwards Compatibility)
    // ==========================================
    const config = tenant.menuConfig;
    if (!config?.isMenuEnabled || !config?.apiBaseUrl) {
      return null; // Bypass to AI
    }
    
    if (text === 'menu' || text === 'start' || message.payload === 'MENU_START') {
      return this.getCategories(tenant);
    }
    if (message.payload?.startsWith('CAT_')) {
      const categoryId = message.payload.replace('CAT_', '');
      return this.getProducts(tenant, categoryId);
    }
    if (message.payload?.startsWith('PROD_')) {
      const productId = message.payload.replace('PROD_', '');
      return this.getProductDetails(tenant, productId);
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
      const data = await this.fetchExternalData(tenant, url, `wf_${workflow.id}_node_${node.id}_${userSelection || 'default'}`);
      
      if (!data || (Array.isArray(data) && data.length === 0)) {
        return { reply: "No data found for this selection." };
      }

      // Format Message
      let replyMessage = node.message || '';
      
      // Basic {{data.field}} template replacement for object responses
      if (!Array.isArray(data) && typeof data === 'object') {
        replyMessage = replyMessage.replace(/{{data\.([^}]+)}}/g, (match: string, p1: string) => {
          return data[p1] !== undefined ? data[p1] : match;
        });
      }

      const response: any = { reply: replyMessage };

      // Formatting Interactive Elements
      if (node.displayType === 'list' && Array.isArray(data)) {
        response.interactiveType = 'list';
        response.buttons = data.slice(0, 10).map((item: any) => ({
          title: item.name || item.title || 'Option',
          // Payload links to the NEXT node defined in the current node
          payload: node.onSelectNextNode 
            ? `WF_${workflow.id}_NODE_${node.onSelectNextNode}_PAYLOAD_${item.id}` 
            : `UNKNOWN`
        }));
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

  // ... (Legacy hardcoded fetching methods below) ...
  private async getCategories(tenant: TenantEntity) {
    const categories = await this.fetchExternalData(tenant, '/categories', `categories_${tenant.id}`);
    if (!categories || categories.length === 0) return { reply: "Our catalog is currently being updated." };
    return {
      reply: tenant.menuConfig.welcomeMessage || "Please choose a category:",
      interactiveType: 'list',
      buttons: categories.slice(0, 10).map((cat: any) => ({ title: cat.name, payload: `CAT_${cat.id}` }))
    };
  }

  private async getProducts(tenant: TenantEntity, categoryId: string) {
    const products = await this.fetchExternalData(tenant, `/products?categoryId=${categoryId}`, `products_${tenant.id}_${categoryId}`);
    if (!products || products.length === 0) return { reply: "No products found." };
    return {
      reply: "Here are the top products:",
      interactiveType: 'list',
      buttons: products.slice(0, 10).map((prod: any) => ({ title: prod.name, payload: `PROD_${prod.id}` }))
    };
  }

  private async getProductDetails(tenant: TenantEntity, productId: string) {
    const product = await this.fetchExternalData(tenant, `/products/${productId}`, `product_${tenant.id}_${productId}`);
    if (!product) return { reply: "Product details not found." };
    return {
      reply: `*${product.name}*\nPrice: $${product.price}\n\n${product.description}`,
      imageUrl: product.imageUrl || null,
      interactiveType: 'button',
      buttons: [{ title: 'Talk to Agent to Buy', payload: 'TALK_TO_AGENT' }]
    };
  }

  private async fetchExternalData(tenant: TenantEntity, endpoint: string, cacheKey: string) {
    try {
      const cachedData = await this.cacheManager.get(cacheKey);
      if (cachedData) return cachedData;

      const headers: Record<string, string> = {};
      if (tenant.menuConfig?.apiKey) headers['Authorization'] = `Bearer ${tenant.menuConfig.apiKey}`;

      const response = await firstValueFrom(
        this.httpService.get(`${tenant.menuConfig?.apiBaseUrl || 'http://localhost:3000'}${endpoint}`, {
          headers, timeout: 3000
        })
      );
      
      const ttl = (tenant.menuConfig?.cacheTtlMinutes || 60) * 60 * 1000;
      await this.cacheManager.set(cacheKey, response.data, ttl);
      return response.data;
    } catch (error: any) {
      this.logger.error(`Failed to fetch dynamic data for tenant ${tenant.id}: ${error.message}`);
      return null;
    }
  }
}

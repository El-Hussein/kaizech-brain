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

  /**
   * Evaluates the incoming message to see if it matches the decision tree flow.
   * Returns a response payload if handled, or NULL if the AI should handle it.
   */
  public async handleMessage(tenant: TenantEntity, message: WebhookIncomingMessage): Promise<any> {
    const config = tenant.menuConfig;
    if (!config?.isMenuEnabled || !config?.apiBaseUrl) {
      return null; // Bypass to AI
    }
    
    const text = message.text?.toLowerCase().trim();
    
    // 1. Handle "Start Menu"
    if (text === 'menu' || text === 'start' || message.payload === 'MENU_START') {
      return this.getCategories(tenant);
    }

    // 2. Handle Category Select
    if (message.payload?.startsWith('CAT_')) {
      const categoryId = message.payload.replace('CAT_', '');
      return this.getProducts(tenant, categoryId);
    }

    // 3. Handle Product Select
    if (message.payload?.startsWith('PROD_')) {
      const productId = message.payload.replace('PROD_', '');
      return this.getProductDetails(tenant, productId);
    }
    
    return null; // Fallback to AI
  }

  private async getCategories(tenant: TenantEntity) {
    const categories = await this.fetchExternalData(tenant, '/categories', `categories_${tenant.id}`);
    
    if (!categories || categories.length === 0) {
      return { reply: "Our catalog is currently being updated. Please check back later." };
    }

    return {
      reply: tenant.menuConfig.welcomeMessage || "Please choose a category:",
      interactiveType: 'list',
      buttons: categories.slice(0, 10).map((cat: any) => ({ // Paginated to top 10 for WhatsApp limits
        title: cat.name,
        payload: `CAT_${cat.id}`
      }))
    };
  }

  private async getProducts(tenant: TenantEntity, categoryId: string) {
    const products = await this.fetchExternalData(tenant, `/products?categoryId=${categoryId}`, `products_${tenant.id}_${categoryId}`);
    
    if (!products || products.length === 0) {
      return { reply: "No products found in this category right now." };
    }

    return {
      reply: "Here are the top products in this category:",
      interactiveType: 'list',
      buttons: products.slice(0, 10).map((prod: any) => ({
        title: prod.name,
        payload: `PROD_${prod.id}`
      }))
    };
  }

  private async getProductDetails(tenant: TenantEntity, productId: string) {
    const product = await this.fetchExternalData(tenant, `/products/${productId}`, `product_${tenant.id}_${productId}`);
    
    if (!product) {
      return { reply: "Product details not found." };
    }

    // Returning a structured response that the channel layer can format into an image card
    return {
      reply: `*${product.name}*\nPrice: $${product.price}\n\n${product.description}`,
      imageUrl: product.imageUrl || null,
      interactiveType: 'button',
      buttons: [
        { title: 'Talk to Agent to Buy', payload: 'TALK_TO_AGENT' } // Actionable Next Step
      ]
    };
  }

  private async fetchExternalData(tenant: TenantEntity, endpoint: string, cacheKey: string) {
    try {
      // 1. Check Cache
      const cachedData = await this.cacheManager.get(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      // 2. Fetch with Strict Timeouts and Auth
      const headers: Record<string, string> = {};
      if (tenant.menuConfig.apiKey) {
        headers['Authorization'] = `Bearer ${tenant.menuConfig.apiKey}`; // Assuming Bearer token for now
      }

      const response = await firstValueFrom(
        this.httpService.get(`${tenant.menuConfig.apiBaseUrl}${endpoint}`, {
          headers,
          timeout: 3000, // Strict 3 second timeout to prevent hanging the bot
        })
      );

      const data = response.data;

      // 3. Set Cache (Convert minutes to milliseconds, fallback to 1 hour)
      const ttl = (tenant.menuConfig.cacheTtlMinutes || 60) * 60 * 1000;
      await this.cacheManager.set(cacheKey, data, ttl);

      return data;
    } catch (error: any) {
      this.logger.error(`Failed to fetch dynamic menu data for tenant ${tenant.id}: ${error.message}`);
      return null; // Gracefully fail
    }
  }
}

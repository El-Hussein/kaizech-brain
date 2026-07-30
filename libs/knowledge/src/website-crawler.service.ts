import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';

@Injectable()
export class WebsiteCrawlerService {
  private readonly logger = new Logger(WebsiteCrawlerService.name);

  async crawlUrl(url: string): Promise<{ title: string; content: string; url: string }> {
    try {
      this.logger.log(`Crawling URL: ${url}`);
      const response = await axios.get(url, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (KaizechBrain Knowledge Crawler)',
        },
      });

      const $ = cheerio.load(response.data);

      // Remove script, style, nav, footer, header tags
      $('script, style, nav, footer, header, noscript, iframe, svg').remove();

      const title = $('title').text().trim() || url;
      const bodyText = $('body')
        .text()
        .replace(/\s+/g, ' ')
        .trim();

      return {
        title,
        content: `Document Title: ${title}\nURL: ${url}\n\nContent:\n${bodyText}`,
        url,
      };
    } catch (error: any) {
      this.logger.error(`Website crawl error for ${url}: ${error.message}`);
      throw new BadRequestException(`Failed to crawl website '${url}': ${error.message}`);
    }
  }
}

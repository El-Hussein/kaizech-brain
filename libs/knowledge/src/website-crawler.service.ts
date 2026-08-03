import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';

@Injectable()
export class WebsiteCrawlerService {
  private readonly logger = new Logger(WebsiteCrawlerService.name);

  async crawlUrl(url: string): Promise<{ title: string; content: string; url: string }> {
    this.logger.log(`Crawling URL: ${url}`);

    // Try Puppeteer (Headless Browser) for SPA / JS rendering first
    try {
      const result = await this.crawlWithPuppeteer(url);
      if (result && result.content && result.content.trim().length > 50) {
        this.logger.log(`Successfully crawled SPA content for ${url} via Puppeteer (${result.content.length} chars)`);
        return result;
      }
    } catch (puppeteerErr: any) {
      this.logger.warn(`Puppeteer crawl failed for ${url}: ${puppeteerErr.message}. Falling back to Axios HTTP fetch.`);
    }

    // Fallback to Axios static fetch if Puppeteer is unavailable or fails
    return this.crawlWithAxios(url);
  }

  private async crawlWithPuppeteer(url: string): Promise<{ title: string; content: string; url: string }> {
    let puppeteer: any;
    try {
      puppeteer = require('puppeteer');
    } catch (importErr: any) {
      throw new Error(`Puppeteer module not found in runtime environment (${importErr.message}).`);
    }

    let browser;
    try {
      const launchOptions: any = {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
        ],
      };

      if (process.env.PUPPETEER_EXECUTABLE_PATH) {
        launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
      }

      browser = await puppeteer.launch(launchOptions);

      const page = await browser.newPage();
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      );

      // Navigate and wait for network requests to settle (SPA hydration)
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      // Wait 1.5 seconds for dynamic DOM rendering
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Clean up navigation, headers, and popups FIRST, then safely expand collapsed details/accordions
      const pageData = await page.evaluate(() => {
        const title = document.title || '';

        // 1. Remove non-content, navigation headers/footers, and modal popups/dialogs immediately
        document
          .querySelectorAll(
            'script, style, nav, footer, header, noscript, iframe, svg, canvas, [role="dialog"], .modal, .popup, [aria-modal="true"]',
          )
          .forEach((el) => el.remove());

        // 2. Safely open <details> tags
        document.querySelectorAll('details').forEach((el) => el.setAttribute('open', 'true'));

        // 3. Click ONLY collapsed accordion triggers (never navbar or login buttons)
        document.querySelectorAll('summary, [aria-expanded="false"], [data-state="closed"]').forEach((el) => {
          try {
            (el as HTMLElement).click();
          } catch (e) {}
        });

        // Extract full innerText of body (includes p, pre, strong, a, h1-h6, span, div, li, etc.)
        const bodyText = document.body ? document.body.innerText : '';

        return { title, bodyText };
      });

      const title = pageData.title || url;
      const formattedText = pageData.bodyText
        .replace(/[ \t]+/g, ' ')
        .replace(/\n\s*\n+/g, '\n\n')
        .trim();

      const content = `Document Title: ${title}\nURL: ${url}\n\nContent:\n${formattedText}`;

      return {
        title,
        content,
        url,
      };
    } finally {
      if (browser) {
        await browser.close().catch(() => {});
      }
    }
  }

  private async crawlWithAxios(url: string): Promise<{ title: string; content: string; url: string }> {
    try {
      const response = await axios.get(url, {
        timeout: 15000,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });

      const $ = cheerio.load(response.data);
      const title = $('title').text().trim() || url;
      const cleanedContent = this.cleanAndExtractText(response.data, url, title);

      return {
        title,
        content: cleanedContent,
        url,
      };
    } catch (error: any) {
      this.logger.error(`Axios crawl error for ${url}: ${error.message}`);
      throw new BadRequestException(`Failed to crawl website '${url}': ${error.message}`);
    }
  }

  private cleanAndExtractText(html: string, url: string, title: string): string {
    const $ = cheerio.load(html);

    // Remove script, style, nav, footer, header, noscript, iframe, svg
    $('script, style, nav, footer, header, noscript, iframe, svg').remove();

    // Add newlines before every HTML tag that contains text
    $('p, pre, strong, a, b, i, em, span, div, h1, h2, h3, h4, h5, h6, li, dt, dd, br, tr, article, section, button, label, summary, details').before('\n');

    const bodyText = $('body')
      .text()
      .replace(/[ \t]+/g, ' ')
      .replace(/\n\s*\n+/g, '\n\n')
      .trim();

    return `Document Title: ${title || url}\nURL: ${url}\n\nContent:\n${bodyText}`;
  }
}

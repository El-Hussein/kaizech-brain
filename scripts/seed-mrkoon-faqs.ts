import { NestFactory } from '@nestjs/core';
import { AppModule } from '../apps/api/src/app.module';
import { KnowledgeManagerService } from '@kaizech/knowledge';
import { KnowledgeSourceType, TenantStatus } from '@kaizech/shared';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TenantEntity } from '@kaizech/database';
import * as fs from 'fs';
import * as path from 'path';

function cleanHtml(html: string): string {
  if (!html) return '';
  let text = html;

  // Convert links to text with URL
  text = text.replace(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi, (match, href, content) => {
    const cleanContent = content.replace(/<[^>]+>/g, '').trim();
    if (
      !cleanContent ||
      cleanContent === 'here' ||
      cleanContent === 'هنا' ||
      cleanContent === 'من هنا' ||
      cleanContent === 'من هنـا'
    ) {
      return ` ${href} `;
    }
    return ` ${cleanContent} (${href}) `;
  });

  // Replace list items
  text = text.replace(/<li[^>]*>/gi, '\n• ');
  text = text.replace(/<\/li>/gi, '');

  // Replace paragraph & line breaks
  text = text.replace(/<\/p>/gi, '\n');
  text = text.replace(/<br\s*\/?>/gi, '\n');

  // Strip remaining HTML tags
  text = text.replace(/<[^>]+>/g, '');

  // Decode entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // Clean lines
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n');
}

async function bootstrap() {
  console.log('🚀 Starting Mrkoon FAQ seeding process...');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  try {
    const tenantRepo = app.get(getRepositoryToken(TenantEntity));
    const knowledgeManager = app.get(KnowledgeManagerService);

    // 1. Get or Create Tenant 'mrkoon-auctions'
    let tenant = await tenantRepo.findOne({ where: { slug: 'mrkoon-auctions' } });
    if (!tenant) {
      console.log('📦 Creating Tenant: Mrkoon Auctions (mrkoon-auctions)...');
      tenant = await tenantRepo.save(
        tenantRepo.create({
          name: 'Mrkoon Auctions',
          slug: 'mrkoon-auctions',
          status: TenantStatus.ACTIVE,
          languages: ['ar', 'en', 'fr'],
          timezone: 'Africa/Cairo',
          greetingMessage: 'مرحباً بك في مركون! كيف يمكننا مساعدتك اليوم؟ / Welcome to Mrkoon!',
        }),
      );
    }
    console.log(`✅ Using Tenant ID: ${tenant.id} (${tenant.name})`);

    // 2. Read FAQ JSON Data
    const rawDataPath = path.resolve(__dirname, '../data/seed-mrkoon-faqs.json');
    const jsonContent = JSON.parse(fs.readFileSync(rawDataPath, 'utf-8'));
    const faqItems = jsonContent.data.data;

    console.log(`📋 Found ${faqItems.length} FAQ raw questions.`);

    const formattedFaqs: Array<{ question: string; answer: string; category?: string }> = [];

    for (const item of faqItems) {
      const q = item.question;
      const exp = item.explanation;

      // English
      if (q.en && exp.en) {
        const cleanAnswer = cleanHtml(exp.en);
        if (cleanAnswer) {
          formattedFaqs.push({
            question: q.en.trim(),
            answer: cleanAnswer,
            category: 'English FAQ',
          });
        }
      }

      // Egyptian Arabic
      if (q['ar-EG'] && exp['ar-EG']) {
        const cleanAnswer = cleanHtml(exp['ar-EG']);
        if (cleanAnswer) {
          formattedFaqs.push({
            question: q['ar-EG'].trim(),
            answer: cleanAnswer,
            category: 'Egyptian Arabic FAQ',
          });
        }
      }

      // Saudi Arabic
      if (q['ar-SA'] && exp['ar-SA']) {
        const cleanAnswer = cleanHtml(exp['ar-SA']);
        if (cleanAnswer) {
          formattedFaqs.push({
            question: q['ar-SA'].trim(),
            answer: cleanAnswer,
            category: 'Saudi Arabic FAQ',
          });
        }
      }

      // Standard Arabic (if present and distinct)
      if (q['ar'] && exp['ar']) {
        const cleanAnswer = cleanHtml(exp['ar']);
        if (cleanAnswer) {
          formattedFaqs.push({
            question: q['ar'].trim(),
            answer: cleanAnswer,
            category: 'Standard Arabic FAQ',
          });
        }
      }

      // French
      if (q.fr && exp.fr) {
        const cleanAnswer = cleanHtml(exp.fr);
        if (cleanAnswer) {
          formattedFaqs.push({
            question: q.fr.trim(),
            answer: cleanAnswer,
            category: 'French FAQ',
          });
        }
      }
    }

    console.log(`🧩 Prepared ${formattedFaqs.length} total Q&A pairs across languages.`);

    // 3. Process & Upload Knowledge Source into RAG
    const source = await knowledgeManager.processDocumentUpload(
      tenant.id,
      'Mrkoon Platform FAQ',
      KnowledgeSourceType.FAQ,
      undefined,
      undefined,
      undefined,
      formattedFaqs,
    );

    console.log(`✨ Successfully seeded FAQ Knowledge source!`);
    console.log(`ID: ${source.id}`);
    console.log(`Status: ${source.status}`);
    console.log(`Chunk count: ${source.chunkCount}`);
  } catch (err: any) {
    console.error(`❌ Seeding failed: ${err.message}`, err.stack);
  } finally {
    await app.close();
  }
}

bootstrap();

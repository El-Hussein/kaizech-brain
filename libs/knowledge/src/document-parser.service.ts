import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { extractBytes } from '@kreuzberg/node';

@Injectable()
export class DocumentParserService {
  private readonly logger = new Logger(DocumentParserService.name);

  async parseFileToMarkdown(buffer: Buffer, mimeType: string): Promise<string> {
    try {
      const result = await extractBytes(buffer, mimeType);
      return result.content;
    } catch (error: any) {
      this.logger.error(`Document parse error: ${error.message}`);
      throw new BadRequestException(`Failed to parse document: ${error.message}`);
    }
  }

  parseMarkdown(buffer: Buffer): string {
    try {
      const content = buffer.toString('utf-8');
      // Strip YAML frontmatter if present (between --- and --- at the start of file)
      const cleanContent = content.replace(/^---[\s\S]*?---\n?/, '');
      return cleanContent.trim();
    } catch (error: any) {
      this.logger.error(`Markdown parse error: ${error.message}`);
      throw new BadRequestException(`Failed to parse Markdown document: ${error.message}`);
    }
  }

  parseFaqs(faqData: Array<{ question: string; answer: string; category?: string }>): string {
    const validFaqs = faqData.filter(
      (faq) => (faq.question && faq.question.trim()) || (faq.answer && faq.answer.trim()),
    );

    return validFaqs
      .map(
        (faq, idx) =>
          `FAQ #${idx + 1}:\nQuestion: ${faq.question?.trim() || ''}\nAnswer: ${faq.answer?.trim() || ''}${
            faq.category?.trim() ? `\nCategory: ${faq.category.trim()}` : ''
          }`,
      )
      .join('\n\n---\n\n');
  }

  chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
    if (!text || text.trim().length === 0) return [];

    const cleanedText = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n');
    const chunks: string[] = [];
    let startIndex = 0;

    while (startIndex < cleanedText.length) {
      let endIndex = Math.min(startIndex + chunkSize, cleanedText.length);

      // Avoid splitting words in half if possible
      if (endIndex < cleanedText.length) {
        const lastSpace = cleanedText.lastIndexOf(' ', endIndex);
        if (lastSpace > startIndex + Math.floor(chunkSize / 2)) {
          endIndex = lastSpace;
        }
      }

      const chunk = cleanedText.substring(startIndex, endIndex).trim();
      if (chunk.length > 0) {
        chunks.push(chunk);
      }

      startIndex += chunkSize - overlap;
    }

    return chunks;
  }
}

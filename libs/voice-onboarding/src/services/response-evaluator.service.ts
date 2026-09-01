import { Injectable, Logger } from '@nestjs/common';
import { AIProviderFactory } from '@kaizech/agent';
import { EVALUATION_PROMPT } from '../constants/evaluation.prompt';

@Injectable()
export class ResponseEvaluatorService {
  private readonly logger = new Logger(ResponseEvaluatorService.name);
  constructor(private readonly providerFactory: AIProviderFactory) {}

  async evaluateAnswer(questionText: string, answerText: string, suggestedPoints: string[] = []): Promise<any> {
    try {
      const prompt = EVALUATION_PROMPT
        .replace('{question}', questionText)
        .replace('{suggestedPoints}', suggestedPoints.join('\\n- '))
        .replace('{answer}', answerText);

      const aiProvider = this.providerFactory.getProvider('openai');
      const response = await aiProvider.chatCompletion({
        messages: [{ role: 'user', content: prompt }],
        model: 'gpt-4o',
      });

      const responseContent = response.content || '{}';
      
      let cleanJson = responseContent;
      const jsonMatch = responseContent.match(/\`\`\`(?:json)?([\s\S]*?)\`\`\`/);
      if (jsonMatch) {
        cleanJson = jsonMatch[1].trim();
      }

      return JSON.parse(cleanJson);
    } catch (error) {
      this.logger.error('Failed to evaluate answer', error);
      return {
        completenessScore: 50,
        keyInfoExtracted: [],
        missingInfo: [],
        followUpQuestion: null,
        feedback: 'Thank you for your response.',
      };
    }
  }
}

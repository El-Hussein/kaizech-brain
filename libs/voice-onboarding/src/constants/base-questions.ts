export interface BaseQuestion {
  id: string;
  category: string;
  stage: number;
  questionText: string;
  whyWeNeedIt: string;
  suggestedPoints: string[];
}

export const INTERVIEW_STAGES = [
  { stage: 1, name: 'Identity & Offerings', estimatedMinutes: 1 },
  { stage: 2, name: 'Policies & Support', estimatedMinutes: 2 },
  { stage: 3, name: 'Tone & Common Questions', estimatedMinutes: 1 },
];

export const BASE_QUESTIONS: BaseQuestion[] = [
  // Stage 1: Identity & Offerings
  {
    id: 'identity',
    category: 'identity',
    stage: 1,
    questionText: 'What is your business name and what exactly do you do?',
    whyWeNeedIt: 'This is the foundation — your AI agent needs to know who it represents and what services or products to talk about.',
    suggestedPoints: ['Official business name', 'Industry or niche', 'What makes you different from competitors', 'Target audience'],
  },
  {
    id: 'products',
    category: 'products',
    stage: 1,
    questionText: 'Describe your main products or services and their pricing.',
    whyWeNeedIt: 'Customers will ask about pricing and features constantly. Without this, the AI will either make up prices or say "I don\'t know."',
    suggestedPoints: ['Product or service names', 'Price ranges or exact prices', 'Key features and benefits', 'Any bundles or packages'],
  },
  // Stage 2: Policies & Support
  {
    id: 'policies',
    category: 'policies',
    stage: 2,
    questionText: 'What are your return, refund, exchange, and warranty policies?',
    whyWeNeedIt: 'Policy questions are the #1 reason customers contact support. Clear policies let the AI resolve issues instantly.',
    suggestedPoints: ['Return window (e.g., 30 days)', 'Conditions for returns', 'Refund method (original payment, store credit, etc.)', 'Non-returnable items', 'Warranty details'],
  },
  {
    id: 'shipping',
    category: 'operations',
    stage: 2,
    questionText: 'How does shipping or delivery work? Include timeframes, costs, and payment methods.',
    whyWeNeedIt: 'Delivery and payment drive 70% of pre-purchase support chats. Getting this right reduces ticket volume dramatically.',
    suggestedPoints: ['Shipping tiers and costs', 'Delivery timeframes', 'Payment methods accepted (card, cash, digital wallets)', 'Order tracking'],
  },
  {
    id: 'escalation',
    category: 'support',
    stage: 2,
    questionText: 'When should the AI transfer a customer to your team? What is your support contact info and working hours?',
    whyWeNeedIt: 'The AI needs to know when to hand off to a human and where to send customers for help.',
    suggestedPoints: ['When to escalate (complaints, complex issues, refund requests)', 'Support channels (WhatsApp, email, phone)', 'Working hours and timezone', 'Emergency contact for urgent issues'],
  },
  {
    id: 'guardrails',
    category: 'safety',
    stage: 2,
    questionText: 'What should the AI NEVER promise or discuss? (e.g., unauthorized discounts, competitor comparisons)',
    whyWeNeedIt: 'This prevents the AI from making promises your team cannot keep or discussing topics that could hurt your business.',
    suggestedPoints: ['Unauthorized discounts or offers', 'Topics to avoid (competitors, legal advice)', 'Price guarantees or delivery promises the team cannot fulfill', 'Sensitive business information'],
  },
  // Stage 3: Tone & Common Questions
  {
    id: 'tone',
    category: 'tone',
    stage: 3,
    questionText: 'How should the AI speak to your customers? Formal? Casual? Which language or dialect?',
    whyWeNeedIt: 'The AI will match your brand voice. Without guidance, it defaults to generic corporate tone.',
    suggestedPoints: ['Formality level (professional, friendly, casual)', 'Language preferences (Arabic dialect, English, bilingual)', 'Use of emojis or informal expressions', 'How to address customers (first name, formal titles)'],
  },
  {
    id: 'faq',
    category: 'faq',
    stage: 3,
    questionText: 'What are the top 3-5 questions your customers ask you every single day?',
    whyWeNeedIt: 'These are the exact questions your AI will answer most often. Getting them right is critical for day-one performance.',
    suggestedPoints: ['List each common question', 'Include the ideal answer for each', 'Mention any seasonal or trending questions', 'Questions that currently take the most support time'],
  },
];

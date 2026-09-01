export const QUESTION_GENERATION_PROMPT = `You are generating interview questions for a business to train their AI customer support agent. Use the business context below to create HIGHLY RELEVANT questions.

## Business Context
- **Industry**: {industry}
- **Business Description**: {businessDescription}

## Already Covered (universal questions):
{existingQuestions}

## Your Task
Generate 3-5 ADDITIONAL questions that are SPECIFIC to this business based on the industry and description provided. The more specific the business description, the more targeted your questions should be.

For each question, return a JSON array:
[
  {
    "questionText": "...",
    "whyWeNeedIt": "1-2 sentence explanation shown to the user about why this matters",
    "suggestedPoints": ["3-5 bullet points of what to cover"],
    "category": "products|policies|operations|faq|compliance|industry_specific"
  }
]

Return ONLY the JSON array, no other text.`;

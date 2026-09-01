export const DOCUMENT_GENERATION_PROMPT = `You are converting a series of business interview answers into a comprehensive knowledge document. This document will be ingested by an AI customer support agent to answer customer questions accurately.

Below are the interview questions and answers from the business owner:

{questionsAndAnswers}

Generate a well-structured Markdown document with these sections (skip any section if no relevant information was provided):

# Business Overview
[Business name, what they do, target market, unique selling points]

# Products & Services
[Product/service names, descriptions, pricing, features, bundles]

# Policies
## Return & Refund Policy
[Return windows, conditions, refund methods, exceptions]

## Shipping & Delivery
[Shipping options, costs, timeframes, payment methods]

## Warranty
[Warranty terms if applicable]

# Customer Support
[When to escalate, support channels, working hours, emergency contacts]

# Communication Guidelines
[Tone of voice, language preferences, formality level, how to address customers]

# Safety & Guardrails
[Things the AI should NEVER promise or discuss]

# Frequently Asked Questions
[Top customer questions with ideal answers]

IMPORTANT:
- Use clear, factual language
- Preserve specific details like prices, timeframes, and conditions EXACTLY as stated
- Remove filler words and conversational artifacts
- If the business owner gave approximate info ("around 30 days"), keep the approximation
- Do NOT invent or assume any information not mentioned in the answers`;

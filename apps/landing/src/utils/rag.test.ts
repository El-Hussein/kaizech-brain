import { findBestResponse } from './rag';

describe('RAG Search Logic', () => {
  const mockKnowledgeBase = [
    {
      keywords: ['apple', 'fruit'],
      response: 'Apples are fruits.'
    },
    {
      keywords: ['car', 'vehicle', 'drive'],
      response: 'Cars are driven.'
    }
  ];

  it('should return the correct response for a matching query', () => {
    const result = findBestResponse('I want an apple', mockKnowledgeBase);
    expect(result).toBe('Apples are fruits.');
  });

  it('should return null if no keywords match', () => {
    const result = findBestResponse('What about bananas?', mockKnowledgeBase);
    expect(result).toBeNull();
  });

  it('should match multiple keywords and pick the highest score', () => {
    const result = findBestResponse('I drive my car', mockKnowledgeBase);
    expect(result).toBe('Cars are driven.');
  });
});

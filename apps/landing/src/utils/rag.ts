type KnowledgeItem = {
  keywords: string[];
  response: string;
};

export function findBestResponse(query: string, knowledgeBase: KnowledgeItem[]): string | null {
  const normalizedQuery = query.toLowerCase();
  
  let bestMatch = null;
  let maxScore = 0;

  for (const item of knowledgeBase) {
    const score = item.keywords.reduce((acc: number, keyword: string) => {
      return acc + (normalizedQuery.includes(keyword.toLowerCase()) ? 1 : 0);
    }, 0);
    
    if (score > maxScore) {
      maxScore = score;
      bestMatch = item;
    }
  }

  return bestMatch ? bestMatch.response : null;
}

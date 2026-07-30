export interface ChatMessage {
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: string;
    name?: string;
    toolCallId?: string;
    toolCalls?: ToolCall[];
}
export interface ToolCall {
    id: string;
    type: 'function';
    function: {
        name: string;
        arguments: string;
    };
}
export interface ToolDefinition {
    type: 'function';
    function: {
        name: string;
        description: string;
        parameters: Record<string, any>;
    };
}
export interface ChatCompletionOptions {
    model?: string;
    messages: ChatMessage[];
    tools?: ToolDefinition[];
    temperature?: number;
    maxTokens?: number;
    topP?: number;
}
export interface ChatCompletionResult {
    content: string | null;
    toolCalls: ToolCall[];
    usage: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    finishReason: string;
    model: string;
}
export interface ILLMProvider {
    readonly providerName: string;
    chatCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResult>;
    generateEmbedding(text: string, model?: string): Promise<number[]>;
    generateEmbeddings(texts: string[], model?: string): Promise<number[][]>;
}

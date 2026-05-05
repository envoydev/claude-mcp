import Anthropic from '@anthropic-ai/sdk';
import type { ChatParams } from '../types/claude.types';

export class Claude {
  private client: Anthropic;
  public model: string;

  constructor(model: string) {
    this.client = new Anthropic();
    this.model = model;
  }

  public addUserMessage(
    messages: Anthropic.MessageParam[],
    message: Anthropic.Message | Anthropic.MessageParam['content'],
  ): void {
    const content = this.extractContent(message);
    messages.push({ role: 'user', content });
  }

  public addAssistantMessage(
    messages: Anthropic.MessageParam[],
    message: Anthropic.Message | Anthropic.MessageParam['content'],
  ): void {
    const content = this.extractContent(message);
    messages.push({ role: 'assistant', content });
  }

  public textFromMessage(message: Anthropic.Message): string {
    return message.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('\n');
  }

  public chat({
    messages,
    system,
    stopSequences = [],
    tools,
    thinking = false,
    thinkingBudget = 1024,
  }: ChatParams): Promise<Anthropic.Message> {
    const params: Anthropic.MessageCreateParamsNonStreaming = {
      model: this.model,
      max_tokens: 8000,
      messages,
      stop_sequences: stopSequences,
    };
    if (thinking) {
      params.thinking = { type: 'enabled', budget_tokens: thinkingBudget };
    }
    if (tools?.length) {
      params.tools = tools;
    }
    if (system) {
      params.system = system;
    }
    return this.client.messages.create(params);
  }

  private extractContent(message: Anthropic.Message | Anthropic.MessageParam['content']): Anthropic.MessageParam['content'] {
    if (message !== null && typeof message === 'object' && !Array.isArray(message) && 'content' in message && 'id' in message) {
      return (message as Anthropic.Message).content;
    }
    return message as Anthropic.MessageParam['content'];
  }
}

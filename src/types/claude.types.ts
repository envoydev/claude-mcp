import Anthropic from '@anthropic-ai/sdk';

export interface ChatParams {
  messages: Anthropic.MessageParam[];
  system?: string;
  stopSequences?: string[];
  tools?: Anthropic.Tool[];
  thinking?: boolean;
  thinkingBudget?: number;
}

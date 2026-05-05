import Anthropic from '@anthropic-ai/sdk';
import type {PromptMessage} from '@modelcontextprotocol/sdk/types.js';

export function convertPromptMessagesToMessageParams(promptMessages: PromptMessage[]): Anthropic.MessageParam[] {
  return promptMessages.map(convertPromptMessageToMessageParam);
}

function convertPromptMessageToMessageParam(msg: PromptMessage): Anthropic.MessageParam {
  const role = msg.role === 'user' ? 'user' : 'assistant';
  const content = msg.content;
  if (content !== null && typeof content === 'object' && !Array.isArray(content)) {
    const typed = content as { type?: string; text?: string };
    if (typed.type === 'text') {
      return {role, content: typed.text ?? ''};
    }
  }
  if (Array.isArray(content)) {
    const textBlocks = content
      .filter((item): item is { type: 'text'; text: string } => (item as any).type === 'text')
      .map((item) => ({type: 'text' as const, text: item.text}));
    if (textBlocks.length > 0) {
      return {role, content: textBlocks};
    }
  }
  return {role, content: ''};
}

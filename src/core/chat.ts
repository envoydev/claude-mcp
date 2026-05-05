import type Anthropic from '@anthropic-ai/sdk';
import type { Claude } from './claude';
import type { MCPClient } from '../mcp-client';
import { ToolManager } from './tools';

export class Chat {
  protected claudeService: Claude;
  protected clients: Record<string, MCPClient>;
  protected messages: Anthropic.MessageParam[] = [];

  constructor(claudeService: Claude, clients: Record<string, MCPClient>) {
    this.claudeService = claudeService;
    this.clients = clients;
  }

  public async run(query: string): Promise<string> {
    let finalTextResponse = '';

    await this.processQuery(query);

    while (true) {
      const response = await this.claudeService.chat({
        messages: this.messages,
        tools: await ToolManager.getAllTools(this.clients),
      });

      this.claudeService.addAssistantMessage(this.messages, response);

      if (response.stop_reason === 'tool_use') {
        console.log(this.claudeService.textFromMessage(response));
        const toolResultParts = await ToolManager.executeToolRequests(
          this.clients,
          response,
        );
        this.claudeService.addUserMessage(this.messages, toolResultParts);
      } else {
        finalTextResponse = this.claudeService.textFromMessage(response);
        break;
      }
    }

    return finalTextResponse;
  }

  protected async processQuery(query: string): Promise<void> {
    this.messages.push({ role: 'user', content: query });
  }
}

import type Anthropic from '@anthropic-ai/sdk';
import type {CallToolResult, TextContent,} from '@modelcontextprotocol/sdk/types.js';
import type {MCPClient} from '../mcp-client';

export class ToolManager {
  public static async getAllTools(clients: Record<string, MCPClient>): Promise<Anthropic.Tool[]> {
    const tools: Anthropic.Tool[] = [];
    for (const client of Object.values(clients)) {
      const toolModels = await client.listTools();
      for (const t of toolModels) {
        tools.push({
          name: t.name,
          description: t.description ?? '',
          input_schema: t.inputSchema as Anthropic.Tool.InputSchema,
        });
      }
    }
    return tools;
  }

  private static async findClientWithTool(clients: MCPClient[], toolName: string): Promise<MCPClient | null> {
    for (const client of clients) {
      const tools = await client.listTools();
      if (tools.some((t) => t.name === toolName)) {
        return client;
      }
    }
    return null;
  }

  private static buildToolResultPart(toolUseId: string, text: string, status: 'success' | 'error'): Anthropic.ToolResultBlockParam {
    return {
      tool_use_id: toolUseId,
      type: 'tool_result',
      content: text,
      is_error: status === 'error',
    };
  }

  static async executeToolRequests(clients: Record<string, MCPClient>, message: Anthropic.Message): Promise<Anthropic.ToolResultBlockParam[]> {
    const toolRequests = message.content.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
    );

    const results: Anthropic.ToolResultBlockParam[] = [];

    for (const toolRequest of toolRequests) {
      const {id: toolUseId, name: toolName, input: toolInput} = toolRequest;

      const client = await this.findClientWithTool(
        Object.values(clients),
        toolName,
      );

      if (!client) {
        results.push(
          this.buildToolResultPart(
            toolUseId,
            'Could not find that tool',
            'error',
          ),
        );
        continue;
      }

      let toolOutput: CallToolResult | null = null;
      try {
        toolOutput = await client.callTool(
          toolName,
          toolInput as Record<string, unknown>,
        );
        const items = toolOutput?.content ?? [];
        const textItems = items
          .filter((item): item is TextContent => item.type === 'text')
          .map((item) => item.text);

        results.push(
          this.buildToolResultPart(
            toolUseId,
            JSON.stringify(textItems),
            toolOutput?.isError ? 'error' : 'success',
          ),
        );
      } catch (e) {
        const errorMessage = `Error executing tool '${toolName}': ${e}`;
        console.error(errorMessage);
        results.push(
          this.buildToolResultPart(
            toolUseId,
            JSON.stringify({error: errorMessage}),
            'error',
          ),
        );
      }
    }

    return results;
  }
}

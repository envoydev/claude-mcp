import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
import type {
  CallToolResult,
  Prompt,
  PromptMessage,
  TextResourceContents,
  Tool
} from '@modelcontextprotocol/sdk/types.js';

export class MCPClient {
  private client: Client;
  private transport: StdioClientTransport | null = null;

  constructor(
    private command: string,
    private args: string[],
    private env?: Record<string, string>,
  ) {
    this.client = new Client(
      {name: 'mcp-client', version: '1.0.0'},
      {capabilities: {}},
    );
  }

  public async connect(): Promise<void> {
    this.transport = new StdioClientTransport({
      command: this.command,
      args: this.args,
      env: this.env,
    });
    await this.client.connect(this.transport);
  }

  public async listTools(): Promise<Tool[]> {
    const result = await this.client.listTools();
    return result.tools;
  }

  public async callTool(toolName: string, toolInput: Record<string, unknown>): Promise<CallToolResult | null> {
    const result = await this.client.callTool({name: toolName, arguments: toolInput});
    return result as CallToolResult;
  }

  public async listPrompts(): Promise<Prompt[]> {
    const result = await this.client.listPrompts();
    return result.prompts;
  }

  public async getPrompt(promptName: string, args: Record<string, string>): Promise<PromptMessage[]> {
    const result = await this.client.getPrompt({name: promptName, arguments: args});
    return result.messages;
  }

  public async readResource(uri: string): Promise<unknown> {
    const result = await this.client.readResource({uri});
    const resource = result.contents[0] as TextResourceContents;
    if (resource.mimeType === 'application/json') {
      return JSON.parse(resource.text);
    }
    return resource.text;
  }

  public async cleanup(): Promise<void> {
    await this.transport?.close();
  }
}

// For testing
async function main(): Promise<void> {
  const client = new MCPClient('./node_modules/.bin/tsx', ['src/mcp-server.ts']);
  try {
    await client.connect();
    const result = await client.listTools();
    console.log(result);
  } finally {
    await client.cleanup();
  }
}

if (process.argv[1]?.endsWith('mcp-client.ts')) {
  main().catch(console.error);
}

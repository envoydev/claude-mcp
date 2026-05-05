import type { MCPClient } from '../mcp-client';
import type { Claude } from '../core/claude';

export interface CliChatOptions {
  docClient: MCPClient;
  clients: Record<string, MCPClient>;
  claudeService: Claude;
}

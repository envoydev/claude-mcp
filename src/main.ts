import 'dotenv/config';
import {MCPClient} from './mcp-client';
import {Claude} from './core/claude';
import {CliChat} from './core/cli-chat';
import {CliApp} from './core/cli';

const claudeModel = process.env.CLAUDE_MODEL ?? '';
const anthropicApiKey = process.env.ANTHROPIC_API_KEY ?? '';

if (!claudeModel) {
  throw new Error('Error: CLAUDE_MODEL cannot be empty. Update .env');
}
if (!anthropicApiKey) {
  throw new Error('Error: ANTHROPIC_API_KEY cannot be empty. Update .env');
}

async function main(): Promise<void> {
  const claudeService = new Claude(claudeModel);

  const serverScripts = process.argv.slice(2);
  const clients: Record<string, MCPClient> = {};

  const command = './node_modules/.bin/tsx';

  const docClient = new MCPClient(command, ['src/mcp-server.ts']);
  await docClient.connect();
  clients['doc-client'] = docClient;

  for (let i = 0; i < serverScripts.length; i++) {
    const serverScript = serverScripts[i]!;
    const clientId = `client_${i}_${serverScript}`;
    const client = new MCPClient(command, [serverScript]);
    await client.connect();
    clients[clientId] = client;
  }

  try {
    const chat = new CliChat({docClient, clients, claudeService});
    const cli = new CliApp(chat);
    await cli.initialize();
    await cli.run();
  } finally {
    await Promise.all(Object.values(clients).map((c) => c.cleanup()));
  }
}

main().catch(console.error);

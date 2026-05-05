# claude-mcp

An interactive CLI chat application that integrates Claude AI with the Model Context Protocol (MCP). Query documents, format them with AI assistance, and interact with Claude through a rich terminal interface.

## Features

- **Interactive CLI Chat** - Real-time conversation with Claude in your terminal
- **Document Management** - Read, list, and edit documents through MCP resources
- **Live Autocomplete** - Type `@` to see document suggestions with keyboard navigation
- **Document Embedding** - Automatically include referenced documents in your queries
- **AI-Powered Formatting** - Use the `/format` command to reformat documents in Markdown
- **Tool Integration** - Execute MCP tools directly through the chat interface
- **Prompt System** - Run predefined prompts from the MCP server

## Prerequisites

- Node.js 24.11+ 
- npm or yarn
- Anthropic API key (set via `ANTHROPIC_API_KEY` environment variable)

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd claude-mcp
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with your configuration:
   ```bash
   cp .env.example .env
   # Edit .env and add your credentials:
   # ANTHROPIC_API_KEY=your-api-key-here
   # CLAUDE_MODEL=claude-3-5-sonnet-20241022
   ```

## Configuration

Create a `.env` file in the project root:

```env
# Required: Your Anthropic API key
ANTHROPIC_API_KEY=sk-ant-xxxxx

# Required: Claude model to use
CLAUDE_MODEL=claude-3-5-sonnet-20241022
```

## Usage

### Start the Application

```bash
npm start
```

This launches the interactive CLI. The app connects to both Claude and the MCP document server.

### Interactive Commands

#### Query with Documents

Simply type a question. The CLI will automatically detect document references:

```
> What is mentioned in the @report.pdf about the tower?
```

- **`@` autocomplete**: Type `@` followed by partial document name and press arrow keys to select

#### Available Tools

The following tools are available for Claude to use:

- **`read_doc_contents`** - Read the full contents of a document
- **`edit_document`** - Replace text in a document

#### Example Interactions

```
# Ask about a document
> Summarize @deposition.md

# Format a document as Markdown
> /format plan.md

# Ask multiple questions
> What's the budget in @financials.docx and the timeline in @plan.md?
```

### Advanced Usage

#### Run the MCP Server Inspector

To browse available tools, resources, and prompts interactively:

```bash
npm run inspect
```

Opens an interactive web UI at `http://localhost:5173` where you can:
- List all available tools
- View resource endpoints
- Test prompts with arguments
- Inspect request/response payloads

#### Debug Mode

Start the app with the debugger attached:

```bash
npm run debug
```

Then connect your IDE or Chrome DevTools to `localhost:9229`.

#### Build for Production

```bash
npm run build       # Build to dist/
npm run start:build # Run the built version
```

## Architecture

### Components

- **`mcp-server.ts`** - MCP server providing documents, tools, and prompts
- **`mcp-client.ts`** - Client wrapper around the MCP SDK
- **`cli-chat.ts`** - Chat logic with document extraction and command processing
- **`cli.ts`** - Interactive terminal UI with raw mode input and live dropdown
- **`claude.ts`** - Anthropic SDK wrapper with caching and tool support
- **`tools.ts`** - Tool execution dispatcher across multiple MCP clients

### Data Flow

```
User Input (Terminal)
    ↓
CliApp (raw mode input, @-dropdown)
    ↓
CliChat (extract @documents, execute /commands)
    ↓
Chat (message history, tool loop)
    ↓
Claude (Anthropic SDK)
    ↓
MCP Server (tools, resources, prompts)
```

## Document Structure

Documents are stored in `mcp-server.ts`:

```typescript
const docs: Record<string, string> = {
  'deposition.md': '...',
  'report.pdf': '...',
  'financials.docx': '...',
  // Add more documents here
};
```

### Available Resources

- **`docs://documents`** - JSON array of all document IDs
- **`docs://documents/{docId}`** - Content of a specific document

### Available Prompts

- **`format`** - Reformat a document to Markdown syntax
  - Arguments: `docId` (string)

## Project Scripts

| Script | Purpose |
|--------|---------|
| `npm start` | Run the CLI app |
| `npm run start:mcp-client` | Test the MCP client directly |
| `npm run debug` | Run with Node debugger attached |
| `npm run build` | Build to ESM for production |
| `npm run start:build` | Run the built version |
| `npm run inspect` | Open MCP inspector UI |
| `npm run format` | Format code with Prettier |

## Troubleshooting

### "Cannot find module 'tsx'"

When running from WebStorm debugger, `tsx` isn't in PATH. The app automatically uses `./node_modules/.bin/tsx` as a fallback.

### MCP Server Connection Fails

Ensure `src/mcp-server.ts` exists and the path in `main.ts` is correct: `['src/mcp-server.ts']`

### API Key Errors

- Check `.env` file exists in project root
- Verify `ANTHROPIC_API_KEY` is set correctly (no extra whitespace)
- Ensure `CLAUDE_MODEL` is specified

## License

MIT

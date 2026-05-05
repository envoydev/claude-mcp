import type {Prompt, PromptMessage} from '@modelcontextprotocol/sdk/types.js';
import {Chat} from './chat';
import type {MCPClient} from '../mcp-client';
import type {CliChatOptions} from '../types/cli-chat.types';
import {convertPromptMessagesToMessageParams} from './helpers';

export class CliChat extends Chat {
  private docClient: MCPClient;

  constructor({docClient, clients, claudeService}: CliChatOptions) {
    super(claudeService, clients);
    this.docClient = docClient;
  }

  public async listPrompts(): Promise<Prompt[]> {
    return this.docClient.listPrompts();
  }

  public async listDocIds(): Promise<string[]> {
    return (await this.docClient.readResource('docs://documents')) as Promise<string[]>;
  }

  public async getDocContent(docId: string): Promise<string> {
    return (await this.docClient.readResource(`docs://documents/${docId}`)) as Promise<string>;
  }

  public async getPrompt(command: string, docId: string,): Promise<PromptMessage[]> {
    return this.docClient.getPrompt(command, {docId});
  }

  protected override async processQuery(query: string): Promise<void> {
    if (await this.processCommand(query)) {
      return;
    }

    const addedResources = await this.extractResources(query);

    const prompt = `
    The user has a question:
    <query>
    ${query}
    </query>

    The following context may be useful in answering their question:
    <context>
    ${addedResources}
    </context>

    Note the user's query might contain references to documents like "@report.docx". The "@" is only
    included as a way of mentioning the doc. The actual name of the document would be "report.docx".
    If the document content is included in this prompt, you don't need to use an additional tool to read the document.
    Answer the user's question directly and concisely. Start with the exact information they need. 
    Don't refer to or mention the provided context in any way - just use it to inform your answer.
    `;

    this.messages.push({role: 'user', content: prompt});
  }

  private async extractResources(query: string): Promise<string> {
    const mentions = query
      .split(' ')
      .filter((word) => word.startsWith('@'))
      .map((word) => word.slice(1));
    const docIds = await this.listDocIds();
    const mentionedDocs: Array<[string, string]> = [];
    for (const docId of docIds) {
      if (mentions.includes(docId)) {
        const content = await this.getDocContent(docId);
        mentionedDocs.push([docId, content]);
      }
    }
    return mentionedDocs
      .map(
        ([docId, content]) =>
          `\n<document id="${docId}">\n${content}\n</document>\n`,
      )
      .join('');
  }

  private async processCommand(query: string): Promise<boolean> {
    if (!query.startsWith('/')) {
      return false;
    }
    const words = query.split(' ');
    const command = words[0].slice(1);
    const docId = words[1] ?? '';
    const messages = await this.docClient.getPrompt(command, {docId});
    this.messages.push(...convertPromptMessagesToMessageParams(messages));
    return true;
  }
}

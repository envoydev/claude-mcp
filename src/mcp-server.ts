import {McpServer, ResourceTemplate} from '@modelcontextprotocol/sdk/server/mcp.js';
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import {z} from 'zod';

const server = new McpServer({
  name: 'DocumentMCP',
  version: '1.0.0',
});

const docs: Record<string, string> = {
  'deposition.md': 'This deposition covers the testimony of Angela Smith, P.E.',
  'report.pdf': 'The report details the state of a 20m condenser tower.',
  'financials.docx': 'These financials outline the project\'s budget and expenditures.',
  'outlook.pdf': 'This document presents the projected future performance of the system.',
  'plan.md': 'The plan outlines the steps for the project\'s implementation.',
  'spec.txt': 'These specifications define the technical requirements for the equipment.'
};

server.registerTool(
  'read_doc_contents',
  {
    description: 'Read the contents of a document and return it as a string.',
    inputSchema: {
      docId: z.string().describe('Id of the document to read'),
    },
  },
  ({docId}) => {
    if (!(docId in docs)) {
      throw new Error(`Doc with id ${docId} not found`);
    }
    return {content: [{type: 'text', text: docs[docId]!}]};
  },
);

server.registerTool(
  'edit_document',
  {
    description:
      'Edit a document by replacing string in the documents content with a new string.',
    inputSchema: {
      docId: z.string().describe('Id of the document that will be edited'),
      oldText: z
        .string()
        .describe(
          'The text to replace. Must match exactly, including whitespace',
        ),
      newText: z
        .string()
        .describe('The new text to insert in place of the old text'),
    },
  },
  ({docId, oldText, newText}) => {
    if (!(docId in docs)) {
      throw new Error(`Doc with id ${docId} not found`);
    }
    docs[docId] = docs[docId]!.replace(oldText, newText);
    return {content: []};
  },
);

server.registerResource(
  'list_documents',
  'docs://documents',
  {mimeType: 'application/json'},
  () => ({
    contents: [{uri: 'docs://documents', mimeType: 'application/json', text: JSON.stringify(Object.keys(docs))}],
  }),
);

server.registerResource(
  'read_document',
  new ResourceTemplate('docs://documents/{docId}', {list: undefined}),
  {mimeType: 'text/plain',},
  (uri, {docId}) => {
    const id = Array.isArray(docId) ? docId[0]! : docId as string;
    if (!(id in docs)) {
      throw new Error(`Doc with id ${id} not found`);
    }
    return {contents: [{uri: uri.href, mimeType: 'text/plain', text: docs[id]!}]};
  },
);

server.registerPrompt(
  'format',
  {
    description: 'Rewrites the contents of the document in Markdown format.',
    argsSchema: {
      docId: z.string().describe('Id of the document to format')
    }
  },
  ({docId}) => ({
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: `
            Your goal is to reformat a document to be written with markdown syntax.

            The id of the document you need to reformat is:
            <document-id>
            ${docId}
            </document-id>
            
            Add in headers, bullet points, tables, etc as necessary. Feel free to add in extra formatting.
            Use the 'edit_document' tool to edit the document. After the document has been edited, confirm the changes were made successfully.
          `
        }
      }
    ]
  })
);

const transport = new StdioServerTransport();
await server.connect(transport);

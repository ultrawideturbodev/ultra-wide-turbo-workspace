import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { ListToolsResponse, ToolInfo } from './responses/ListToolsResponse.js';
import { GhostApiResponse, GhostErrorResponse } from './responses/GhostResponse.js';
import { GhostService } from './services/ghost.service.js';

const server = new McpServer({
  name: 'ghost-mcp',
  version: '0.0.1'
});

// Keep track of registered tools with descriptions
const registeredTools: ToolInfo[] = [];

// List all available tools
server.tool(
  'list_tools',
  {},
  async () => {
    const response: ListToolsResponse = {
      tools: registeredTools,
      count: registeredTools.length,
      server: {
        name: 'ghost-mcp',
        version: '0.0.1'
      }
    };

    return {
      content: [{ 
        type: 'text', 
        text: JSON.stringify(response, null, 2)
      }]
    };
  }
);

// Register the list_tools tool info
registeredTools.push({
  name: 'list_tools',
  description: 'Returns a JSON list of all available tools with their descriptions, parameters, and examples',
  parameters: [],
  examples: [
    {
      description: 'List all available tools',
      parameters: {},
      response: JSON.stringify({
        tools: [
          {
            name: 'list_tools',
            description: 'Returns a JSON list of all available tools...',
            // other fields would be included here
          }
        ],
        count: 1,
        server: {
          name: 'ghost-mcp',
          version: '0.0.1'
        }
      }, null, 2)
    }
  ],
  responseFormat: {
    type: 'json',
    description: 'Returns information about all available tools',
    schema: {
      type: 'object',
      properties: {
        tools: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              parameters: { type: 'array' },
              examples: { type: 'array' },
              responseFormat: { type: 'object' }
            }
          }
        },
        count: { type: 'number' },
        server: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            version: { type: 'string' }
          }
        }
      }
    }
  }
});

// Generic Ghost API GET request
server.tool(
  'ghost_get',
  {
    endpoint: z.string().describe('The Ghost API endpoint path (e.g., "posts", "posts/123", "tags")')
  },
  async (params) => {
    try {
      const ghostService = new GhostService();
      
      // Make the GET request
      const result = await ghostService.makeRequest({
        endpoint: params.endpoint,
        method: 'GET'
      });
      
      // Format success response
      const response: GhostApiResponse = {
        success: true,
        data: result
      };

      return {
        content: [{ 
          type: 'text', 
          text: JSON.stringify(response, null, 2) 
        }]
      };
    } catch (error) {
      const errorResponse: GhostErrorResponse = {
        success: false,
        error: 'Failed to execute Ghost GET request',
        details: (error as Error).message
      };

      return {
        isError: true,
        content: [{ 
          type: 'text', 
          text: JSON.stringify(errorResponse, null, 2) 
        }]
      };
    }
  }
);

// Register the ghost_get tool info
registeredTools.push({
  name: 'ghost_get',
  description: 'Makes a GET request to the Ghost Admin API with automatic authentication',
  parameters: [
    {
      name: 'endpoint',
      type: 'string',
      description: 'The Ghost API endpoint path (e.g., "posts", "posts/123", "tags")',
      required: true
    }
  ],
  examples: [
    {
      description: 'Get all posts',
      parameters: { endpoint: 'posts' },
      response: '{ "success": true, "data": { "posts": [...], "meta": {...} } }'
    },
    {
      description: 'Get a specific post by ID',
      parameters: { endpoint: 'posts/5f9c4d732be87a0001c2a123' },
      response: '{ "success": true, "data": { "posts": [...] } }'
    }
  ],
  responseFormat: {
    type: 'json',
    description: 'Returns data from the Ghost API with success status',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: { type: 'object' },
        error: { type: 'string' },
        details: { type: 'string' }
      }
    }
  }
});

// Generic Ghost API POST request
server.tool(
  'ghost_post',
  {
    endpoint: z.string().describe('The Ghost API endpoint path (e.g., "posts", "tags")'),
    data: z.record(z.any()).describe('The data to send in the POST request')
  },
  async (params) => {
    try {
      const ghostService = new GhostService();
      
      // Make the POST request
      const result = await ghostService.makeRequest({
        endpoint: params.endpoint,
        method: 'POST',
        data: params.data
      });
      
      // Format success response
      const response: GhostApiResponse = {
        success: true,
        data: result
      };

      return {
        content: [{ 
          type: 'text', 
          text: JSON.stringify(response, null, 2) 
        }]
      };
    } catch (error) {
      const errorResponse: GhostErrorResponse = {
        success: false,
        error: 'Failed to execute Ghost POST request',
        details: (error as Error).message
      };

      return {
        isError: true,
        content: [{ 
          type: 'text', 
          text: JSON.stringify(errorResponse, null, 2) 
        }]
      };
    }
  }
);

// Register the ghost_post tool info
registeredTools.push({
  name: 'ghost_post',
  description: 'Makes a POST request to the Ghost Admin API with automatic authentication',
  parameters: [
    {
      name: 'endpoint',
      type: 'string',
      description: 'The Ghost API endpoint path (e.g., "posts", "tags")',
      required: true
    },
    {
      name: 'data',
      type: 'object',
      description: 'The data to send in the POST request',
      required: true
    }
  ],
  examples: [
    {
      description: 'Create a new post',
      parameters: { 
        endpoint: 'posts', 
        data: { 
          posts: [{ 
            title: 'New Post', 
            status: 'draft' 
          }] 
        } 
      },
      response: '{ "success": true, "data": { "posts": [...], "meta": {...} } }'
    }
  ],
  responseFormat: {
    type: 'json',
    description: 'Returns data from the Ghost API with success status',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: { type: 'object' },
        error: { type: 'string' },
        details: { type: 'string' }
      }
    }
  }
});

// Generic Ghost API PUT request
server.tool(
  'ghost_put',
  {
    endpoint: z.string().describe('The Ghost API endpoint path (e.g., "posts/123", "tags/456")'),
    data: z.record(z.any()).describe('The data to send in the PUT request')
  },
  async (params) => {
    try {
      const ghostService = new GhostService();
      
      // Make the PUT request
      const result = await ghostService.makeRequest({
        endpoint: params.endpoint,
        method: 'PUT',
        data: params.data
      });
      
      // Format success response
      const response: GhostApiResponse = {
        success: true,
        data: result
      };

      return {
        content: [{ 
          type: 'text', 
          text: JSON.stringify(response, null, 2) 
        }]
      };
    } catch (error) {
      const errorResponse: GhostErrorResponse = {
        success: false,
        error: 'Failed to execute Ghost PUT request',
        details: (error as Error).message
      };

      return {
        isError: true,
        content: [{ 
          type: 'text', 
          text: JSON.stringify(errorResponse, null, 2) 
        }]
      };
    }
  }
);

// Register the ghost_put tool info
registeredTools.push({
  name: 'ghost_put',
  description: 'Makes a PUT request to the Ghost Admin API with automatic authentication',
  parameters: [
    {
      name: 'endpoint',
      type: 'string',
      description: 'The Ghost API endpoint path (e.g., "posts/123", "tags/456")',
      required: true
    },
    {
      name: 'data',
      type: 'object',
      description: 'The data to send in the PUT request',
      required: true
    }
  ],
  examples: [
    {
      description: 'Update an existing post',
      parameters: { 
        endpoint: 'posts/5f9c4d732be87a0001c2a123', 
        data: { 
          posts: [{ 
            title: 'Updated Post Title', 
            status: 'published' 
          }] 
        } 
      },
      response: '{ "success": true, "data": { "posts": [...], "meta": {...} } }'
    }
  ],
  responseFormat: {
    type: 'json',
    description: 'Returns data from the Ghost API with success status',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: { type: 'object' },
        error: { type: 'string' },
        details: { type: 'string' }
      }
    }
  }
});

// Generic Ghost API DELETE request
server.tool(
  'ghost_delete',
  {
    endpoint: z.string().describe('The Ghost API endpoint path (e.g., "posts/123", "tags/456")')
  },
  async (params) => {
    try {
      const ghostService = new GhostService();
      
      // Make the DELETE request
      const result = await ghostService.makeRequest({
        endpoint: params.endpoint,
        method: 'DELETE'
      });
      
      // Format success response
      const response: GhostApiResponse = {
        success: true,
        data: result
      };

      return {
        content: [{ 
          type: 'text', 
          text: JSON.stringify(response, null, 2) 
        }]
      };
    } catch (error) {
      const errorResponse: GhostErrorResponse = {
        success: false,
        error: 'Failed to execute Ghost DELETE request',
        details: (error as Error).message
      };

      return {
        isError: true,
        content: [{ 
          type: 'text', 
          text: JSON.stringify(errorResponse, null, 2) 
        }]
      };
    }
  }
);

// Register the ghost_delete tool info
registeredTools.push({
  name: 'ghost_delete',
  description: 'Makes a DELETE request to the Ghost Admin API with automatic authentication',
  parameters: [
    {
      name: 'endpoint',
      type: 'string',
      description: 'The Ghost API endpoint path (e.g., "posts/123", "tags/456")',
      required: true
    }
  ],
  examples: [
    {
      description: 'Delete a post',
      parameters: { endpoint: 'posts/5f9c4d732be87a0001c2a123' },
      response: '{ "success": true, "data": null }'
    }
  ],
  responseFormat: {
    type: 'json',
    description: 'Returns success status from the Ghost API',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: { type: 'object' },
        error: { type: 'string' },
        details: { type: 'string' }
      }
    }
  }
});

// Start the server with stdio transport
console.error('Starting ghost-mcp server...');
const transport = new StdioServerTransport();

process.on('SIGINT', () => {
  console.error('Shutting down ghost-mcp server...');
  process.exit(0);
});

server.connect(transport); 
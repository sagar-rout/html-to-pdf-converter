import fastify from 'fastify';
import { handler } from './index';
import type { HtmlToPdfRequest } from './types';

const server = fastify({ logger: true });
const port = Number(process.env.PORT) || 3000;

// Health check endpoint
server.get('/health', async (request, reply) => {
  return { status: 'OK', timestamp: new Date().toISOString() };
});

// PDF conversion endpoint
server.post<{ Body: HtmlToPdfRequest }>('/convert', async (request, reply) => {
  try {
    const { body, outputMode } = request.body;
    
    if (!body) {
      return reply.status(400).send({ 
        error: 'HTML body is required',
        statusCode: 400 
      });
    }

    const result = await handler({ body, outputMode });
    
    return reply.status(result.statusCode).send({
      statusCode: result.statusCode,
      body: result.body
    });
  } catch (error) {
    server.log.error(error);
    return reply.status(500).send({ 
      error: 'Internal server error',
      statusCode: 500 
    });
  }
});

// Start server
const start = async () => {
  try {
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`HTML to PDF converter server running on port ${port}`);
    console.log(`Health check: http://localhost:${port}/health`);
    console.log(`Convert endpoint: POST http://localhost:${port}/convert`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

// Export server for testing or external use
export { server };

// Start server if this file is run directly
if (require.main === module) {
  start();
}

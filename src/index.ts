import { PdfGenerator } from './pdf-generator';
import { OutputHandler } from './output-handler';
import type { HtmlToPdfRequest, HtmlToPdfResponse } from './types';

let pdfGenerator: PdfGenerator;
let outputHandler: OutputHandler;

// Main handler function - can be used with Lambda, Fastify, or other frameworks
export const handler = async (event: any): Promise<HtmlToPdfResponse> => {
  try {
    if (!pdfGenerator) {
      pdfGenerator = new PdfGenerator();
      await pdfGenerator.initialize();
    }

    if (!outputHandler) {
      outputHandler = new OutputHandler();
    }

    const requestBody = event as HtmlToPdfRequest;

    if (!requestBody.body) {
      return {
        statusCode: 400,
        body: 'HTML body is required'
      };
    }

    const outputMode = requestBody.outputMode || 'base64';
    const pdfBuffer = await pdfGenerator.generatePdf(requestBody);

    return await outputHandler.handleOutput(pdfBuffer, outputMode);

  } catch (error) {
    console.error('Error processing request:', error);

    return {
      statusCode: 500,
      body: error instanceof Error ? error.message : 'Internal server error'
    };
  }
}; 
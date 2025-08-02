import { HtmlToPdfResponse } from './types';

export class OutputHandler {
  async handleOutput(
    pdfBuffer: Buffer,
    outputMode: string
  ): Promise<HtmlToPdfResponse> {
    try {
      switch (outputMode) {
        case 'compress':
          return await this.handleCompressedOutput(pdfBuffer);
        case 'base64':
        default:
          return await this.handleBase64Output(pdfBuffer);
      }
    } catch (error) {
      return {
        statusCode: 500,
        body: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async handleBase64Output(pdfBuffer: Buffer): Promise<HtmlToPdfResponse> {
    const base64String = pdfBuffer.toString('base64');
    return {
      statusCode: 200,
      body: base64String
    };
  }

  private async handleCompressedOutput(pdfBuffer: Buffer): Promise<HtmlToPdfResponse> {
    const zlib = require('zlib');
    const compressedBuffer = zlib.gzipSync(pdfBuffer);
    const base64String = compressedBuffer.toString('base64');
    
    return {
      statusCode: 200,
      body: base64String
    };
  }
} 
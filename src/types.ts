export interface HtmlToPdfRequest {
  body: string;
  outputMode?: 'compress' | 'base64';
}

export interface HtmlToPdfResponse {
  statusCode: number;
  body: string;
} 
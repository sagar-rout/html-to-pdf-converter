# HTML to PDF Converter

Docker-based HTML to PDF converter using Playwright and Chromium. Supports both REST API and AWS Lambda deployment.

## Quick Start

```bash
# REST API Server
docker-compose up html-to-pdf

# Lambda Runtime Interface (for AWS Lambda testing)
docker-compose up html-to-pdf-lambda
```

## API Usage

### REST API (Port 3000)
- `GET /health` - Health check
- `POST /convert` - Convert HTML to PDF

### Lambda Interface (Port 9000)
- `POST /2015-03-31/functions/function/invocations` - Lambda invocation

### Request Format
```json
{
  "body": "<html><body><h1>Hello World!</h1></body></html>",
  "outputMode": "base64"
}
```

### Response Format
```json
{
  "statusCode": 200,
  "body": "base64-encoded-pdf-data"
}
```

## Test Requests

Use the provided `request.http` file with VS Code REST Client extension for testing.

## Deployment

- **REST API**: Use the default Docker service
- **AWS Lambda**: Deploy the built Docker image to AWS Lambda
- **Container Registry**: Images are automatically built and pushed to GitHub Container Registry on main branch changes

### Pre-built Images

```bash
# Pull the latest image
docker pull ghcr.io/sagar-rout/html-to-pdf-converter:latest

# Run REST API server
docker run -p 3000:3000 ghcr.io/sagar-rout/html-to-pdf-converter:latest server

# Run Lambda interface
docker run -p 9000:8080 ghcr.io/sagar-rout/html-to-pdf-converter:latest
```

Built with Node.js 22, TypeScript, Playwright, and Ubuntu 22.04.
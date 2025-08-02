# Ubuntu-based HTML to PDF converter
FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl ca-certificates \
    build-essential cmake python3 autotools-dev autoconf automake libtool \
    libnss3 libnspr4 libatk-bridge2.0-0 libdrm2 libxkbcommon0 \
    libxcomposite1 libxdamage1 libxrandr2 libgbm1 libxss1 libasound2 \
    libatspi2.0-0 libgtk-3-0 fonts-liberation fonts-dejavu-core fontconfig \
    && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install AWS Lambda RIC and TypeScript
RUN npm install -g aws-lambda-ric typescript

WORKDIR /var/task
COPY package*.json tsconfig.json ./

# Install dependencies and build
RUN npm ci && \
    npx playwright install chromium --with-deps && \
    npx playwright install-deps chromium

COPY src/ ./src/
RUN npm run build && npm prune --production

# Environment
ENV NODE_ENV=production
ENV PLAYWRIGHT_BROWSERS_PATH=/var/task/node_modules/playwright/.local-browsers
ENV _LAMBDA_SERVER_PORT=8080

# Startup script
RUN echo '#!/bin/bash\n\
if [ "$1" = "server" ]; then\n\
  exec node dist/server.js\n\
else\n\
  exec /usr/local/bin/aws-lambda-ric dist/index.handler\n\
fi' > /var/task/start.sh && chmod +x /var/task/start.sh

EXPOSE 3000 8080
ENTRYPOINT ["/var/task/start.sh"]

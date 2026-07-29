FROM node:22-alpine

WORKDIR /app

# Copy root configurations
COPY package.json package-lock.json ./

# Copy all packages and workspaces
COPY packages/ ./packages/
COPY apps/web/package.json ./apps/web/
COPY workers/api/package.json ./workers/api/

# Install dependencies using npm workspaces
RUN npm ci --include=dev

# Copy source code
COPY workers/api/ ./workers/api/

EXPOSE 3000

CMD ["npm", "run", "dev:api"]

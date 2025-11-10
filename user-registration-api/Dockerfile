# Production build for NestJS API
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci && npm cache clean --force
COPY tsconfig*.json ./
COPY src ./src
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Install production deps only
COPY --from=deps /app/node_modules ./node_modules
# Copy built dist
COPY --from=builder /app/dist ./dist
# Copy package.json for metadata
COPY package*.json ./
# Expose default port
EXPOSE 3000
CMD ["node", "dist/main.js"]

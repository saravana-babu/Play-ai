# Build Stage
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source and build frontend
COPY . .
RUN npm run build

# Final Stage
FROM node:22-alpine

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm install --production && npm install -g tsx

# Copy built assets and server code
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./
COPY --from=builder /app/package.json ./

# Expose port
EXPOSE 3000

# Set production environment
ENV NODE_ENV=production

# Start the server
CMD ["tsx", "server.ts"]

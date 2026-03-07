# Build Stage
FROM node:22-alpine AS builder

WORKDIR /usr/src/app

# Install all dependencies (including devDependencies for build)
COPY package*.json ./
RUN npm ci

# Copy source and build frontend
COPY . .
RUN npm run build

# Final Stage
FROM node:22-alpine

WORKDIR /usr/src/app

# Set production environment
ENV NODE_ENV=production

# Install production dependencies only
COPY package*.json ./
# We need tsx available to run the server.ts directly
RUN npm ci --omit=dev && npm install -g tsx

# Copy built assets and server code
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/server.ts ./
COPY --from=builder /usr/src/app/package.json ./

# Expose port
EXPOSE 3000

# Start the server using the recommended method or the global tsx
CMD ["tsx", "server.ts"]

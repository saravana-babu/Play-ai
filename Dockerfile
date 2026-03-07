# Build Stage
FROM node:22-bullseye-slim AS builder

WORKDIR /usr/src/app

# Install all dependencies (including devDependencies for build)
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# CRITICAL for 512MB RAM: Disable Sourcemaps and limit Node RAM
# Vite will crash without this on tiny droplets
ENV NODE_OPTIONS="--max-old-space-size=400"
ENV GENERATE_SOURCEMAP=false

RUN npm run build

# Final Stage
FROM node:22-bullseye-slim

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

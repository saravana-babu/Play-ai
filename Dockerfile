# PRE-BUILT Production Image (Best for 512MB RAM Droplets)
FROM node:22-bullseye-slim

WORKDIR /usr/src/app

# Set production environment
ENV NODE_ENV=production

# Install production dependencies only (Fast & low RAM)
COPY package*.json ./
RUN npm ci --omit=dev && npm install -g tsx

# Copy pre-built dist folder (Assumes you ran 'npm run build' locally)
COPY dist ./dist
COPY server.ts ./
COPY package.json ./

# Expose port
EXPOSE 3000

# Start the server
CMD ["tsx", "server.ts"]

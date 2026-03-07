#!/bin/bash

# Play-AI Deployment Script for DigitalOcean Droplets
# Optimized for 512MB RAM Droplets

echo "🚀 Starting Play-AI Deployment..."

# 1. Local Build Check
if [ ! -d "dist" ]; then
    echo "⚠️  'dist' folder NOT found!"
    echo "💡 On a 512MB RAM Droplet, building inside Docker will often crash (SIGKILL)."
    echo "✅ RECOMMENDED: Run 'npm run build' on your local computer first, then upload the 'dist' folder."
    
    read -p "Try to build anyway? (Not recommended on 512MB RAM) (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Deployment cancelled. Please upload 'dist' folder and retry."
        exit 1
    fi
fi

# 2. Check if .env exists, if not create it from example
if [ ! -f .env ]; then
    echo "📄 Creating .env file from .env.example..."
    cp .env.example .env
    
    # Generate a random JWT Secret
    RANDOM_JWT=$(openssl rand -base64 32 | tr -d /=+ | cut -c1-32)
    sed -i "s/your_super_secret_jwt_key_change_me/$RANDOM_JWT/g" .env
    
    echo "✅ .env created with a fresh JWT_SECRET."
    echo "⚠️  IMPORTANT: Please edit .env now to set your real DATABASE_URL."
    echo "   Command: nano .env"
fi

# 3. Build and Start Containers
# --no-cache is sometimes needed if switching build strategies
echo "🐳 Building and starting Docker containers..."
docker-compose up -d --build

# 4. Cleanup
echo "🧹 Cleaning up unused Docker images..."
docker image prune -f

echo "🎉 Deployment Complete!"
echo "📊 Run 'docker-compose logs -f' to see real-time logs."

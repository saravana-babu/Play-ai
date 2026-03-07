#!/bin/bash

# Play-AI Deployment Script for DigitalOcean Droplets
# This script automates the setup of environment variables and Docker containers.

echo "🚀 Starting Play-AI Deployment..."

# 1. Check if .env exists, if not create it from example
if [ ! -f .env ]; then
    echo "📄 Creating .env file from .env.example..."
    cp .env.example .env
    
    # Generate a random JWT Secret
    RANDOM_JWT=$(openssl rand -base64 32 | tr -d /=+ | cut -c1-32)
    sed -i "s/your_super_secret_jwt_key_change_me/$RANDOM_JWT/g" .env
    
    echo "✅ .env created with a fresh JWT_SECRET."
    echo "⚠️  IMPORTANT: Please edit .env now to set your real DATABASE_URL and DB_PASSWORD if needed."
    echo "   Command: nano .env"
    
    read -p "Do you want to edit the .env file now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        nano .env
    fi
else
    echo "✅ .env file already exists."
fi

# 2. Pull latest changes (optional if already cloned)
# git pull origin main

# 3. Build and Start Containers
echo "🐳 Building and starting Docker containers..."
docker-compose up -d --build

# 4. Cleanup
echo "🧹 Cleaning up unused Docker images..."
docker image prune -f

echo "🎉 Deployment Complete!"
echo "🌐 Your app is currently accessible at http://your_droplet_ip:3000"
echo "🛠️  Nginx Proxy Manager is running at http://your_droplet_ip:81"
echo "   (Initial login: admin@example.com / changeme)"
echo "📊 Run 'docker-compose logs -f' to see real-time logs."

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

# 3. Handle Firewall (UFW)
echo "🛡️  Configuring Firewall (UFW)..."
if command -v ufw > /dev/null; then
    sudo ufw allow 22/tcp
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    sudo ufw allow 3000/tcp # TEMPORARY: Allow 3000 until proxy is configured, then you can 'deny 3000'
    echo "y" | sudo ufw enable
fi

# 4. Build and Start Containers
echo "🐳 Restarting Docker containers..."
docker-compose down
docker-compose up -d --build

# 5. Cleanup
echo "🧹 Cleaning up unused Docker images..."
docker image prune -f

echo "🎉 Deployment Complete!"
echo "📍 Port 81 (Admin) is now RESTRICTED to localhost only."
echo "💡 To access the Admin UI, create an SSH tunnel from your PC:"
echo "   ssh -L 8181:localhost:81 root@your_droplet_ip"
echo "   Then open http://localhost:8181 in your browser."
echo "📊 Run 'docker-compose logs -f' to see real-time logs."

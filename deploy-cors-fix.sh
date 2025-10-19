#!/bin/bash

# CORS Fix Deployment Script for CapRover
# This script rebuilds and deploys the backend with CORS fixes

set -e  # Exit on error

echo "🚀 Starting CORS Fix Deployment..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the trizen-cms-backend directory."
    exit 1
fi

# Build the TypeScript code
echo "📦 Building TypeScript..."
npm run build
echo "✅ Build complete"
echo ""

# Create a deployment commit
echo "📝 Creating deployment commit..."
git add .
git commit -m "fix: Enhanced CORS configuration for production deployment" || echo "No changes to commit"
echo ""

# Deploy to CapRover
echo "🚢 Deploying to CapRover..."
echo ""
echo "Please ensure the following environment variables are set in CapRover:"
echo "  - ALLOWED_ORIGINS=https://academy.trizenventures.com,https://projects.trizenventures.com"
echo "  - NODE_ENV=production"
echo "  - MONGODB_URI=<your-mongodb-uri>"
echo "  - JWT_SECRET=<your-jwt-secret>"
echo ""
read -p "Press Enter to continue with deployment, or Ctrl+C to cancel..."

# Deploy using captain CLI or git push
if command -v caprover &> /dev/null; then
    echo "Deploying with CapRover CLI..."
    caprover deploy
else
    echo "CapRover CLI not found. Please deploy manually or install caprover CLI:"
    echo "npm install -g caprover"
    echo ""
    echo "Or push to your CapRover git remote:"
    echo "git push caprover master"
fi

echo ""
echo "✅ Deployment initiated!"
echo ""
echo "📋 Next steps:"
echo "1. Check CapRover logs for: '🔐 CORS Allowed Origins:'"
echo "2. Verify your allowed origins are listed"
echo "3. Test login from frontend"
echo "4. Check browser console and network tab"
echo ""
echo "📖 For detailed troubleshooting, see CORS_DEPLOYMENT_GUIDE.md"


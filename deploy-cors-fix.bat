@echo off
REM CORS Fix Deployment Script for CapRover (Windows)
REM This script rebuilds and deploys the backend with CORS fixes

echo.
echo 🚀 Starting CORS Fix Deployment...
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: package.json not found. Please run this script from the trizen-cms-backend directory.
    exit /b 1
)

REM Build the TypeScript code
echo 📦 Building TypeScript...
call npm run build
if %ERRORLEVEL% neq 0 (
    echo ❌ Build failed
    exit /b 1
)
echo ✅ Build complete
echo.

REM Create a deployment commit
echo 📝 Creating deployment commit...
git add .
git commit -m "fix: Enhanced CORS configuration for production deployment"
if %ERRORLEVEL% neq 0 (
    echo No changes to commit
)
echo.

REM Deploy to CapRover
echo 🚢 Deploying to CapRover...
echo.
echo Please ensure the following environment variables are set in CapRover:
echo   - ALLOWED_ORIGINS=https://academy.trizenventures.com,https://projects.trizenventures.com
echo   - NODE_ENV=production
echo   - MONGODB_URI=^<your-mongodb-uri^>
echo   - JWT_SECRET=^<your-jwt-secret^>
echo.
pause

REM Check if CapRover CLI is installed
where caprover >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo Deploying with CapRover CLI...
    call caprover deploy
) else (
    echo CapRover CLI not found. Please deploy manually or install caprover CLI:
    echo npm install -g caprover
    echo.
    echo Or push to your CapRover git remote:
    echo git push caprover master
)

echo.
echo ✅ Deployment initiated!
echo.
echo 📋 Next steps:
echo 1. Check CapRover logs for: '🔐 CORS Allowed Origins:'
echo 2. Verify your allowed origins are listed
echo 3. Test login from frontend
echo 4. Check browser console and network tab
echo.
echo 📖 For detailed troubleshooting, see CORS_DEPLOYMENT_GUIDE.md
echo.
pause

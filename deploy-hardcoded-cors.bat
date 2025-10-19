@echo off
REM Deploy with HARDCODED CORS (ignores env vars)

echo.
echo 🚀 Deploying with HARDCODED CORS Configuration
echo =============================================
echo.

echo 📦 Building TypeScript...
call npm run build
if %ERRORLEVEL% neq 0 (
    echo ❌ Build failed
    exit /b 1
)
echo ✅ Build complete
echo.

echo 📝 Creating deployment commit...
git add .
git commit -m "fix: HARDCODED CORS configuration - ignores env vars"
if %ERRORLEVEL% neq 0 (
    echo No changes to commit
)
echo.

echo 🚢 Deploying to CapRover...
echo.
echo This version has HARDCODED CORS origins:
echo   - https://academy.trizenventures.com
echo   - https://projects.trizenventures.com
echo   - https://fyrcmsfrontend.llp.trizenventures.com
echo   - https://fypcms.trizenventures.com
echo   - And others...
echo.
echo Environment variables are IGNORED for CORS.
echo.

where caprover >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo Deploying with CapRover CLI...
    call caprover deploy
) else (
    echo CapRover CLI not found. Please deploy manually:
    echo git push caprover master
    echo.
    echo Or use CapRover Dashboard to redeploy.
)

echo.
echo ✅ Deployment initiated!
echo.
echo 📋 After deployment, check logs for:
echo   🔐 CORS Allowed Origins (HARDCODED): [...]
echo   ✅ CORS: Allowing request from origin: https://academy.trizenventures.com
echo.
echo 🧪 Test CORS with:
echo   curl -X OPTIONS https://trizenfypcmsbackend.llp.trizenventures.com/api/v1/auth/login -H "Origin: https://academy.trizenventures.com" -v
echo.
echo 📖 Look for: Access-Control-Allow-Origin: https://academy.trizenventures.com
echo.
pause

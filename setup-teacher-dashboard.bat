@echo off
echo 🧠 BrainInk Teacher Dashboard Setup (Windows)
echo ============================================

:: Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python not found. Please install Python 3.8 or higher.
    pause
    exit /b 1
) else (
    echo ✅ Python found
)

:: Check if Node.js is available
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js not found. Please install Node.js 16 or higher.
    pause
    exit /b 1
) else (
    echo ✅ Node.js found
)

echo.
echo 🚀 Setting up Teacher Dashboard...

:: Setup backend
echo 📦 Setting up Python backend...
cd teacher-backend

:: Create virtual environment if it doesn't exist
if not exist "venv" (
    echo 🔧 Creating Python virtual environment...
    python -m venv venv
)

:: Activate virtual environment
echo 🔄 Activating virtual environment...
call venv\Scripts\activate.bat

:: Install Python dependencies
echo 📥 Installing Python dependencies...
pip install -r requirements.txt

:: Setup environment file
if not exist ".env" (
    echo ⚙️ Creating environment configuration...
    copy .env.example .env
    echo 📝 Please edit teacher-backend\.env with your configuration
) else (
    echo ✅ Environment file already exists
)

cd ..

:: Setup OCR service
echo 🔍 Setting up OCR service...
cd teacher-ocr-service

:: Create virtual environment for OCR service
if not exist "venv" (
    echo 🔧 Creating OCR service virtual environment...
    python -m venv venv
)

:: Activate virtual environment
echo 🔄 Activating OCR virtual environment...
call venv\Scripts\activate.bat

:: Install OCR dependencies
echo 📥 Installing OCR dependencies...
pip install -r requirements.txt

cd ..

:: Setup frontend dependencies
echo 🌐 Setting up frontend dependencies...
if not exist "node_modules" (
    echo 📥 Installing npm packages...
    npm install
) else (
    echo ✅ Node modules already installed
)

:: Create startup scripts for Windows
echo 📝 Creating Windows startup scripts...

:: Create start-backend.bat
echo @echo off > start-backend.bat
echo echo 🚀 Starting BrainInk Teacher Backend... >> start-backend.bat
echo. >> start-backend.bat
echo :: Start backend >> start-backend.bat
echo cd teacher-backend >> start-backend.bat
echo call venv\Scripts\activate.bat >> start-backend.bat
echo echo 🔄 Starting FastAPI backend on http://localhost:8000 >> start-backend.bat
echo start "BrainInk Backend" python main.py >> start-backend.bat
echo. >> start-backend.bat
echo :: Start OCR service >> start-backend.bat
echo cd ..\teacher-ocr-service >> start-backend.bat
echo call venv\Scripts\activate.bat >> start-backend.bat
echo echo 🔍 Starting OCR service on http://localhost:8001 >> start-backend.bat
echo start "BrainInk OCR" python main.py >> start-backend.bat
echo. >> start-backend.bat
echo echo ✅ Backend services started! >> start-backend.bat
echo echo 📊 Teacher API: http://localhost:8000 >> start-backend.bat
echo echo 🔍 OCR Service: http://localhost:8001 >> start-backend.bat
echo echo 📖 API Docs: http://localhost:8000/docs >> start-backend.bat
echo. >> start-backend.bat
echo pause >> start-backend.bat

:: Create start-frontend.bat
echo @echo off > start-frontend.bat
echo echo 🌐 Starting BrainInk Teacher Dashboard Frontend... >> start-frontend.bat
echo. >> start-frontend.bat
echo :: Start the frontend development server >> start-frontend.bat
echo npm run dev >> start-frontend.bat

:: Create start-all.bat
echo @echo off > start-all.bat
echo echo 🧠 Starting Complete BrainInk Teacher Dashboard System... >> start-all.bat
echo. >> start-all.bat
echo :: Start backend services >> start-all.bat
echo start "Backend Services" call start-backend.bat >> start-all.bat
echo. >> start-all.bat
echo :: Wait a moment for backend to start >> start-all.bat
echo timeout /t 5 /nobreak ^>nul >> start-all.bat
echo. >> start-all.bat
echo :: Start frontend >> start-all.bat
echo start "Frontend" call start-frontend.bat >> start-all.bat
echo. >> start-all.bat
echo echo ✅ All services started! >> start-all.bat
echo echo 🌐 Frontend: http://localhost:5173 >> start-all.bat
echo echo 🧠 Teacher Dashboard: http://localhost:5173/teacher-dashboard >> start-all.bat
echo echo 📊 Backend API: http://localhost:8000 >> start-all.bat
echo echo 📖 API Documentation: http://localhost:8000/docs >> start-all.bat
echo. >> start-all.bat
echo pause >> start-all.bat

echo.
echo ✅ Setup Complete!
echo ==================
echo.
echo 📁 Project Structure:
echo   teacher-backend\     - FastAPI backend with PostgreSQL
echo   teacher-ocr-service\ - OCR microservice with PaddleOCR
echo   src\services\        - Frontend API integration
echo.
echo 🚀 To start the system:
echo   start-all.bat        - Start everything (recommended)
echo   start-backend.bat    - Start only backend services
echo   start-frontend.bat   - Start only frontend
echo.
echo 🌐 Access URLs:
echo   http://localhost:5173/teacher-dashboard - Teacher Dashboard
echo   http://localhost:8000/docs              - API Documentation
echo.
echo 📝 Next Steps:
echo   1. Edit teacher-backend\.env with your configuration
echo   2. Set up your API keys (Google, OpenAI, etc.)
echo   3. Run start-all.bat to test the system
echo   4. Access the teacher dashboard and upload some test files
echo.
echo 📚 Documentation:
echo   TEACHER_DASHBOARD_ENHANCED.md - Comprehensive guide
echo   teacher-backend\schema.sql    - Database schema
echo.
echo 🎉 Happy teaching with AI-powered insights!
echo.
pause

#!/bin/bash

# BrainInk Teacher Dashboard Setup Script
# This script sets up the complete teacher dashboard environment

echo "🧠 BrainInk Teacher Dashboard Setup"
echo "===================================="

# Check if running on Windows (Git Bash, WSL, etc.)
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    echo "🪟 Windows environment detected"
    PYTHON_CMD="python"
    PIP_CMD="pip"
else
    echo "🐧 Unix-like environment detected"
    PYTHON_CMD="python3"
    PIP_CMD="pip3"
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check Python
if command_exists $PYTHON_CMD; then
    PYTHON_VERSION=$($PYTHON_CMD --version 2>&1 | awk '{print $2}')
    echo "✅ Python $PYTHON_VERSION found"
else
    echo "❌ Python not found. Please install Python 3.8 or higher."
    exit 1
fi

# Check Node.js
if command_exists node; then
    NODE_VERSION=$(node --version)
    echo "✅ Node.js $NODE_VERSION found"
else
    echo "❌ Node.js not found. Please install Node.js 16 or higher."
    exit 1
fi

# Check PostgreSQL
if command_exists psql; then
    PG_VERSION=$(psql --version | awk '{print $3}')
    echo "✅ PostgreSQL $PG_VERSION found"
else
    echo "⚠️  PostgreSQL not found. Install PostgreSQL 13+ for production."
    echo "   For development, you can use SQLite (will be configured automatically)"
fi

echo ""
echo "🚀 Setting up Teacher Dashboard..."

# Setup backend
echo "📦 Setting up Python backend..."
cd teacher-backend || exit 1

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "🔧 Creating Python virtual environment..."
    $PYTHON_CMD -m venv venv
fi

# Activate virtual environment
echo "🔄 Activating virtual environment..."
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    source venv/Scripts/activate
else
    source venv/bin/activate
fi

# Install Python dependencies
echo "📥 Installing Python dependencies..."
$PIP_CMD install -r requirements.txt

# Setup environment file
if [ ! -f ".env" ]; then
    echo "⚙️  Creating environment configuration..."
    cp .env.example .env
    echo "📝 Please edit teacher-backend/.env with your configuration"
else
    echo "✅ Environment file already exists"
fi

# Go back to root directory
cd ..

# Setup OCR service
echo "🔍 Setting up OCR service..."
cd teacher-ocr-service || exit 1

# Create virtual environment for OCR service
if [ ! -d "venv" ]; then
    echo "🔧 Creating OCR service virtual environment..."
    $PYTHON_CMD -m venv venv
fi

# Activate virtual environment
echo "🔄 Activating OCR virtual environment..."
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    source venv/Scripts/activate
else
    source venv/bin/activate
fi

# Install OCR dependencies
echo "📥 Installing OCR dependencies..."
$PIP_CMD install -r requirements.txt

cd ..

# Setup frontend dependencies
echo "🌐 Setting up frontend dependencies..."
if [ ! -d "node_modules" ]; then
    echo "📥 Installing npm packages..."
    npm install
else
    echo "✅ Node modules already installed"
fi

# Database setup
echo "🗄️  Database setup..."
if command_exists psql; then
    echo "Would you like to set up the PostgreSQL database now? (y/N)"
    read -r setup_db
    if [[ $setup_db =~ ^[Yy]$ ]]; then
        echo "📊 Setting up database..."
        echo "Please enter your PostgreSQL credentials:"
        read -p "Database name (default: brainink_teacher): " db_name
        db_name=${db_name:-brainink_teacher}
        
        echo "Creating database $db_name..."
        createdb $db_name 2>/dev/null || echo "Database may already exist"
        
        echo "Running schema script..."
        psql $db_name < teacher-backend/schema.sql
        
        echo "✅ Database setup complete"
    fi
else
    echo "⚠️  PostgreSQL not available. Using SQLite for development."
    echo "To use PostgreSQL in production, install it and update the DATABASE_URL in .env"
fi

# Create startup scripts
echo "📝 Creating startup scripts..."

# Create start-backend script
cat > start-backend.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting BrainInk Teacher Backend..."

# Start PostgreSQL (if using Docker)
if command -v docker >/dev/null 2>&1; then
    echo "🐳 Starting PostgreSQL with Docker..."
    docker run -d --name brainink-postgres \
        -e POSTGRES_DB=brainink_teacher \
        -e POSTGRES_PASSWORD=password \
        -p 5432:5432 \
        postgres:15 2>/dev/null || echo "PostgreSQL container may already be running"
fi

# Start backend
cd teacher-backend
source venv/bin/activate || source venv/Scripts/activate
echo "🔄 Starting FastAPI backend on http://localhost:8000"
python main.py &
BACKEND_PID=$!

# Start OCR service
cd ../teacher-ocr-service
source venv/bin/activate || source venv/Scripts/activate
echo "🔍 Starting OCR service on http://localhost:8001"
python main.py &
OCR_PID=$!

echo "✅ Backend services started!"
echo "📊 Teacher API: http://localhost:8000"
echo "🔍 OCR Service: http://localhost:8001"
echo "📖 API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop services"

# Wait for interrupt
trap "echo 'Stopping services...'; kill $BACKEND_PID $OCR_PID; exit" INT
wait
EOF

# Create start-frontend script
cat > start-frontend.sh << 'EOF'
#!/bin/bash
echo "🌐 Starting BrainInk Teacher Dashboard Frontend..."

# Start the frontend development server
npm run dev

echo "✅ Frontend started on http://localhost:5173"
echo "🧠 Teacher Dashboard: http://localhost:5173/teacher-dashboard"
EOF

# Create complete startup script
cat > start-all.sh << 'EOF'
#!/bin/bash
echo "🧠 Starting Complete BrainInk Teacher Dashboard System..."

# Start backend services in background
./start-backend.sh &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend
./start-frontend.sh &
FRONTEND_PID=$!

echo "✅ All services started!"
echo "🌐 Frontend: http://localhost:5173"
echo "🧠 Teacher Dashboard: http://localhost:5173/teacher-dashboard"
echo "📊 Backend API: http://localhost:8000"
echo "📖 API Documentation: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for interrupt
trap "echo 'Stopping all services...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
EOF

# Make scripts executable
chmod +x start-backend.sh start-frontend.sh start-all.sh

echo ""
echo "✅ Setup Complete!"
echo "=================="
echo ""
echo "📁 Project Structure:"
echo "  teacher-backend/     - FastAPI backend with PostgreSQL"
echo "  teacher-ocr-service/ - OCR microservice with PaddleOCR"
echo "  src/services/        - Frontend API integration"
echo ""
echo "🚀 To start the system:"
echo "  ./start-all.sh       - Start everything (recommended)"
echo "  ./start-backend.sh   - Start only backend services"
echo "  ./start-frontend.sh  - Start only frontend"
echo ""
echo "🌐 Access URLs:"
echo "  http://localhost:5173/teacher-dashboard - Teacher Dashboard"
echo "  http://localhost:8000/docs              - API Documentation"
echo ""
echo "📝 Next Steps:"
echo "  1. Edit teacher-backend/.env with your configuration"
echo "  2. Set up your API keys (Google, OpenAI, etc.)"
echo "  3. Run ./start-all.sh to test the system"
echo "  4. Access the teacher dashboard and upload some test files"
echo ""
echo "📚 Documentation:"
echo "  TEACHER_DASHBOARD_ENHANCED.md - Comprehensive guide"
echo "  teacher-backend/schema.sql    - Database schema"
echo ""
echo "🎉 Happy teaching with AI-powered insights!"

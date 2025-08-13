# Quick Start Guide - TaskFlow

This guide provides simple instructions for getting TaskFlow running quickly.

## 🚀 Option 1: Docker (Recommended)

### Prerequisites
- Docker and Docker Compose installed

### Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd 3-tier-app
   ```

2. **Start the application**
   ```bash
   # Using automation script (recommended)
   ./scripts/build-and-run.sh --detached
   
   # Or manually
   docker-compose up -d
   ```

3. **Wait for services to start** (~30 seconds)
   ```bash
   # Check status
   docker-compose ps
   
   # View logs
   docker-compose logs -f
   ```

4. **Access the application**
   - **Frontend**: http://localhost:3000
   - **Backend API**: http://localhost:5000  
   - **Swagger UI**: http://localhost:5000/swagger

5. **Stop the application**
   ```bash
   docker-compose down
   ```

## 💻 Option 2: Local Development

### Prerequisites
- .NET 8 SDK
- Node.js 18+
- npm

### Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd 3-tier-app
   ```

2. **Start the backend**
   ```bash
   cd backend/TaskManagement.API
   dotnet restore
   dotnet run
   ```
   Backend will start at: http://localhost:5000

3. **Start the frontend** (in a new terminal)
   ```bash
   cd frontend
   npm install
   npm start
   ```
   Frontend will start at: http://localhost:3000

## ☸️ Option 3: Kubernetes

### Prerequisites
- kubectl configured
- Kubernetes cluster (minikube, Docker Desktop, etc.)

### Steps

1. **Clone and deploy**
   ```bash
   git clone <repository-url>
   cd 3-tier-app
   
   # Deploy using script
   ./scripts/deploy-k8s.sh --build-images
   ```

2. **Access the application**
   ```bash
   # Port forward to access locally
   kubectl port-forward service/taskmanagement-frontend-service 3000:80 -n taskmanagement
   ```
   Then access: http://localhost:3000

## 🎯 Using the Application

### Initial Setup
The application comes with sample data:
- **Users**: John Doe, Jane Smith, Bob Johnson
- **Categories**: Development, Testing, Documentation, Bug Fix
- **Tasks**: Several sample tasks with different statuses

### Key Features
1. **Dashboard**: Overview with statistics and recent tasks
2. **Task Management**: Create, edit, delete, and filter tasks
3. **User Management**: Manage team members
4. **Category Management**: Organize tasks with color-coded categories
5. **Dark Mode**: Toggle between light and dark themes

### Navigation
- **Dashboard**: Main overview page
- **Tasks**: View and manage all tasks
- **Users**: Manage team members
- **Categories**: Organize task categories

## 🔧 Troubleshooting

### Common Issues

1. **Port conflicts**
   ```bash
   # Check what's using the ports
   netstat -tulpn | grep :3000
   netstat -tulpn | grep :5000
   ```

2. **Services not starting**
   ```bash
   # Check logs
   docker-compose logs
   
   # Restart services
   docker-compose restart
   ```

3. **Database issues**
   - SQLite database is created automatically
   - Database file location: `./backend/TaskManagement.API/data/`

4. **Frontend build issues**
   ```bash
   # Clean install
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   ```

### Getting Help

**Check application health:**
```bash
curl http://localhost:5000/health
```

**View all logs:**
```bash
# Docker
docker-compose logs -f

# Local development
# Check terminal outputs for backend and frontend
```

**Clean restart:**
```bash
# Docker
docker-compose down -v
docker-compose up -d

# Local development
# Stop both terminals and restart
```

## 🎉 Success!

Once running, you'll have a fully functional task management application with:
- Modern dark mode UI
- Complete CRUD operations for tasks, users, and categories
- Real-time filtering and search
- Professional dashboard with statistics
- Mobile-responsive design

Perfect for demonstrations and development projects!
